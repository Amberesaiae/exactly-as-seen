import { addDays, format, parseISO } from 'date-fns';
import { VACCINATION_TEMPLATES } from './health-data';

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
}

/**
 * Lean Task Orchestrator: Realigned to Project Foundation.
 * Uses established VACCINATION_TEMPLATES for core schedules.
 * Provides proactive 'House Protocols' rather than overkill historical records.
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

  // 1. Core Vaccination Protocols (From Project health-data.ts)
  VACCINATION_TEMPLATES.filter(t => t.species.includes(args.species)).forEach(vax => {
    // Only schedule if within cycle length
    if (vax.scheduledWeek > args.cycleLengthWeeks) return;

    const scheduledDate = addDays(start, (vax.scheduledDay || (vax.scheduledWeek * 7)) - 1);
    
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
      withdrawal_egg_days: 0
    });
  });

  // 2. High-Value House Protocols (Lean Guidance)
  // These are scheduled milestones that trigger 'Operational Synergy'
  if (args.species === 'duck') {
    // Duck Niacin Alert Task (Lean Guidance)
    tasks.push({
      batch_id: args.batchId,
      farm_id: args.farmId,
      task_type: 'medication',
      product_name: 'Niacin Supplement',
      medication_id: 'niacin',
      delivery_method: 'drinking_water',
      scheduled_date: args.startDate,
      scheduled_week: 1,
      duration_days: args.cycleLengthWeeks * 7,
      indication: 'CRITICAL: Preventing leg weakness in ducks',
      priority: 'high',
      withdrawal_meat_days: 0,
      withdrawal_egg_days: 0
    });
  }

  if (args.species === 'turkey') {
    // Bi-weekly Blackhead Prevention Protocol (Production Spec Logic)
    for (let w = 4; w <= args.cycleLengthWeeks; w += 2) {
      tasks.push({
        batch_id: args.batchId,
        farm_id: args.farmId,
        task_type: 'medication',
        product_name: 'Blackhead Preventive',
        medication_id: 'blackhead_prev',
        delivery_method: 'drinking_water',
        scheduled_date: format(addDays(start, (w * 7) - 1), 'yyyy-MM-dd'),
        scheduled_week: w,
        duration_days: 5,
        indication: 'Strict Bi-weekly Turkey Protocol',
        priority: 'critical',
        withdrawal_meat_days: 5,
        withdrawal_egg_days: 0
      });
    }
  }

  return tasks;
}
