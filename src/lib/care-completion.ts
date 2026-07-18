/**
 * Care completion helpers — keep health_tasks and vaccination_schedule in sync.
 * Completing either writer must update the other for the same flock/product.
 */
import { addDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isOffline, queueWrite } from '@/lib/sync';

/** True when a health task is a vaccination protocol row. */
export function isVaccinationHealthTask(task: {
  task_type?: string | null;
  product_name?: string | null;
}): boolean {
  return task.task_type === 'vaccination';
}

/**
 * Mark matching vaccination_schedule rows administered when a health_task is completed.
 */
export async function syncScheduleFromHealthTask(params: {
  batchId: string;
  productName: string;
  completedAt?: string;
}): Promise<number> {
  const { batchId, productName, completedAt = new Date().toISOString() } = params;
  if (!productName?.trim()) return 0;

  const { data, error } = await supabase
    .from('vaccination_schedule')
    .update({
      administered: true,
      administered_at: completedAt ?? new Date().toISOString(),
    })
    .eq('batch_id', batchId)
    .eq('vaccine_name', productName)
    .eq('administered', false)
    .select('id');

  if (error) {
    console.error('syncScheduleFromHealthTask:', error.message);
    toast.error(`Failed to sync vaccination schedule: ${error.message}`);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Mark matching health_tasks completed when a vaccination_schedule row is administered.
 */
export async function syncHealthTaskFromSchedule(params: {
  batchId: string;
  vaccineName: string;
  completedAt?: string;
}): Promise<number> {
  const { batchId, vaccineName, completedAt = new Date().toISOString() } = params;
  if (!vaccineName?.trim()) return 0;

  const { data, error } = await supabase
    .from('health_tasks')
    .update({
      completed: true,
      completed_at: completedAt,
    })
    .eq('batch_id', batchId)
    .eq('product_name', vaccineName)
    .eq('task_type', 'vaccination')
    .eq('completed', false)
    .select('id');

  if (error) {
    console.error('syncHealthTaskFromSchedule:', error.message);
    toast.error(`Failed to sync health task: ${error.message}`);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * After bulk-completing health_tasks for a week, mark schedule rows that now have a completed twin.
 */
export async function syncScheduleForCompletedVaccinationTasks(batchId: string): Promise<void> {
  const { data: doneVax } = await supabase
    .from('health_tasks')
    .select('product_name')
    .eq('batch_id', batchId)
    .eq('task_type', 'vaccination')
    .eq('completed', true);

  const names = Array.from(
    new Set((doneVax ?? []).map((t) => t.product_name).filter(Boolean) as string[])
  );
  if (names.length === 0) return;

  const { error } = await supabase
    .from('vaccination_schedule')
    .update({
      administered: true,
      administered_at: new Date().toISOString(),
    })
    .eq('batch_id', batchId)
    .eq('administered', false)
    .in('vaccine_name', names);

  if (error) {
    console.error('syncScheduleForCompletedVaccinationTasks:', error.message);
    toast.error(`Failed to sync completed vaccination tasks: ${error.message}`);
  }
}

/**
 * Post-RPC side-effects for a single completed health task.
 * Shared by single complete and bulk complete paths.
 *
 * K6: intensive stock/expense are owned by `complete_health_task` / bulk RPC only.
 * This helper must NOT re-ledger (double-expense risk). Keep non-money side-effects only.
 * Book now remains interactive on flexible systems (useMedicationLogic toast).
 */
export async function runPostCompletionSideEffects(params: {
  farmId: string;
  task: { id: string; batch_id: string; task_type?: string | null; product_name?: string | null; duration_days?: number | null; computed_dose_amount?: string | number | null; computed_dose_unit?: string | null; container_count?: number | null; cost_pesewas?: number | null };
  costPesewas?: number;
}): Promise<void> {
  const { farmId, task } = params;
  void params.costPesewas; // cost is ledgered only inside complete_health_task when intensive

  if (isVaccinationHealthTask(task)) {
    await seedPostVaccinationSupplements(farmId, task.batch_id);
  }
}

/** Spec protocol: anti-stress + multivitamin days after a live vaccine. */
export async function seedPostVaccinationSupplements(
  farmId: string,
  batchId: string
): Promise<void> {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dayAfter = format(addDays(new Date(), 2), 'yyyy-MM-dd');

  const supplementRows = [
    {
      batch_id: batchId,
      farm_id: farmId,
      task_type: 'supplement',
      product_name: 'Anti-Stress Vitamins',
      medication_id: 'anti_stress',
      delivery_method: 'drinking_water',
      scheduled_date: tomorrow,
      completed: false,
      duration_days: 1,
      withdrawal_meat_days: 0,
      withdrawal_egg_days: 0,
    },
    {
      batch_id: batchId,
      farm_id: farmId,
      task_type: 'supplement',
      product_name: 'Anti-Stress Vitamins',
      medication_id: 'anti_stress',
      delivery_method: 'drinking_water',
      scheduled_date: dayAfter,
      completed: false,
      duration_days: 1,
      withdrawal_meat_days: 0,
      withdrawal_egg_days: 0,
    },
    {
      batch_id: batchId,
      farm_id: farmId,
      task_type: 'supplement',
      product_name: 'Multivitamins',
      medication_id: 'multivitamins',
      delivery_method: 'drinking_water',
      scheduled_date: dayAfter,
      completed: false,
      duration_days: 1,
      withdrawal_meat_days: 0,
      withdrawal_egg_days: 0,
    },
  ];

  if (isOffline()) {
    for (const row of supplementRows) {
      const tempId = crypto.randomUUID();
      await queueWrite('health_tasks', 'insert', tempId, row as unknown as Record<string, unknown>);
    }
    return;
  }

  // Idempotent upsert on unique (batch_id, medication_id, scheduled_date).
  // Row-at-a-time so one conflict never blocks the rest.
  let hardError: string | null = null;
  for (const row of supplementRows) {
    const { error } = await supabase.from('health_tasks').upsert(row, {
      onConflict: 'batch_id,medication_id,scheduled_date',
      ignoreDuplicates: true,
    });
    if (!error) continue;
    if (/duplicate|unique|conflict/i.test(error.message)) continue;
    const { error: insErr } = await supabase.from('health_tasks').insert(row);
    if (insErr && !/duplicate|unique/i.test(insErr.message)) {
      hardError = insErr.message;
    }
  }
  if (hardError) {
    console.error('seedPostVaccinationSupplements:', hardError);
    // Non-blocking: vaccination already completed; supplements are best-effort
  }
}
