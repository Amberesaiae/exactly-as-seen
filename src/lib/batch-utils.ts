import { differenceInDays } from 'date-fns';

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
  day: number;    // 1-based total day
  week: number;   // 1-based week number
  phase: string;  // auto-computed phase name
}

/**
 * Compute the current age of a batch from its start_date.
 * Returns day (1-based), week (1-based), and auto-determined phase.
 */
export function getBatchAge(startDate: string, species: string): BatchAge {
  const start = new Date(startDate);
  const today = new Date();
  const totalDays = Math.max(0, differenceInDays(today, start));
  const day = totalDays + 1; // 1-based
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

/**
 * Format species name with proper capitalization.
 */
export function formatSpecies(species: string): string {
  return species.charAt(0).toUpperCase() + species.slice(1);
}

/**
 * Compute mortality rate as a percentage string.
 */
export function mortalityRate(initial: number, current: number): string {
  if (initial <= 0) return '0.0';
  return (((initial - current) / initial) * 100).toFixed(1);
}
