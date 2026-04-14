import { differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

/** Species-specific phase definitions */
const PHASE_DEFINITIONS: Record<string, { name: string; weekEnd: number }[]> = {
  broiler: [
    { name: 'starter', weekEnd: 2 },
    { name: 'grower', weekEnd: 5 },
    { name: 'finisher', weekEnd: 99 },
  ],
  layer: [
    { name: 'chick', weekEnd: 8 },
    { name: 'grower', weekEnd: 18 },
    { name: 'layer', weekEnd: 99 },
  ],
  duck: [
    { name: 'starter', weekEnd: 3 },
    { name: 'grower', weekEnd: 7 },
    { name: 'finisher', weekEnd: 99 },
  ],
  turkey: [
    { name: 'starter', weekEnd: 4 },
    { name: 'grower', weekEnd: 12 },
    { name: 'finisher', weekEnd: 99 },
  ],
};

export interface BatchAge {
  day: number;
  week: number;
  phase: string;
}

export function getBatchAge(startDate: string, species: string): BatchAge {
  const start = new Date(startDate);
  const today = new Date();
  const totalDays = Math.max(0, differenceInDays(today, start));
  const day = totalDays + 1;
  const week = Math.floor(totalDays / 7) + 1;

  const phases = PHASE_DEFINITIONS[species] ?? PHASE_DEFINITIONS.broiler;
  let phase = phases[phases.length - 1].name;
  for (const p of phases) {
    if (week <= p.weekEnd) {
      phase = p.name;
      break;
    }
  }

  return { day, week, phase };
}

export function formatSpecies(species: string): string {
  return species.charAt(0).toUpperCase() + species.slice(1);
}

export function mortalityRate(initial: number, current: number): string {
  if (initial <= 0) return '0.0';
  return (((initial - current) / initial) * 100).toFixed(1);
}

/**
 * Shared mortality recording logic used by Dashboard, Batches, and BatchDetail.
 * Returns the new population on success, or null on failure.
 */
export async function recordMortality(params: {
  batchId: string;
  farmId: string;
  batchName: string;
  currentPopulation: number;
  count: number;
  cause?: string;
  notes?: string;
}): Promise<number | null> {
  const { batchId, farmId, batchName, currentPopulation, count, cause, notes } = params;

  const { error: mrError } = await supabase.from('mortality_records').insert({
    batch_id: batchId,
    farm_id: farmId,
    count,
    cause: cause || null,
    notes: notes || null,
  });
  if (mrError) return null;

  const newPop = Math.max(0, currentPopulation - count);
  const { error: bError } = await supabase.from('batches').update({ current_population: newPop }).eq('id', batchId);
  if (bError) return null;

  await supabase.from('activity_log').insert({
    farm_id: farmId,
    batch_id: batchId,
    event_type: 'mortality',
    description: `Recorded ${count} mortality in ${batchName}${cause ? `: ${cause}` : ''}`,
  });

  return newPop;
}

/**
 * When a batch is completed, mark all pending feed schedules and vaccinations.
 */
export async function cleanupBatchCompletion(batchId: string) {
  // Mark pending feed schedules as completed (skipped)
  await supabase.from('feed_schedules')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('batch_id', batchId)
    .eq('completed', false);

  // Mark pending vaccinations as administered (missed)
  await supabase.from('vaccination_schedule')
    .update({ administered: true, administered_at: new Date().toISOString() })
    .eq('batch_id', batchId)
    .eq('administered', false);

  // Mark pending health tasks as completed
  await supabase.from('health_tasks')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('batch_id', batchId)
    .eq('completed', false);
}
