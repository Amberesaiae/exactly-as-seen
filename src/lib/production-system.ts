/**
 * Canonical production-system helpers.
 *
 * UI stores housing styles (deep_litter, cage) for intensive flocks and
 * semi_intensive / free_range / pasture for flexible systems.
 * Business logic needs intensive vs non-intensive only.
 */

export type ProductionSystem =
  | 'intensive'
  | 'deep_litter'
  | 'cage'
  | 'semi_intensive'
  | 'free_range'
  | 'pasture'
  | string
  | null
  | undefined;

const INTENSIVE_SYSTEMS = new Set([
  'intensive',
  'deep_litter',
  'cage',
]);

const SEMI_INTENSIVE_SYSTEMS = new Set([
  'semi_intensive',
  'free_range',
  'pasture',
]);

/** True when auto stock/expense patterns should apply. */
export function isIntensiveSystem(system: ProductionSystem): boolean {
  if (!system) return true; // default intensive if unset
  return INTENSIVE_SYSTEMS.has(system);
}

/** True when foraging reductions / flexible feed apply. */
export function isSemiIntensiveSystem(system: ProductionSystem): boolean {
  if (!system) return false;
  return SEMI_INTENSIVE_SYSTEMS.has(system);
}

/** Display label for UI badges. */
export function productionSystemLabel(system: ProductionSystem): string {
  if (isIntensiveSystem(system)) {
    if (system === 'cage') return 'Cage (Intensive)';
    if (system === 'deep_litter') return 'Deep Litter (Intensive)';
    return 'Intensive';
  }
  if (system === 'free_range') return 'Free Range';
  if (system === 'pasture') return 'Pasture-Based';
  if (system === 'semi_intensive') return 'Semi-Intensive';
  return system ? String(system).replace(/_/g, ' ') : 'Unknown';
}
