/**
 * Research-aligned care courses from deprecated specs/03-SPECIES-PROTOCOLS.
 * These are day-range courses (not vaccine milestones — those live in health-data VACCINATION_TEMPLATES).
 * Seeded on batch create via generateAutoTasks.
 */

export type ProtocolCourse = {
  species: string;
  product_name: string;
  task_type: 'medication' | 'supplement' | 'checkpoint';
  /** 1-based day of production cycle */
  startDay: number;
  durationDays: number;
  delivery_method: string;
  indication: string;
  priority: 'critical' | 'high' | 'medium';
  doseHint?: string;
  withdrawal_meat_days?: number;
  withdrawal_egg_days?: number;
};

/** Shared day-1 arrival block — all commercial species */
const ARRIVAL: Omit<ProtocolCourse, 'species'> = {
  product_name: 'Anti-Stress + Glucose',
  task_type: 'supplement',
  startDay: 1,
  durationDays: 3,
  delivery_method: 'drinking_water',
  indication: 'Day-old arrival stress / energy',
  priority: 'critical',
  doseHint: '2 tbsp anti-stress + glucose per gallon (scale to flock water)',
  withdrawal_meat_days: 0,
  withdrawal_egg_days: 0,
};

const BROILER_COURSES: ProtocolCourse[] = [
  { ...ARRIVAL, species: 'broiler' },
  {
    species: 'broiler',
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 4,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 1 coccidiosis prevention',
    priority: 'high',
    doseHint: '1.5 tbsp per gallon',
    withdrawal_meat_days: 0,
    withdrawal_egg_days: 0,
  },
  {
    species: 'broiler',
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 8,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Post-Gumboro support',
    priority: 'high',
    doseHint: '1.5 tbsp per gallon',
  },
  {
    species: 'broiler',
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 11,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 2 prevention',
    priority: 'high',
    doseHint: '1.5 tbsp per gallon',
  },
  {
    species: 'broiler',
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 22,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Pre-Lasota support (research anti-stress window)',
    priority: 'medium',
  },
  {
    species: 'broiler',
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 25,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 4 support',
    priority: 'medium',
  },
  {
    species: 'broiler',
    product_name: 'Fenbendazole Deworming',
    task_type: 'medication',
    startDay: 36,
    durationDays: 1,
    delivery_method: 'drinking_water',
    indication: 'Week 6 deworm before sale window (research D36)',
    priority: 'critical',
    doseHint: 'Per label',
    withdrawal_meat_days: 0,
    withdrawal_egg_days: 0,
  },
  {
    species: 'broiler',
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 37,
    durationDays: 2,
    delivery_method: 'drinking_water',
    indication: 'Post-deworm support',
    priority: 'high',
  },
  {
    species: 'broiler',
    product_name: 'PLAIN WATER ONLY (Pre-sale)',
    task_type: 'checkpoint',
    startDay: 39,
    durationDays: 4,
    delivery_method: 'drinking_water',
    indication: 'No medications — withdrawal / sale compliance (research D39–42)',
    priority: 'critical',
  },
];

const LAYER_COURSES: ProtocolCourse[] = [
  { ...ARRIVAL, species: 'layer' },
  {
    species: 'layer',
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 4,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 1 prevention',
    priority: 'high',
    doseHint: '1.5 tbsp per gallon',
  },
  {
    species: 'layer',
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 8,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Post-vaccine support',
    priority: 'high',
  },
  {
    species: 'layer',
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 11,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 2 prevention',
    priority: 'high',
  },
  {
    species: 'layer',
    product_name: 'Calcium Supplement (Pre-lay)',
    task_type: 'supplement',
    startDay: 98, // week 14
    durationDays: 14, // through week 15
    delivery_method: 'feed',
    indication: 'Shell prep — calcium in feed (research W14–15)',
    priority: 'critical',
    doseHint: 'In feed / free-choice oyster shell',
  },
];

const DUCK_COURSES: ProtocolCourse[] = [
  { ...ARRIVAL, species: 'duck', doseHint: '4 tbsp per 4 gallons (scale)' },
  {
    species: 'duck',
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 4,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 1 support',
    priority: 'high',
  },
  {
    species: 'duck',
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 8,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 2 support',
    priority: 'high',
  },
  {
    species: 'duck',
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 18,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 3 support',
    priority: 'medium',
  },
  {
    species: 'duck',
    product_name: 'Anti-Stress',
    task_type: 'supplement',
    startDay: 22,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 4 support',
    priority: 'medium',
  },
];

const TURKEY_COURSES: ProtocolCourse[] = [
  {
    ...ARRIVAL,
    species: 'turkey',
    doseHint: '3 tbsp per gallon (turkeys stress-sensitive)',
  },
  {
    species: 'turkey',
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 4,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 1 prevention',
    priority: 'high',
  },
  {
    species: 'turkey',
    product_name: 'Blackhead Preventive',
    task_type: 'medication',
    startDay: 8,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'CRITICAL first blackhead block (research W2 D8–10)',
    priority: 'critical',
    doseHint: 'Per label / vet guidance',
    withdrawal_meat_days: 5,
    withdrawal_egg_days: 0,
  },
  {
    species: 'turkey',
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 11,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Post-blackhead support',
    priority: 'high',
  },
];

const BY_SPECIES: Record<string, ProtocolCourse[]> = {
  broiler: BROILER_COURSES,
  layer: LAYER_COURSES,
  duck: DUCK_COURSES,
  turkey: TURKEY_COURSES,
};

export function getProtocolCourses(species: string): ProtocolCourse[] {
  return BY_SPECIES[species] ?? [];
}

/** Convert 1-based start day to scheduled week (1-based). */
export function courseScheduledWeek(startDay: number): number {
  return Math.max(1, Math.ceil(startDay / 7));
}
