import { differenceInDays, parseISO, addDays, isWithinInterval } from 'date-fns';

export interface Medication {
  id: string;
  name: string;
  category: string;
  delivery_method: string;
  withdrawal_meat_days: number;
  withdrawal_egg_days: number;
  is_live_vaccine: boolean;
  is_sulfa: boolean;
  contains_calcium: boolean;
  is_tetracycline: boolean;
  is_activated_charcoal: boolean;
}

export interface HealthTask {
  id?: string;
  scheduled_date: string; // YYYY-MM-DD
  duration_days: number;
  delivery_method?: string;
}

export interface ConflictHit {
  code: string;
  severity: 'BLOCK' | 'WARN';
  message: string;
}

/**
 * Checks if two date intervals [start1, end1] and [start2, end2] overlap
 */
function isOverlap(s1: Date, e1: Date, s2: Date, e2: Date): boolean {
  return s1 <= e2 && s2 <= e1;
}

export function detectConflicts(args: {
  newMed: Medication;
  newDate: string; // YYYY-MM-DD
  newDuration: number;
  neighborhood: { task: HealthTask; med: Medication }[];
  waterSourceChlorinated: boolean;
}): ConflictHit[] {
  const hits: ConflictHit[] = [];
  const newStart = parseISO(args.newDate);
  const newEnd = addDays(newStart, args.newDuration - 1);

  // Rule C8: Live vaccine + chlorinated water
  if (args.newMed.is_live_vaccine && args.waterSourceChlorinated) {
    hits.push({
      code: 'C8',
      severity: 'BLOCK',
      message: 'C8 BLOCK: Live vaccine cannot be administered with chlorinated water source.',
    });
  }

  for (const item of args.neighborhood) {
    const taskStart = parseISO(item.task.scheduled_date);
    const taskEnd = addDays(taskStart, item.task.duration_days - 1);
    const diffDays = Math.abs(differenceInDays(newStart, taskStart));

    // Rule C1: Coccidiostat + Sulfa drug [today, +5d]
    if (args.newMed.category === 'coccidiostat') {
      if (item.med.is_sulfa) {
        const diff = differenceInDays(taskStart, newStart);
        if (diff >= 0 && diff <= 5) {
          hits.push({
            code: 'C1',
            severity: 'BLOCK',
            message: `C1 BLOCK: Coccidiostat conflicts with Sulfa drug (${item.med.name}) scheduled in the next 5 days.`,
          });
        }
      }
    }
    if (args.newMed.is_sulfa) {
      if (item.med.category === 'coccidiostat') {
        const diff = differenceInDays(newStart, taskStart);
        if (diff >= 0 && diff <= 5) {
          hits.push({
            code: 'C1',
            severity: 'BLOCK',
            message: `C1 BLOCK: Sulfa drug conflicts with Coccidiostat (${item.med.name}) scheduled in the last 5 days.`,
          });
        }
      }
    }

    // Rule C2: Two antibiotics overlap
    if (args.newMed.category === 'antibiotic' && item.med.category === 'antibiotic') {
      if (isOverlap(newStart, newEnd, taskStart, taskEnd)) {
        hits.push({
          code: 'C2',
          severity: 'BLOCK',
          message: `C2 BLOCK: Antibiotic treatment overlaps with another active antibiotic treatment (${item.med.name}).`,
        });
      }
    }

    // Rule C3: Dewormer + Coccidiostat same day (WARN)
    if (args.newMed.category === 'dewormer' && item.med.category === 'coccidiostat' && diffDays === 0) {
      hits.push({
        code: 'C3',
        severity: 'WARN',
        message: `C3 WARNING: Dewormer and Coccidiostat (${item.med.name}) are scheduled on the same day. Monitor birds for stress.`,
      });
    }
    if (args.newMed.category === 'coccidiostat' && item.med.category === 'dewormer' && diffDays === 0) {
      hits.push({
        code: 'C3',
        severity: 'WARN',
        message: `C3 WARNING: Coccidiostat and Dewormer (${item.med.name}) are scheduled on the same day. Monitor birds for stress.`,
      });
    }

    // Rule C4: Live vaccine ± antibiotic (±72 hours)
    const isLiveVaccineConflict = (args.newMed.is_live_vaccine && item.med.category === 'antibiotic') ||
                                  (args.newMed.category === 'antibiotic' && item.med.is_live_vaccine);
    if (isLiveVaccineConflict && diffDays <= 3) {
      hits.push({
        code: 'C4',
        severity: 'BLOCK',
        message: `C4 BLOCK: Live vaccine and antibiotic (${item.med.name}) scheduled within 72 hours of each other.`,
      });
    }

    // Rule C5: Enrofloxacin + any antibiotic
    const isEnrofloxacinConflict = (args.newMed.id === 'enrofloxacin' && item.med.category === 'antibiotic') ||
                                   (item.med.id === 'enrofloxacin' && args.newMed.category === 'antibiotic');
    if (isEnrofloxacinConflict && isOverlap(newStart, newEnd, taskStart, taskEnd)) {
      hits.push({
        code: 'C5',
        severity: 'BLOCK',
        message: `C5 BLOCK: Enrofloxacin overlaps with another antibiotic treatment (${item.med.name}).`,
      });
    }

    // Rule C6: Activated charcoal + oral med (±4h / same day)
    const isCharcoalOral = (args.newMed.is_activated_charcoal && (item.task.delivery_method === 'drinking_water' || item.med.delivery_method === 'drinking_water')) ||
                           (item.med.is_activated_charcoal && args.newMed.delivery_method === 'drinking_water');
    if (isCharcoalOral && diffDays === 0) {
      hits.push({
        code: 'C6',
        severity: 'BLOCK',
        message: `C6 BLOCK: Activated charcoal and oral medication (${item.med.name}) scheduled on the same day (conflicting oral absorption).`,
      });
    }

    // Rule C7: Calcium + Tetracycline (±4h / same day)
    const isCalciumTetracycline = (args.newMed.contains_calcium && item.med.is_tetracycline) ||
                                  (args.newMed.is_tetracycline && item.med.contains_calcium);
    if (isCalciumTetracycline && diffDays === 0) {
      hits.push({
        code: 'C7',
        severity: 'BLOCK',
        message: `C7 BLOCK: Calcium supplement and Tetracycline class drug (${item.med.name}) scheduled on the same day (calcium blocks absorption).`,
      });
    }
  }

  return hits;
}
