import { addDays, format, parseISO } from 'date-fns';
import { VACCINATION_TEMPLATES } from './health-data';
import {
  courseScheduledWeek,
  getProtocolCoursesForCycle,
} from './species-protocol-courses';

export interface AutoTaskInsert {
  batch_id: string;
  farm_id: string;
  task_type: string;
  product_name: string;
  medication_id: string;
  delivery_method: string;
  scheduled_date: string;
  scheduled_week: number;
  duration_days: number;
  indication: string;
  priority: string;
  withdrawal_meat_days: number;
  withdrawal_egg_days: number;
  notes?: string | null;
}

/**
 * Seed care plan on batch create:
 * 1) Vaccination milestones (VACCINATION_TEMPLATES)
 * 2) Research day-range courses (species-protocol-courses)
 * 3) Duck niacin continuous; turkey biweekly blackhead from week 2
 */
export function generateAutoTasks(args: {
  batchId: string;
  farmId: string;
  species: string;
  startDate: string;
  cycleLengthWeeks: number;
}): AutoTaskInsert[] {
  const tasks: AutoTaskInsert[] = [];
  const start = parseISO(args.startDate);

  // 1. Vaccination milestones
  VACCINATION_TEMPLATES.filter((t) => t.species.includes(args.species)).forEach((vax) => {
    if (vax.scheduledWeek > args.cycleLengthWeeks) return;

    const scheduledDate = addDays(start, (vax.scheduledDay || vax.scheduledWeek * 7) - 1);

    tasks.push({
      batch_id: args.batchId,
      farm_id: args.farmId,
      task_type: 'vaccination',
      product_name: vax.name,
      medication_id: vax.name.toLowerCase().replace(/\s+/g, '_'),
      delivery_method: vax.route === 'Drinking water' ? 'drinking_water' : 'injection',
      scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
      scheduled_week: vax.scheduledWeek,
      duration_days: 1,
      indication: 'Preventive Protocol',
      priority: 'critical',
      withdrawal_meat_days: 0,
      withdrawal_egg_days: 0,
      notes: vax.instructions ?? null,
    });
  });

  // 2. Research care courses (arrival, cocci, multi, deworm, blackhead W2, production monthly…)
  getProtocolCoursesForCycle(args.species, args.cycleLengthWeeks).forEach((course) => {
    const week = courseScheduledWeek(course.startDay);
    if (week > args.cycleLengthWeeks) return;

    const scheduledDate = addDays(start, course.startDay - 1);
    tasks.push({
      batch_id: args.batchId,
      farm_id: args.farmId,
      task_type: course.task_type,
      product_name: course.product_name,
      medication_id: course.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      delivery_method: course.delivery_method,
      scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
      scheduled_week: week,
      duration_days: course.durationDays,
      indication: course.indication,
      priority: course.priority,
      withdrawal_meat_days: course.withdrawal_meat_days ?? 0,
      withdrawal_egg_days: course.withdrawal_egg_days ?? 0,
      notes: course.doseHint ?? null,
    });
  });

  // 3. Duck niacin continuous (critical)
  if (args.species === 'duck') {
    tasks.push({
      batch_id: args.batchId,
      farm_id: args.farmId,
      task_type: 'medication',
      product_name: 'Niacin Supplement',
      medication_id: 'niacin',
      delivery_method: 'drinking_water',
      scheduled_date: args.startDate,
      scheduled_week: 1,
      duration_days: Math.max(1, args.cycleLengthWeeks * 7),
      indication: 'CRITICAL: 1.5 tsp/gallon or ≥55 mg/kg feed — prevent leg weakness',
      priority: 'critical',
      withdrawal_meat_days: 0,
      withdrawal_egg_days: 0,
      notes: 'Research: ducks cannot synthesize niacin. Dose 1.5 tsp per gallon drinking water daily.',
    });
  }

  // 4. Turkey biweekly blackhead from week 2 (research every 2 weeks; W2 also in courses)
  if (args.species === 'turkey') {
    for (let w = 2; w <= args.cycleLengthWeeks; w += 2) {
      // Skip W2 day-8 course duplicate — course already seeds D8–10; loop covers W4, W6, ...
      if (w === 2) continue;
      tasks.push({
        batch_id: args.batchId,
        farm_id: args.farmId,
        task_type: 'medication',
        product_name: 'Blackhead Preventive',
        medication_id: 'blackhead_prev',
        delivery_method: 'drinking_water',
        scheduled_date: format(addDays(start, w * 7 - 1), 'yyyy-MM-dd'),
        scheduled_week: w,
        duration_days: 5,
        indication: 'Strict bi-weekly turkey Blackhead (Histomoniasis) protocol',
        priority: 'critical',
        withdrawal_meat_days: 5,
        withdrawal_egg_days: 0,
        notes: 'Per label / veterinary guidance. Never raise turkeys with chickens.',
      });
    }
  }

  return tasks;
}

/** Alias kept for tests / older call sites */
export const generateInitialTasks = generateAutoTasks;
