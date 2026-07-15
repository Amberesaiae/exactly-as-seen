import { differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RecordMortalityReturn = Database['public']['Functions']['record_mortality']['Returns'];

/** Species-specific phase definitions */
const PHASE_DEFINITIONS: Record<string, { name: string; weekEnd: number }[]> = {
  broiler: [
    { name: 'starter', weekEnd: 3 },
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

  if (count <= 0 || count > currentPopulation) return null;

  // Offline: queue atomic RPC for flush when online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const { queueRpc } = await import('@/lib/sync');
    await queueRpc('record_mortality', {
      p_farm_id: farmId,
      p_batch_id: batchId,
      p_count: count,
      p_cause: cause || null,
      p_notes: notes || null,
    }, `mortality:${batchId}:${Date.now()}`);
    return Math.max(0, currentPopulation - count);
  }

  // Prefer atomic RPC (mortality + population + activity)
  const { data: rpcData, error: rpcError } = await supabase.rpc('record_mortality', {
    p_farm_id: farmId,
    p_batch_id: batchId,
    p_count: count,
    p_cause: cause || null,
    p_notes: notes || null,
  });

  if (!rpcError && rpcData && (rpcData as RecordMortalityReturn).ok) {
    return Number((rpcData as RecordMortalityReturn).new_population);
  }

  if (rpcError) {
    console.warn('record_mortality RPC failed:', rpcError.message);
    throw new Error(rpcError.message);
  }

  throw new Error((rpcData as RecordMortalityReturn)?.error ?? 'record_mortality failed');
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
