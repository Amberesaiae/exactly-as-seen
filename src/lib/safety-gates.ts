/**
 * Pure safety gates for sales and termination (research withdrawal rules).
 */

export function canSellBirds(batch: { has_active_withdrawal?: boolean | null } | null | undefined): boolean {
  return !batch?.has_active_withdrawal;
}

export function canSellEggs(batch: { has_active_withdrawal?: boolean | null } | null | undefined): boolean {
  return !batch?.has_active_withdrawal;
}

/** Normal terminate blocked during withdrawal; emergency always allowed. */
export function canTerminateNormal(
  batch: { has_active_withdrawal?: boolean | null } | null | undefined,
  mode: 'normal' | 'emergency' = 'normal'
): boolean {
  if (mode === 'emergency') return true;
  return !batch?.has_active_withdrawal;
}

export function canCollectEggs(args: {
  species?: string | null;
  duckType?: string | null;
  week: number;
  layerStartWeek: number;
  duckLayerStartWeek: number;
}): boolean {
  const { species, duckType, week, layerStartWeek, duckLayerStartWeek } = args;
  if (!species) return false;
  if (species === 'layer') return week >= layerStartWeek;
  if (species === 'duck' && duckType === 'layer') return week >= duckLayerStartWeek;
  if (species === 'duck') return false; // meat ducks
  return week >= layerStartWeek;
}
