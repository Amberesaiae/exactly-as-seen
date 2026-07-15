/**
 * Full research-aligned care courses from 03-SPECIES-PROTOCOLS.
 * Vaccination milestones remain in health-data VACCINATION_TEMPLATES.
 * Seeded on batch create via generateAutoTasks (filtered by cycle length).
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

function c(
  species: string,
  partial: Omit<ProtocolCourse, 'species'>
): ProtocolCourse {
  return { species, withdrawal_meat_days: 0, withdrawal_egg_days: 0, ...partial };
}

/** Arrival D1–3 for all species */
function arrival(species: string, doseHint: string): ProtocolCourse {
  return c(species, {
    product_name: 'Anti-Stress + Glucose',
    task_type: 'supplement',
    startDay: 1,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Day-old arrival stress / energy',
    priority: 'critical',
    doseHint,
  });
}

// ─── BROILER (research BROILER.md weeks 1–6) ────────────────────────────────

const BROILER_COURSES: ProtocolCourse[] = [
  arrival('broiler', '2 tbsp anti-stress + glucose per gallon'),
  c('broiler', {
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 4,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 1 coccidiosis prevention (D4–6)',
    priority: 'high',
    doseHint: '1.5 tbsp per gallon',
  }),
  c('broiler', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 8,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Post-Gumboro support (D8–10)',
    priority: 'high',
    doseHint: '1.5 tbsp per gallon',
  }),
  c('broiler', {
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 11,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 2 prevention (D11–13)',
    priority: 'high',
    doseHint: '1.5 tbsp per gallon',
  }),
  // Week 3: cocci Mon/Wed/Fri as three 1-day tasks
  ...[15, 17, 19].map((d) =>
    c('broiler', {
      product_name: 'Coccidiostat (Prevention)',
      task_type: 'medication',
      startDay: d,
      durationDays: 1,
      delivery_method: 'drinking_water',
      indication: 'Week 3 M/W/F prevention',
      priority: 'high',
      doseHint: '1.5 tbsp per gallon',
    })
  ),
  c('broiler', {
    product_name: 'Anti-Stress',
    task_type: 'supplement',
    startDay: 22,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Pre-Lasota prep (D22–24)',
    priority: 'high',
    doseHint: '1.5 tbsp per gallon',
  }),
  c('broiler', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 25,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 4 support (D25–27)',
    priority: 'medium',
    doseHint: '1.5 tbsp per gallon',
  }),
  c('broiler', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 29,
    durationDays: 2,
    delivery_method: 'drinking_water',
    indication: 'Post-Lasota (D29–30)',
    priority: 'high',
  }),
  ...[31, 33].map((d) =>
    c('broiler', {
      product_name: 'Coccidiostat (Prevention)',
      task_type: 'medication',
      startDay: d,
      durationDays: 1,
      delivery_method: 'drinking_water',
      indication: 'Week 5 prevention',
      priority: 'high',
    })
  ),
  c('broiler', {
    product_name: 'Fenbendazole Deworming',
    task_type: 'medication',
    startDay: 36,
    durationDays: 1,
    delivery_method: 'drinking_water',
    indication: 'Week 6 deworm (research D36) — 6th protocol',
    priority: 'critical',
    doseHint: 'Per label (0-day withdrawal typical)',
  }),
  c('broiler', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 37,
    durationDays: 2,
    delivery_method: 'drinking_water',
    indication: 'Post-deworm support (D37–38)',
    priority: 'high',
  }),
  c('broiler', {
    product_name: 'PLAIN WATER ONLY (Pre-sale)',
    task_type: 'checkpoint',
    startDay: 39,
    durationDays: 4,
    delivery_method: 'drinking_water',
    indication: 'No medications — sale compliance (D39–42)',
    priority: 'critical',
  }),
];

// ─── LAYER (rearing + pre-lay courses; production monthly generated separately) ─

const LAYER_COURSES: ProtocolCourse[] = [
  arrival('layer', '2 tbsp anti-stress + glucose per gallon'),
  c('layer', {
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 4,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 1 prevention',
    priority: 'high',
    doseHint: '1.5 tbsp per gallon',
  }),
  c('layer', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 8,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Post-Gumboro support',
    priority: 'high',
  }),
  c('layer', {
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 11,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 2 prevention',
    priority: 'high',
  }),
  ...[15, 17, 19].map((d) =>
    c('layer', {
      product_name: 'Coccidiostat (Prevention)',
      task_type: 'medication',
      startDay: d,
      durationDays: 1,
      delivery_method: 'drinking_water',
      indication: 'Week 3 M/W/F',
      priority: 'high',
    })
  ),
  c('layer', {
    product_name: 'Anti-Stress',
    task_type: 'supplement',
    startDay: 22,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Pre-Lasota',
    priority: 'high',
  }),
  c('layer', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 29,
    durationDays: 2,
    delivery_method: 'drinking_water',
    indication: 'Post-Lasota',
    priority: 'high',
  }),
  ...[31, 33].map((d) =>
    c('layer', {
      product_name: 'Coccidiostat (Prevention)',
      task_type: 'medication',
      startDay: d,
      durationDays: 1,
      delivery_method: 'drinking_water',
      indication: 'Week 5 prevention',
      priority: 'medium',
    })
  ),
  c('layer', {
    product_name: 'Coccidiostat / Vitamins (Maintenance)',
    task_type: 'medication',
    startDay: 36,
    durationDays: 7,
    delivery_method: 'drinking_water',
    indication: 'Week 6 alternating cocci/vitamins maintenance',
    priority: 'medium',
  }),
  c('layer', {
    product_name: 'Anti-Stress',
    task_type: 'supplement',
    startDay: 43,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Pre-deworm (W7)',
    priority: 'high',
  }),
  c('layer', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 50,
    durationDays: 2,
    delivery_method: 'drinking_water',
    indication: 'Post-deworm recovery',
    priority: 'high',
  }),
  c('layer', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 57,
    durationDays: 2,
    delivery_method: 'drinking_water',
    indication: 'Post Fowl Pox',
    priority: 'high',
  }),
  // W9-10: Mon/Wed/Fri Coccidiostat
  ...[63, 65, 67, 70, 72].map((d) =>
    c('layer', {
      product_name: 'Coccidiostat (Prevention)',
      task_type: 'medication',
      startDay: d,
      durationDays: 1,
      delivery_method: 'drinking_water',
      indication: 'Week 9-10 M/W/F cocci prevention',
      priority: 'medium',
    })
  ),
  // W11-12: Mon/Wed/Fri Coccidiostat
  ...[77, 79, 81, 83, 84].map((d) =>
    c('layer', {
      product_name: 'Coccidiostat (Prevention)',
      task_type: 'medication',
      startDay: d,
      durationDays: 1,
      delivery_method: 'drinking_water',
      indication: 'Week 11-12 M/W/F cocci prevention',
      priority: 'medium',
    })
  ),
  // W13: Anti-stress pre-deworm
  c('layer', {
    product_name: 'Anti-Stress',
    task_type: 'supplement',
    startDay: 85,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Pre-deworm (W13)',
    priority: 'high',
  }),
  c('layer', {
    product_name: 'Calcium Supplement (Pre-lay)',
    task_type: 'supplement',
    startDay: 98,
    durationDays: 14,
    delivery_method: 'feed',
    indication: 'Shell prep W14–15 (research)',
    priority: 'critical',
    doseHint: 'In feed / free-choice oyster shell',
  }),
  // Production phase: first 6 months monthly deworm + multi (when cycle allows)
  ...Array.from({ length: 6 }, (_, i) => {
    const week = 19 + i * 4; // monthly-ish from week 19
    const day = week * 7;
    return [
      c('layer', {
        product_name: 'Monthly Deworming (Production)',
        task_type: 'medication',
        startDay: day,
        durationDays: 1,
        delivery_method: 'drinking_water',
        indication: `Production month ${i + 1} deworm (research W19+)`,
        priority: 'high',
        doseHint: 'Per label',
      }),
      c('layer', {
        product_name: 'Multivitamins',
        task_type: 'supplement',
        startDay: day + 1,
        durationDays: 2,
        delivery_method: 'drinking_water',
        indication: `Post-deworm production month ${i + 1}`,
        priority: 'medium',
      }),
    ];
  }).flat(),
  // Quarterly Newcastle booster (months 3, 6, 9, 12 in production phase)
  ...[3, 6, 9, 12].map((m) =>
    c('layer', {
      product_name: 'Newcastle Vaccine (Quarterly Booster)',
      task_type: 'checkpoint',
      startDay: (18 + m * 4) * 7,
      durationDays: 1,
      delivery_method: 'drinking_water',
      indication: `Quarterly Newcastle booster — month ${m}`,
      priority: 'high',
    })
  ),
];

// ─── DUCK meat (research DUCK.md 8 weeks) ───────────────────────────────────

const DUCK_COURSES: ProtocolCourse[] = [
  arrival('duck', '4 tbsp per 4 gallons (scale to flock)'),
  c('duck', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 4,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 1 support D4–6',
    priority: 'high',
  }),
  c('duck', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 8,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 2 support',
    priority: 'high',
  }),
  c('duck', {
    product_name: 'Coccidiostat (if needed)',
    task_type: 'medication',
    startDay: 11,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 2 optional prevention (research lower cocci risk)',
    priority: 'medium',
  }),
  c('duck', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 18,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 3 support',
    priority: 'medium',
  }),
  c('duck', {
    product_name: 'Anti-Stress',
    task_type: 'supplement',
    startDay: 22,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 4 support',
    priority: 'medium',
  }),
  c('duck', {
    product_name: 'Fenbendazole (Deworming)',
    task_type: 'medication',
    startDay: 28,
    durationDays: 1,
    delivery_method: 'drinking_water',
    indication: 'Week 4 deworming (research D28)',
    priority: 'high',
    doseHint: 'Per label',
  }),
  c('duck', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 29,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 5 post-deworm multi',
    priority: 'high',
  }),
  c('duck', {
    product_name: 'PLAIN WATER ONLY (Pre-sale)',
    task_type: 'checkpoint',
    startDay: 50,
    durationDays: 7,
    delivery_method: 'drinking_water',
    indication: 'Week 8 withdrawal / pre-sale plain water',
    priority: 'critical',
  }),
];

// ─── TURKEY meat (research TURKEY.md) ───────────────────────────────────────

const TURKEY_COURSES: ProtocolCourse[] = [
  arrival('turkey', '3 tbsp per gallon — turkeys highly stress-sensitive'),
  c('turkey', {
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 4,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 1 prevention',
    priority: 'high',
  }),
  c('turkey', {
    product_name: 'Blackhead Preventive',
    task_type: 'medication',
    startDay: 8,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'CRITICAL first Blackhead block (W2 D8–10)',
    priority: 'critical',
    doseHint: 'Per label / vet guidance',
    withdrawal_meat_days: 5,
  }),
  c('turkey', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 11,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Post-blackhead support',
    priority: 'high',
  }),
  c('turkey', {
    product_name: 'Coccidiostat (Prevention)',
    task_type: 'medication',
    startDay: 15,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 3 cocci',
    priority: 'high',
  }),
  c('turkey', {
    product_name: 'Blackhead Preventive',
    task_type: 'medication',
    startDay: 18,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 3 blackhead block',
    priority: 'critical',
    withdrawal_meat_days: 5,
  }),
  c('turkey', {
    product_name: 'Anti-Stress',
    task_type: 'supplement',
    startDay: 22,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Pre Fowl Pox / Lasota',
    priority: 'high',
  }),
  c('turkey', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 25,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 4 support',
    priority: 'high',
  }),
  c('turkey', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 36,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Week 6 rest support',
    priority: 'medium',
  }),
  c('turkey', {
    product_name: 'Anti-Stress',
    task_type: 'supplement',
    startDay: 85,
    durationDays: 3,
    delivery_method: 'drinking_water',
    indication: 'Pre final-phase deworm (W13)',
    priority: 'high',
  }),
  c('turkey', {
    product_name: 'Multivitamins',
    task_type: 'supplement',
    startDay: 92,
    durationDays: 7,
    delivery_method: 'drinking_water',
    indication: 'W14–15 reduce meds, multi support',
    priority: 'medium',
  }),
  c('turkey', {
    product_name: 'PLAIN WATER ONLY (Pre-sale)',
    task_type: 'checkpoint',
    startDay: 105,
    durationDays: 7,
    delivery_method: 'drinking_water',
    indication: 'Week 16 withdrawal / pre-sale',
    priority: 'critical',
  }),
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

export function courseScheduledWeek(startDay: number): number {
  return Math.max(1, Math.ceil(startDay / 7));
}

/** Courses that fall within a cycle length in weeks. */
export function getProtocolCoursesForCycle(species: string, cycleLengthWeeks: number): ProtocolCourse[] {
  const maxDay = cycleLengthWeeks * 7;
  return getProtocolCourses(species).filter((c) => c.startDay <= maxDay);
}
