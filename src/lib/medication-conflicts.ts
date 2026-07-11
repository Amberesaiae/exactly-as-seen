import { differenceInDays, parseISO, addDays } from 'date-fns';

export interface Medication {
  id: string;
  name: string;
  category: string;
  delivery_method?: string;
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
  suggestion?: string;
}

/**
 * Checks if two date intervals [start1, end1] and [start2, end2] overlap
 */
function isOverlap(s1: Date, e1: Date, s2: Date, e2: Date): boolean {
  return s1 <= e2 && s2 <= e1;
}

/**
 * Lean Conflict Engine: Blocks only for biological/fatal risks.
 * Pragmatic timing issues are moved to WARN with timing guidance.
 */
export function detectConflicts(args: {
  newMed: Medication;
  newDate: string; 
  newDuration: number;
  neighborhood: { task: HealthTask; med: Medication }[];
  waterSourceChlorinated: boolean;
}): ConflictHit[] {
  const hits: ConflictHit[] = [];
  const newStart = parseISO(args.newDate);
  const newEnd = addDays(newStart, args.newDuration - 1);

  // Rule C8: Live vaccine + chlorinated water (BLOCK - Biologically incompatible)
  if (args.newMed.is_live_vaccine && args.waterSourceChlorinated) {
    hits.push({
      code: 'C8',
      severity: 'BLOCK',
      message: 'Live vaccine cannot be administered with a chlorinated water source.',
      suggestion: 'Use non-chlorinated water or add a chlorine neutralizer.',
    });
  }

  for (const item of args.neighborhood) {
    const taskStart = parseISO(item.task.scheduled_date);
    const taskEnd = addDays(taskStart, item.task.duration_days - 1);
    const diffDays = Math.abs(differenceInDays(newStart, taskStart));

    // Rule C1: Coccidiostat + Sulfa drug [today, +5d] (BLOCK - Toxic combination)
    const coccidiostatSulfa = (args.newMed.category === 'coccidiostat' && item.med.is_sulfa) ||
                              (args.newMed.is_sulfa && item.med.category === 'coccidiostat');
    if (coccidiostatSulfa && diffDays <= 5) {
      hits.push({
        code: 'C1',
        severity: 'BLOCK',
        message: `Coccidiostat and Sulfa drugs (${item.med.name}) cannot be used within 5 days of each other.`,
        suggestion: 'Separate these treatments by at least 6 days to avoid toxicity.',
      });
    }

    // Rule C2: Two antibiotics overlap (BLOCK - Over-medication risk)
    if (args.newMed.category === 'antibiotic' && item.med.category === 'antibiotic') {
      if (isOverlap(newStart, newEnd, taskStart, taskEnd)) {
        hits.push({
          code: 'C2',
          severity: 'BLOCK',
          message: `Antibiotic treatment overlaps with another active antibiotic treatment (${item.med.name}).`,
          suggestion: 'Complete one treatment fully before starting another.',
        });
      }
    }

    // Rule C3: Dewormer + Coccidiostat same day (WARN - reduced efficacy)
    const dewormerCoccidiostat =
      (args.newMed.category === 'dewormer' && item.med.category === 'coccidiostat') ||
      (args.newMed.category === 'coccidiostat' && item.med.category === 'dewormer');
    if (dewormerCoccidiostat && diffDays === 0) {
      hits.push({
        code: 'C3',
        severity: 'WARN',
        message: `Dewormer and coccidiostat (${item.med.name}) scheduled on the same day.`,
        suggestion: 'Separate by at least 1 day for best efficacy of both products.',
      });
    }

    // Rule C4: Live vaccine ± antibiotic (±72 hours) (BLOCK - Antibiotic kills live vaccine)
    const liveVaccineAntibiotic = (args.newMed.is_live_vaccine && item.med.category === 'antibiotic') ||
                                  (args.newMed.category === 'antibiotic' && item.med.is_live_vaccine);
    if (liveVaccineAntibiotic && diffDays <= 3) {
      hits.push({
        code: 'C4',
        severity: 'BLOCK',
        message: `Live vaccine and antibiotic (${item.med.name}) cannot be administered within 72 hours of each other.`,
        suggestion: 'Ensure a 3-day gap between live vaccines and antibiotic treatments.',
      });
    }

    // Rule C5: Enrofloxacin + any other antibiotic (BLOCK - resistance)
    const enroId = (id: string) => id.toLowerCase().includes('enro') || id.toLowerCase() === 'baytril';
    const enroName = (name: string) => name.toLowerCase().includes('enro') || name.toLowerCase().includes('baytril');
    const newIsEnro = enroId(args.newMed.id) || enroName(args.newMed.name);
    const itemIsEnro = enroId(item.med.id) || enroName(item.med.name);
    if (
      (newIsEnro || itemIsEnro) &&
      args.newMed.category === 'antibiotic' &&
      item.med.category === 'antibiotic' &&
      isOverlap(newStart, newEnd, taskStart, taskEnd)
    ) {
      hits.push({
        code: 'C5',
        severity: 'BLOCK',
        message: `Enrofloxacin cannot overlap with another antibiotic (${item.med.name}).`,
        suggestion: 'Complete enrofloxacin fully before starting another antibiotic (resistance risk).',
      });
    }

    // Rule C6: Activated charcoal + oral med (Refactored to WARN - Pragmatic timing)
    const isCharcoalOral = (args.newMed.is_activated_charcoal && (item.task.delivery_method === 'drinking_water' || item.med.delivery_method === 'drinking_water')) ||
                           (item.med.is_activated_charcoal && args.newMed.delivery_method === 'drinking_water');
    if (isCharcoalOral && diffDays === 0) {
      hits.push({
        code: 'C6',
        severity: 'WARN',
        message: `Charcoal and oral medication (${item.med.name}) scheduled on the same day.`,
        suggestion: 'LEAN ADVICE: Wait at least 2 hours between charcoal and other oral medications to ensure effective absorption.',
      });
    }

    // Rule C7: Calcium + Tetracycline (Refactored to WARN - Pragmatic timing)
    const isCalciumTetracycline = (args.newMed.contains_calcium && item.med.is_tetracycline) ||
                                  (args.newMed.is_tetracycline && item.med.contains_calcium);
    if (isCalciumTetracycline && diffDays === 0) {
      hits.push({
        code: 'C7',
        severity: 'WARN',
        message: `Calcium and Tetracycline drug (${item.med.name}) scheduled on the same day.`,
        suggestion: 'LEAN ADVICE: Wait at least 4 hours between calcium and tetracycline to avoid binding.',
      });
    }
  }

  return hits;
}
