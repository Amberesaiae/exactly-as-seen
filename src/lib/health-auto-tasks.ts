import { addDays, format, parseISO } from 'date-fns';

export interface AutoTaskInsert {
  batch_id: string;
  farm_id: string;
  task_type: string;
  product_name: string;
  medication_id: string;
  delivery_method: string;
  scheduled_date: string;
  completed: boolean;
  duration_days?: number;
  withdrawal_meat_days?: number;
  withdrawal_egg_days?: number;
}

export function generateInitialTasks(args: {
  batchId: string;
  farmId: string;
  species: string;
  startDate: string; // YYYY-MM-DD
  cycleLengthWeeks: number;
}): AutoTaskInsert[] {
  const tasks: AutoTaskInsert[] = [];
  const start = parseISO(args.startDate);

  // 1. Day 1–3 Chick Arrival Protocol: Anti-stress + Glucose for all species
  for (let day = 0; day < 3; day++) {
    const scheduledDate = format(addDays(start, day), 'yyyy-MM-dd');
    tasks.push({
      batch_id: args.batchId,
      farm_id: args.farmId,
      task_type: 'supplement',
      product_name: 'Glucose/Sugar Water',
      medication_id: 'glucose',
      delivery_method: 'drinking_water',
      scheduled_date: scheduledDate,
      completed: false,
      duration_days: 1,
      withdrawal_meat_days: 0,
      withdrawal_egg_days: 0,
    });
  }

  // 2. Species-specific auto tasks
  if (args.species === 'duck') {
    // Daily niacin tasks for Days 1 to 28
    for (let day = 0; day < 28; day++) {
      const scheduledDate = format(addDays(start, day), 'yyyy-MM-dd');
      tasks.push({
        batch_id: args.batchId,
        farm_id: args.farmId,
        task_type: 'supplement',
        product_name: 'Niacin (Vitamin B3)',
        medication_id: 'niacin',
        delivery_method: 'drinking_water',
        scheduled_date: scheduledDate,
        completed: false,
        duration_days: 1,
        withdrawal_meat_days: 0,
        withdrawal_egg_days: 0,
      });
    }

    // Weekly niacin tasks from Week 5 to Week 20
    const maxNiacinWeek = Math.min(20, args.cycleLengthWeeks);
    for (let week = 5; week <= maxNiacinWeek; week++) {
      const dayOffset = (week - 1) * 7;
      const scheduledDate = format(addDays(start, dayOffset), 'yyyy-MM-dd');
      tasks.push({
        batch_id: args.batchId,
        farm_id: args.farmId,
        task_type: 'supplement',
        product_name: 'Niacin (Vitamin B3)',
        medication_id: 'niacin',
        delivery_method: 'drinking_water',
        scheduled_date: scheduledDate,
        completed: false,
        duration_days: 1,
        withdrawal_meat_days: 0,
        withdrawal_egg_days: 0,
      });
    }
  } else if (args.species === 'turkey') {
    // metronidazole every 2 weeks (Week 1, Week 3, Week 5, ...) up to cycleLengthWeeks
    for (let week = 1; week <= args.cycleLengthWeeks; week += 2) {
      const dayOffset = (week - 1) * 7;
      const scheduledDate = format(addDays(start, dayOffset), 'yyyy-MM-dd');
      tasks.push({
        batch_id: args.batchId,
        farm_id: args.farmId,
        task_type: 'medication',
        product_name: 'Metronidazole',
        medication_id: 'metronidazole',
        delivery_method: 'drinking_water',
        scheduled_date: scheduledDate,
        completed: false,
        duration_days: 5,
        withdrawal_meat_days: 5,
        withdrawal_egg_days: 0,
      });
    }
  }

  return tasks;
}

