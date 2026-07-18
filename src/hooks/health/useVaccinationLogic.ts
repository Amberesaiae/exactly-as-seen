import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isOffline, queueWrite, queueRpc } from '@/lib/sync';
import { seedPostVaccinationSupplements } from '@/lib/care-completion';
import { buildVaccinationSeedRows } from '@/lib/vaccination-seed';

export function useVaccinationLogic(farmId: string | null, batch: any) {
  const [generatingVaccines, setGeneratingVaccines] = useState(false);
  const [vaccinations, setVaccinations] = useState<any[]>([]);

  const generateVaccinationSchedule = async () => {
    if (!farmId || !batch) return;
    setGeneratingVaccines(true);
    // H4: same seed builder as create_batch
    const seeds = buildVaccinationSeedRows({
      species: batch.species,
      startDate: batch.start_date,
      cycleLengthWeeks: batch.cycle_length_weeks ?? 99,
    });
    const records = seeds.map((s) => ({
      batch_id: batch.id,
      farm_id: farmId,
      vaccine_name: s.vaccine_name,
      scheduled_week: s.scheduled_week,
      scheduled_date: s.scheduled_date,
    }));

    if (records.length === 0) {
      toast.error('No vaccination templates for this species/cycle');
      setGeneratingVaccines(false);
      return;
    }

    if (isOffline()) {
      const tempIds = records.map(() => crypto.randomUUID());
      for (let i = 0; i < records.length; i++) {
        await queueWrite('vaccination_schedule', 'insert', tempIds[i], records[i] as unknown as Record<string, unknown>);
      }
      const offlineEntries = records.map((r, i) => ({ ...r, id: tempIds[i], created_at: new Date().toISOString() }));
      setVaccinations(offlineEntries as any[]);
      await supabase.from('activity_log').insert({
        farm_id: farmId,
        batch_id: batch.id,
        event_type: 'vaccination',
        description: `Generated ${records.length} vaccination schedule entries for ${batch.name} (offline)`,
      }).then(({ error: actErr }) => { if (actErr) console.debug('Activity log failed:', actErr); });
      toast.success(`Generated ${records.length} vaccinations (offline — will sync)`);
      setGeneratingVaccines(false);
      return;
    }

    const { data, error } = await supabase.from('vaccination_schedule').insert(records).select();
    if (error) {
      toast.error(error.message);
      setGeneratingVaccines(false);
      return;
    }

    setVaccinations(data ?? []);
    const { error: actErr } = await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'vaccination',
      description: `Generated ${records.length} vaccination schedule entries for ${batch.name}`,
    });
    if (actErr) console.debug('Activity log failed:', actErr);

    toast.success(`Generated ${records.length} vaccinations`);
    setGeneratingVaccines(false);
  };

  /**
   * K5: sole spine is complete_health_task (same as This Week care).
   * Never primary-update vaccination_schedule + dual-sync health_tasks from FE.
   */
  const markVaccineAdministered = async (
    vId: string,
    currentVaccinations: any[],
    costPesewas: number = 0,
    notes?: string
  ) => {
    if (!farmId || !batch?.id) {
      toast.error('Farm or batch not ready');
      return false;
    }

    const vaccine = currentVaccinations.find((v) => v.id === vId);
    if (!vaccine?.vaccine_name) {
      toast.error('Vaccine not found');
      return false;
    }

    // Prefer matching incomplete protocol task (create_batch / This Week seed)
    const { data: task, error: taskErr } = await supabase
      .from('health_tasks')
      .select('id, product_name, task_type, completed')
      .eq('batch_id', batch.id)
      .eq('farm_id', farmId)
      .eq('task_type', 'vaccination')
      .eq('product_name', vaccine.vaccine_name)
      .eq('completed', false)
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (taskErr) {
      toast.error(taskErr.message);
      return false;
    }
    if (!task?.id) {
      toast.error(
        `No open care task for ${vaccine.vaccine_name}. Complete from This Week, or re-seed protocol.`
      );
      return false;
    }

    const completedAt = new Date().toISOString();
    const rpcArgs = {
      p_farm_id: farmId,
      p_task_id: task.id,
      p_cost_pesewas: costPesewas || 0,
      p_completed_at: completedAt,
    };

    if (isOffline()) {
      await queueRpc('complete_health_task', rpcArgs, task.id);
      const updated = currentVaccinations.map((v) =>
        v.id === vId ? { ...v, administered: true, administered_at: completedAt } : v
      );
      setVaccinations(updated);
      toast.warning('Offline — vaccine complete queued; will sync when online');
      return true;
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc('complete_health_task', rpcArgs);
    if (rpcError) {
      toast.error(rpcError.message || 'Failed to complete vaccination');
      return false;
    }
    if (rpcResult?.already_completed) {
      toast.error('This care task was already completed');
      // still refresh local schedule UI if RPC synced
    }

    // Non-money side-effect only (supplements). Ledger is inside RPC when intensive.
    try {
      await seedPostVaccinationSupplements(farmId, batch.id);
    } catch (e) {
      console.error('Post-vax supplement seed failed:', e);
      toast.warning('Vaccine completed, but supplement seed failed');
    }

    if (notes && farmId) {
      const { error: actErr } = await supabase.from('activity_log').insert({
        farm_id: farmId,
        batch_id: batch.id,
        event_type: 'vaccination',
        description: `Administered ${vaccine.vaccine_name}: ${notes}`,
      });
      if (actErr) console.debug('Activity log failed:', actErr);
    }

    const updated = currentVaccinations.map((v) =>
      v.id === vId ? { ...v, administered: true, administered_at: completedAt } : v
    );
    setVaccinations(updated);
    toast.success(`Administered ${vaccine.vaccine_name}`);
    return true;
  };

  return {
    generatingVaccines,
    vaccinations,
    setVaccinations,
    generateVaccinationSchedule,
    markVaccineAdministered,
  };
}
