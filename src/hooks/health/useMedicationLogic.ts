import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { detectConflicts } from '@/lib/medication-conflicts';
import { autoCreateExpense, autoDeductStock } from '@/lib/synergy';
import { shouldOfferBookNow } from '@/lib/ledger-policy';
import { LEDGER_SOURCES } from '@/lib/canonical';
import { isOffline, queueWrite } from '@/lib/sync';
import {
  isVaccinationHealthTask,
  runPostCompletionSideEffects,
} from '@/lib/care-completion';
import type { Database } from '@/integrations/supabase/types';

type Medication = Database['public']['Tables']['medications']['Row'];
type HealthTask = Database['public']['Tables']['health_tasks']['Row'];

export function useMedicationLogic(
  farmId: string | null,
  batchId: string,
  medications: Medication[],
  waterSourceChlorinated: boolean,
  healthTasks: HealthTask[]
) {
  const [medSubmitting, setMedSubmitting] = useState(false);
  const [tasks, setTasks] = useState<HealthTask[]>([]);

  const addMedication = async (params: any) => {
    if (!farmId || !batchId) return;

    const newMed = medications.find(m => m.id === params.medicationId);
    if (!newMed) {
      toast.error("Invalid medication selected");
      return;
    }

    const newDate = params.scheduledDate || format(new Date(), 'yyyy-MM-dd');
    const newDuration = params.durationDays;

    const neighborhood = healthTasks
      .map(t => {
        const med = medications.find(m => m.id === t.medication_id);
        return { task: t, med };
      })
      .filter((item): item is { task: any; med: any } => item.med !== undefined);

    const conflicts = detectConflicts({
      newMed,
      newDate,
      newDuration,
      neighborhood,
      waterSourceChlorinated,
    });

    const blocks = conflicts.filter(c => c.severity === 'BLOCK');
    const warnings = conflicts.filter(c => c.severity === 'WARN');

    if (blocks.length > 0) {
      blocks.forEach(b => toast.error(b.message));
      return;
    }

    if (warnings.length > 0) {
      warnings.forEach(w => toast.warning(w.message));
    }

    setMedSubmitting(true);
    const dosingInfo = params.dosePerGallon ? `${params.dosePerGallon} | ${params.indication || ''}` : '';

    const insertData = {
      batch_id: batchId,
      farm_id: farmId,
      task_type: params.taskType,
      product_name: newMed.name,
      medication_id: params.medicationId,
      delivery_method: newMed.delivery_method,
      container_type_id: params.containerTypeId || null,
      container_count: params.containerCount || null,
      water_volume_l: params.waterVolumeL || null,
      computed_dose_amount: params.computedDoseAmount || null,
      computed_dose_unit: params.computedDoseUnit || null,
      bird_count: params.birdCount || null,
      duration_days: params.durationDays,
      withdrawal_meat_days: params.withdrawalMeatDays,
      withdrawal_egg_days: params.withdrawalEggDays,
      cost_pesewas: params.costPesewas || null,
      scheduled_date: newDate,
      notes: params.notes ? `${dosingInfo}\n${params.notes}` : dosingInfo,
    };

    if (isOffline()) {
      const tempId = crypto.randomUUID();
      await queueWrite('health_tasks', 'insert', tempId, insertData as unknown as Record<string, unknown>);
      const task = { ...insertData, id: tempId, created_at: new Date().toISOString() } as unknown as HealthTask;
      setTasks(prev => [task, ...prev]);
      setMedSubmitting(false);
      toast.success('Medication recorded (offline — will sync)');
      return task;
    }

    const { data: task, error } = await supabase.from('health_tasks').insert(insertData).select().single();

    if (error) { toast.error(error.message); setMedSubmitting(false); return; }

    const { error: actErr } = await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batchId,
      event_type: 'health_task',
      description: `Started ${newMed.name} — ${params.durationDays}d course`,
    });
    if (actErr) console.debug('Activity log failed:', actErr);

    setTasks(prev => [task, ...prev]);
    setMedSubmitting(false);
    toast.success('Medication recorded');
    return task;
  };

  const markTaskComplete = async (taskId: string, costPesewas: number = 0) => {
    const task = healthTasks.find(t => t.id === taskId);
    if (!task || !farmId) return;

    const completedAt = new Date();
    const completedAtISO = completedAt.toISOString();
    const amountMajor = costPesewas / 100;
    const qty = task.computed_dose_amount ? Number(task.computed_dose_amount) : (task.container_count ?? 1);
    const source = isVaccinationHealthTask(task) ? LEDGER_SOURCES.vaccination : LEDGER_SOURCES.health;
    const description = `${task.product_name} — ${task.duration_days}d course`;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const { queueRpc } = await import('@/lib/sync');
      await queueRpc('complete_health_task', {
        p_farm_id: farmId,
        p_task_id: taskId,
        p_cost_pesewas: costPesewas || 0,
        p_completed_at: completedAtISO,
      }, taskId);
      toast.warning('Offline — care complete queued; will sync when online');
      return {
        withdrawalMeatUntil: task.withdrawal_meat_days
          ? format(addDays(completedAt, task.withdrawal_meat_days), 'yyyy-MM-dd')
          : null,
        withdrawalEggsUntil: task.withdrawal_egg_days
          ? format(addDays(completedAt, task.withdrawal_egg_days), 'yyyy-MM-dd')
          : null,
        hasWithdrawal: !!(task.withdrawal_meat_days || task.withdrawal_egg_days),
        isVaccination: isVaccinationHealthTask(task),
        offline: true,
      };
    }

    // Prefer atomic RPC (health_tasks + vaccination_schedule + intensive expense)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('complete_health_task', {
      p_farm_id: farmId,
      p_task_id: taskId,
      p_cost_pesewas: costPesewas || 0,
      p_completed_at: completedAtISO,
    });

    // K6: fail closed on RPC — no client multi-write rescue
    if (rpcError) {
      toast.error(rpcError.message || 'Failed to complete care task');
      return;
    }

    // Supplements only (no stock/expense — RPC owns intensive ledger)
    try {
      await runPostCompletionSideEffects({ farmId, task, costPesewas });
    } catch (e) {
      console.error('Post-completion side effects failed:', e);
      toast.warning('Task completed, but some side-effects failed to sync');
    }

    const { data: activeBatch } = await supabase.from('batches').select('production_system').eq('id', task.batch_id).maybeSingle();
    const system = activeBatch?.production_system as string | null;

    if (shouldOfferBookNow(system) && amountMajor > 0) {
      const description = `${task.product_name} — ${task.duration_days}d course`;
      const source = isVaccinationHealthTask(task) ? LEDGER_SOURCES.vaccination : LEDGER_SOURCES.health;
      toast.message('Task completed (flexible — not auto-ledgered)', {
        duration: 8000,
        action: {
          label: 'Book now',
          onClick: async () => {
            try {
              await autoDeductStock({
                farmId, itemName: task.product_name!,
                quantity: qty,
                batchId: task.batch_id,
                reason: `Booked health task: ${task.product_name}`,
                sourceRef: `${taskId}:book`,
                doseUnit: task.computed_dose_unit,
              });
              await autoCreateExpense({
                farmId, batchId: task.batch_id, category: 'health_and_medicine',
                description: `${description} (booked)`,
                amount: amountMajor,
                source,
                sourceRef: `${taskId}:book`,
              });
              toast.success('Health expense booked');
            } catch (e) {
              console.error('Book now health error:', e);
              toast.error('Failed to book health expense');
            }
          },
        },
      });
    } else {
      toast.success('Task completed');
    }

    const withdrawalMeatUntil = rpcResult?.withdrawal_meat_until
      ?? (task.withdrawal_meat_days ? format(addDays(completedAt, task.withdrawal_meat_days), 'yyyy-MM-dd') : null);
    const withdrawalEggsUntil = rpcResult?.withdrawal_eggs_until
      ?? (task.withdrawal_egg_days ? format(addDays(completedAt, task.withdrawal_egg_days), 'yyyy-MM-dd') : null);
    const hasWithdrawal = !!rpcResult?.has_withdrawal
      || !!(task.withdrawal_meat_days || task.withdrawal_egg_days);

    return {
      withdrawalMeatUntil,
      withdrawalEggsUntil,
      hasWithdrawal,
      isVaccination: isVaccinationHealthTask(task),
    };
  };

  return {
    medSubmitting,
    tasks,
    setTasks,
    addMedication,
    markTaskComplete,
  };
}
