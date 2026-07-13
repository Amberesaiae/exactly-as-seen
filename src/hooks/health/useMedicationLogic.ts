import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { detectConflicts } from '@/lib/medication-conflicts';
import { autoCreateExpense, autoDeductStock } from '@/lib/synergy';
import { shouldAutoLedger } from '@/lib/production-system';
import { LEDGER_SOURCES } from '@/lib/canonical';
import {
  isVaccinationHealthTask,
  seedPostVaccinationSupplements,
  syncScheduleFromHealthTask,
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

    const { data: task, error } = await supabase.from('health_tasks').insert({
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
    }).select().single();

    if (error) { toast.error(error.message); setMedSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batchId,
      event_type: 'health_task',
      description: `Started ${newMed.name} — ${params.durationDays}d course`,
    });

    setTasks(prev => [task, ...prev]);
    setMedSubmitting(false);
    toast.success('Medication recorded');
    return task;
  };

  const markTaskComplete = async (taskId: string, costPesewas: number = 0) => {
    const task = healthTasks.find(t => t.id === taskId);
    if (!task) return;

    const completedAt = new Date();
    const completedAtISO = completedAt.toISOString();

    let withdrawalMeatUntil: string | null = null;
    let withdrawalEggsUntil: string | null = null;
    let hasWithdrawal = false;

    if (task.withdrawal_meat_days && task.withdrawal_meat_days > 0) {
      withdrawalMeatUntil = format(addDays(completedAt, task.withdrawal_meat_days), 'yyyy-MM-dd');
      hasWithdrawal = true;
    }
    if (task.withdrawal_egg_days && task.withdrawal_egg_days > 0) {
      withdrawalEggsUntil = format(addDays(completedAt, task.withdrawal_egg_days), 'yyyy-MM-dd');
      hasWithdrawal = true;
    }

    const { error } = await supabase.from('health_tasks')
      .update({ 
        completed: true, 
        completed_at: completedAtISO,
        withdrawal_meat_until: withdrawalMeatUntil,
        withdrawal_eggs_until: withdrawalEggsUntil,
        cost_pesewas: costPesewas || null
      })
      .eq('id', taskId);

    if (error) { toast.error(error.message); return; }

    if (hasWithdrawal) {
      await supabase.from('batches').update({ has_active_withdrawal: true }).eq('id', batchId);
    }

    // Dual writer: health_tasks complete → vaccination_schedule
    if (isVaccinationHealthTask(task) && task.product_name) {
      await syncScheduleFromHealthTask({
        batchId: task.batch_id,
        productName: task.product_name,
        completedAt: completedAtISO,
      });
      if (farmId) {
        await seedPostVaccinationSupplements(farmId, task.batch_id);
      }
    }

    const { data: activeBatch } = await supabase.from('batches').select('production_system').eq('id', task.batch_id).maybeSingle();
    const autoLedger = shouldAutoLedger(activeBatch?.production_system);

    if (autoLedger && task.product_name) {
      await autoDeductStock({
        farmId, itemName: task.product_name, 
        quantity: task.computed_dose_amount ? Number(task.computed_dose_amount) : (task.container_count ?? 1),
        batchId: task.batch_id, reason: `Auto-deduction for health task: ${task.product_name}`,
        sourceRef: taskId, doseUnit: task.computed_dose_unit,
      });

      await autoCreateExpense({
        farmId, batchId: batchId, category: 'health_and_medicine',
        description: `${task.product_name} — ${task.duration_days}d course`,
        amount: costPesewas / 100,
        source: isVaccinationHealthTask(task) ? LEDGER_SOURCES.vaccination : LEDGER_SOURCES.health,
        sourceRef: taskId,
      });
    }

    toast.success('Task completed');
    return { withdrawalMeatUntil, withdrawalEggsUntil, hasWithdrawal, isVaccination: isVaccinationHealthTask(task) };
  };

  return {
    medSubmitting,
    tasks,
    setTasks,
    addMedication,
    markTaskComplete,
  };
}
