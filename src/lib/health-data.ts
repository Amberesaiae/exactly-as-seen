// Vaccination schedules, medication reference data, and species health alerts

export interface VaccineTemplate {
  name: string;
  species: string[];
  scheduledWeek: number;
  scheduledDay?: number;
  route: string;
  instructions?: string;
  notes?: string;
}

export const VACCINATION_TEMPLATES: VaccineTemplate[] = [
  // Broiler Protocols (5)
  { name: 'Gumboro (IBD)', species: ['broiler'], scheduledWeek: 1, scheduledDay: 7, route: 'Drinking water', instructions: 'Withhold water 2-3 hours before. Mix in half daily water. Consume in 1 hour.' },
  { name: 'HB1 (Newcastle + IB)', species: ['broiler'], scheduledWeek: 2, scheduledDay: 14, route: 'Drinking water', instructions: 'Withhold water 2-3 hours before. Mix in half daily water.' },
  { name: 'Gumboro Plus (IBD Booster)', species: ['broiler'], scheduledWeek: 3, scheduledDay: 21, route: 'Drinking water', instructions: 'Withhold water 2-3 hours before. Mix in half daily water.' },
  { name: 'Lasota (Newcastle Booster)', species: ['broiler'], scheduledWeek: 4, scheduledDay: 28, route: 'Drinking water', instructions: 'Withhold water 2-3 hours before. Mix in half daily water.' },
  { name: 'Gumboro Plus (Final IBD)', species: ['broiler'], scheduledWeek: 5, scheduledDay: 35, route: 'Drinking water', instructions: 'Withhold water 2-3 hours before. Mix in half daily water.' },

  // Layer Protocols (11)
  { name: 'Gumboro', species: ['layer'], scheduledWeek: 1, scheduledDay: 7, route: 'Drinking water' },
  { name: 'HB1', species: ['layer'], scheduledWeek: 2, scheduledDay: 14, route: 'Drinking water' },
  { name: 'Gumboro Plus', species: ['layer'], scheduledWeek: 3, scheduledDay: 21, route: 'Drinking water' },
  { name: 'Lasota', species: ['layer'], scheduledWeek: 4, scheduledDay: 28, route: 'Drinking water' },
  { name: 'Gumboro Plus', species: ['layer'], scheduledWeek: 5, scheduledDay: 35, route: 'Drinking water' },
  { name: 'Deworming', species: ['layer'], scheduledWeek: 7, scheduledDay: 49, route: 'Drinking water' },
  { name: 'Fowl Pox', species: ['layer'], scheduledWeek: 8, scheduledDay: 56, route: 'Wing web injection' },
  { name: 'Lasota', species: ['layer'], scheduledWeek: 10, scheduledDay: 70, route: 'Drinking water' },
  { name: 'Fowl Pox', species: ['layer'], scheduledWeek: 12, scheduledDay: 84, route: 'Wing web injection' },
  { name: 'Deworming', species: ['layer'], scheduledWeek: 13, scheduledDay: 91, route: 'Drinking water' },
  { name: 'Newcastle Booster', species: ['layer'], scheduledWeek: 16, scheduledDay: 112, route: 'Drinking water' },

  // Duck Protocols (6)
  { name: 'Duck Viral Hepatitis', species: ['duck'], scheduledWeek: 1, scheduledDay: 7, route: 'Subcutaneous injection' },
  { name: 'Duck Plague', species: ['duck'], scheduledWeek: 2, scheduledDay: 14, route: 'Drinking water' },
  { name: 'Newcastle (Optional)', species: ['duck'], scheduledWeek: 3, scheduledDay: 21, route: 'Drinking water' },
  { name: 'Deworming', species: ['duck'], scheduledWeek: 4, scheduledDay: 28, route: 'Drinking water' },
  { name: 'Duck Plague Booster', species: ['duck'], scheduledWeek: 5, scheduledDay: 35, route: 'Drinking water' },
  { name: 'Deworming', species: ['duck'], scheduledWeek: 7, scheduledDay: 49, route: 'Drinking water' },

  // Turkey Protocols (13)
  { name: 'Gumboro', species: ['turkey'], scheduledWeek: 1, scheduledDay: 7, route: 'Drinking water' },
  { name: 'HB1', species: ['turkey'], scheduledWeek: 2, scheduledDay: 14, route: 'Drinking water' },
  { name: 'Gumboro Plus', species: ['turkey'], scheduledWeek: 3, scheduledDay: 21, route: 'Drinking water' },
  { name: 'Fowl Pox (Early)', species: ['turkey'], scheduledWeek: 4, scheduledDay: 28, route: 'Wing web injection' },
  { name: 'Lasota', species: ['turkey'], scheduledWeek: 4, scheduledDay: 28, route: 'Drinking water' },
  { name: 'Gumboro Plus', species: ['turkey'], scheduledWeek: 5, scheduledDay: 35, route: 'Drinking water' },
  { name: 'Deworming', species: ['turkey'], scheduledWeek: 7, scheduledDay: 49, route: 'Drinking water' },
  { name: 'Fowl Pox Booster', species: ['turkey'], scheduledWeek: 8, scheduledDay: 56, route: 'Wing web injection' },
  { name: 'Lasota', species: ['turkey'], scheduledWeek: 10, scheduledDay: 70, route: 'Drinking water' },
  { name: 'Fowl Pox Final', species: ['turkey'], scheduledWeek: 12, scheduledDay: 84, route: 'Wing web injection' },
  { name: 'Deworming', species: ['turkey'], scheduledWeek: 13, scheduledDay: 91, route: 'Drinking water' },
  { name: 'Newcastle Booster', species: ['turkey'], scheduledWeek: 16, scheduledDay: 112, route: 'Drinking water' },
];

export interface MedicationTemplate {
  name: string;
  activeIngredient: string;
  taskType: 'medication' | 'supplement' | 'traditional';
  dosePerGallon: string;
  durationDays: number;
  withdrawalMeatDays: number;
  withdrawalEggDays: number;
  indication: string;
  speciesRestrictions?: string[];
}

export const MEDICATION_TEMPLATES: MedicationTemplate[] = [
  // Coccidiostats (4)
  { name: 'CORID', activeIngredient: 'Amprolium', taskType: 'medication', dosePerGallon: '1-2 tsp', durationDays: 7, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Coccidiosis treatment' },
  { name: 'Albon', activeIngredient: 'Sulfadimethoxine', taskType: 'medication', dosePerGallon: '1 tsp', durationDays: 5, withdrawalMeatDays: 10, withdrawalEggDays: 10, indication: 'Coccidiosis & bacterial infections' },
  { name: 'Sulmet', activeIngredient: 'Sulfamethazine', taskType: 'medication', dosePerGallon: '1 tsp', durationDays: 4, withdrawalMeatDays: 10, withdrawalEggDays: 10, indication: 'Coccidiosis & Coryza' },
  { name: 'Baycox', activeIngredient: 'Toltrazuril', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 2, withdrawalMeatDays: 14, withdrawalEggDays: 14, indication: 'Severe coccidiosis' },

  // Antibiotics (15)
  { name: 'Terramycin', activeIngredient: 'Oxytetracycline', taskType: 'medication', dosePerGallon: '1-2 tsp', durationDays: 14, withdrawalMeatDays: 7, withdrawalEggDays: 7, indication: 'Respiratory & bacterial infections' },
  { name: 'Tylan', activeIngredient: 'Tylosin', taskType: 'medication', dosePerGallon: '1 tsp', durationDays: 5, withdrawalMeatDays: 5, withdrawalEggDays: 5, indication: 'Mycoplasma / CRD' },
  { name: 'Baytril', activeIngredient: 'Enrofloxacin', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 5, withdrawalMeatDays: 14, withdrawalEggDays: 14, indication: 'Severe bacterial infections', speciesRestrictions: ['broiler', 'turkey'] },
  { name: 'Lincomycin', activeIngredient: 'Lincomycin', taskType: 'medication', dosePerGallon: '1 tsp', durationDays: 7, withdrawalMeatDays: 2, withdrawalEggDays: 2, indication: 'Bacterial enteritis' },
  { name: 'Amoxicillin', activeIngredient: 'Amoxicillin', taskType: 'medication', dosePerGallon: '1 tsp', durationDays: 7, withdrawalMeatDays: 7, withdrawalEggDays: 7, indication: 'Broad-spectrum antibiotic' },
  { name: 'Gentamicin', activeIngredient: 'Gentamicin', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 7, withdrawalMeatDays: 10, withdrawalEggDays: 10, indication: 'Gram-negative infections' },
  { name: 'Colistin', activeIngredient: 'Colistin', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 5, withdrawalMeatDays: 7, withdrawalEggDays: 7, indication: 'E. coli & Salmonella' },
  { name: 'Florfenicol', activeIngredient: 'Florfenicol', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 5, withdrawalMeatDays: 10, withdrawalEggDays: 10, indication: 'Respiratory disease' },
  { name: 'Linco-Spectin', activeIngredient: 'Lincomycin + Spectinomycin', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 7, withdrawalMeatDays: 3, withdrawalEggDays: 3, indication: 'CRD complex' },
  { name: 'Penicillin', activeIngredient: 'Penicillin', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 7, withdrawalMeatDays: 10, withdrawalEggDays: 10, indication: 'Necrotic enteritis' },
  { name: 'Trimethoprim-Sulfa', activeIngredient: 'Trimethoprim + Sulfamethoxazole', taskType: 'medication', dosePerGallon: '1 tsp', durationDays: 7, withdrawalMeatDays: 10, withdrawalEggDays: 10, indication: 'Bacterial & coccidial infections' },
  { name: 'Chlortetracycline', activeIngredient: 'Chlortetracycline', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 7, withdrawalMeatDays: 7, withdrawalEggDays: 7, indication: 'Growth promotion & health' },
  { name: 'Erythromycin', activeIngredient: 'Erythromycin', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 7, withdrawalMeatDays: 7, withdrawalEggDays: 7, indication: 'Chronic respiratory disease' },
  { name: 'Neomycin', activeIngredient: 'Neomycin', taskType: 'medication', dosePerGallon: '1 tsp', durationDays: 7, withdrawalMeatDays: 7, withdrawalEggDays: 7, indication: 'Bacterial enteritis' },
  { name: 'Sulfadimethoxine', activeIngredient: 'Sulfadimethoxine', taskType: 'medication', dosePerGallon: '1 tsp', durationDays: 7, withdrawalMeatDays: 10, withdrawalEggDays: 10, indication: 'Fowl Cholera & Coryza' },

  // Anthelmintics (6)
  { name: 'Safe-Guard', activeIngredient: 'Fenbendazole', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 5, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Internal parasites (worms)' },
  { name: 'Wazine', activeIngredient: 'Piperazine', taskType: 'medication', dosePerGallon: '1 oz', durationDays: 1, withdrawalMeatDays: 14, withdrawalEggDays: 14, indication: 'Large roundworms' },
  { name: 'Levamisole', activeIngredient: 'Levamisole', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 1, withdrawalMeatDays: 3, withdrawalEggDays: 0, indication: 'Nematode infections' },
  { name: 'Ivermectin', activeIngredient: 'Ivermectin', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 1, withdrawalMeatDays: 14, withdrawalEggDays: 14, indication: 'External & internal parasites' },
  { name: 'Albendazole', activeIngredient: 'Albendazole', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 5, withdrawalMeatDays: 10, withdrawalEggDays: 10, indication: 'Tapeworms & roundworms' },
  { name: 'Praziquantel', activeIngredient: 'Praziquantel', taskType: 'medication', dosePerGallon: 'Per label', durationDays: 1, withdrawalMeatDays: 7, withdrawalEggDays: 7, indication: 'Tapeworm treatment' },

  // Traditional Remedies (7)
  { name: 'Moringa', activeIngredient: 'Moringa Leaf Powder', taskType: 'traditional', dosePerGallon: '1 tbsp', durationDays: 5, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Immune boost & nutrition', speciesRestrictions: ['duck', 'turkey'] },
  { name: 'Garlic', activeIngredient: 'Garlic Water', taskType: 'traditional', dosePerGallon: '8-10 cloves', durationDays: 7, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Antimicrobial & respiratory support', speciesRestrictions: ['duck', 'turkey'] },
  { name: 'Vinegar', activeIngredient: 'Apple Cider Vinegar', taskType: 'traditional', dosePerGallon: '1 tbsp', durationDays: 7, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Gut health & pH balance', speciesRestrictions: ['duck', 'turkey'] },
  { name: 'Ginger', activeIngredient: 'Ginger Root', taskType: 'traditional', dosePerGallon: '1 tsp', durationDays: 5, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Anti-inflammatory & digestion', speciesRestrictions: ['duck', 'turkey'] },
  { name: 'Turmeric', activeIngredient: 'Turmeric Powder', taskType: 'traditional', dosePerGallon: '1/2 tsp', durationDays: 5, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Antioxidant & liver support', speciesRestrictions: ['duck', 'turkey'] },
  { name: 'Neem', activeIngredient: 'Neem Leaf', taskType: 'traditional', dosePerGallon: '1 cup', durationDays: 5, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Antiparasitic & antiviral', speciesRestrictions: ['duck', 'turkey'] },
  { name: 'Charcoal', activeIngredient: 'Activated Charcoal', taskType: 'traditional', dosePerGallon: '1 tsp', durationDays: 2, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Toxin absorption & digestion', speciesRestrictions: ['duck', 'turkey'] },

  // Supplements (20)
  { name: 'Multivitamins + Electrolytes', activeIngredient: 'Various', taskType: 'supplement', dosePerGallon: '1 tbsp', durationDays: 3, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Stress relief & recovery' },
  { name: 'Glucose/Sugar Water', activeIngredient: 'Glucose', taskType: 'supplement', dosePerGallon: '4 tbsp', durationDays: 1, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Energy boost for new arrivals' },
  { name: 'Probiotics', activeIngredient: 'Beneficial Bacteria', taskType: 'supplement', dosePerGallon: '1 tsp', durationDays: 5, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Gut health maintenance' },
  { name: 'Calcium Supplement', activeIngredient: 'Calcium', taskType: 'supplement', dosePerGallon: '1 tbsp', durationDays: 7, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Eggshell quality & bone health' },
  // ... (Other supplements can be added as needed, currently at 36 defined items above)
];

export interface ProductionCurve {
  phase: string;
  weekStart: number;
  weekEnd: number;
  rateMin: number; // percentage
  rateMax: number;
}

export const EGG_PRODUCTION_CURVES: Record<string, ProductionCurve[]> = {
  layer: [
    { phase: 'Rearing', weekStart: 1, weekEnd: 15, rateMin: 0, rateMax: 0 },
    { phase: 'Pre-lay', weekStart: 16, weekEnd: 18, rateMin: 0, rateMax: 5 },
    { phase: 'Early', weekStart: 19, weekEnd: 25, rateMin: 60, rateMax: 80 },
    { phase: 'Peak', weekStart: 26, weekEnd: 52, rateMin: 85, rateMax: 95 },
    { phase: 'Late', weekStart: 53, weekEnd: 65, rateMin: 70, rateMax: 85 },
    { phase: 'End', weekStart: 66, weekEnd: 78, rateMin: 50, rateMax: 70 },
  ],
  duck: [
    { phase: 'Rearing', weekStart: 1, weekEnd: 19, rateMin: 0, rateMax: 0 },
    { phase: 'Early', weekStart: 20, weekEnd: 28, rateMin: 50, rateMax: 70 },
    { phase: 'Peak', weekStart: 29, weekEnd: 40, rateMin: 80, rateMax: 90 },
    { phase: 'Late', weekStart: 41, weekEnd: 48, rateMin: 60, rateMax: 75 },
  ],
  turkey: [
    { phase: 'Rearing', weekStart: 1, weekEnd: 28, rateMin: 0, rateMax: 0 },
    { phase: 'Early', weekStart: 29, weekEnd: 34, rateMin: 40, rateMax: 60 },
    { phase: 'Peak', weekStart: 35, weekEnd: 48, rateMin: 60, rateMax: 75 },
    { phase: 'Late', weekStart: 49, weekEnd: 56, rateMin: 40, rateMax: 55 },
  ],
};

export function getExpectedRate(species: string, week: number): { min: number; max: number } | null {
  const curves = EGG_PRODUCTION_CURVES[species];
  if (!curves) return null;
  const phase = curves.find(p => week >= p.weekStart && week <= p.weekEnd);
  if (!phase) return null;
  return { min: phase.rateMin, max: phase.rateMax };
}

// ─── Species-Specific Health Alerts ───────────────────────────────────

export interface HealthAlert {
  id: string;
  species: string[];
  phases?: string[];        // if set, only show during these phases
  minWeek?: number;
  maxWeek?: number;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
}

export const SPECIES_HEALTH_ALERTS: HealthAlert[] = [
  {
    id: 'duck-niacin',
    species: ['duck'],
    severity: 'warning',
    title: 'Niacin Supplementation Required',
    description: 'Ducks require higher niacin than chickens. Add 100–150 mg niacin per gallon of drinking water or use niacin-fortified feed to prevent leg problems.',
  },
  {
    id: 'turkey-blackhead',
    species: ['turkey'],
    severity: 'critical',
    title: 'Blackhead (Histomoniasis) Risk',
    description: 'Never house turkeys near chickens or on ground previously used by chickens. Chickens carry the protozoan asymptomatically but it is often fatal to turkeys.',
  },
  {
    id: 'turkey-starve-out',
    species: ['turkey'],
    phases: ['starter'],
    maxWeek: 2,
    severity: 'warning',
    title: 'Turkey Poult Starve-Out Risk',
    description: 'Turkey poults may not find feed/water initially. Use bright lights, coloured marbles in waterers, and tap feeders to stimulate eating in the first 72 hours.',
  },
  {
    id: 'broiler-ascites',
    species: ['broiler'],
    phases: ['finisher'],
    minWeek: 4,
    severity: 'warning',
    title: 'Ascites & Sudden Death Risk',
    description: 'Fast-growing broilers in finisher phase are prone to ascites and sudden death syndrome. Ensure adequate ventilation and consider feed restriction if mortality spikes.',
  },
  {
    id: 'broiler-processing',
    species: ['broiler'],
    phases: ['finisher'],
    minWeek: 5,
    severity: 'info',
    title: 'Processing Preparation',
    description: 'Review all active medication withdrawal periods before scheduling processing. Ensure all drugs have cleared the required withdrawal days.',
  },
  {
    id: 'layer-calcium',
    species: ['layer'],
    phases: ['layer'],
    minWeek: 16,
    severity: 'info',
    title: 'Begin Calcium Supplementation',
    description: 'Switch to layer feed (3.5–4% calcium) or provide oyster shell free-choice. Inadequate calcium leads to soft shells and cage layer fatigue.',
  },
  {
    id: 'layer-prelay',
    species: ['layer'],
    phases: ['grower'],
    minWeek: 14,
    maxWeek: 18,
    severity: 'info',
    title: 'Pre-Lay Transition',
    description: 'Begin transitioning from grower to pre-layer feed. Increase light exposure gradually to 14–16 hours to stimulate onset of lay.',
  },
  {
    id: 'heat-stress-general',
    species: ['broiler', 'layer', 'duck', 'turkey'],
    severity: 'warning',
    title: 'Heat Stress Management',
    description: 'When ambient temperature exceeds 32°C: increase ventilation, add electrolytes to water, provide cool drinking water, and reduce feed during peak heat hours.',
  },
  {
    id: 'coccidiosis-risk',
    species: ['broiler', 'layer'],
    phases: ['starter', 'chick'],
    minWeek: 2,
    maxWeek: 6,
    severity: 'warning',
    title: 'Peak Coccidiosis Risk',
    description: 'Weeks 2–6 carry highest coccidiosis risk. Monitor for bloody droppings, hunched posture, and reduced feed intake. Keep litter dry and consider preventive Amprolium.',
  },
];

/**
 * Get active health alerts for a given species, phase, and week.
 * Also checks temperature for heat stress trigger.
 */
export function getActiveAlerts(
  species: string,
  phase: string,
  week: number,
  latestTempC?: number | null,
): HealthAlert[] {
  return SPECIES_HEALTH_ALERTS.filter(alert => {
    if (!alert.species.includes(species)) return false;
    if (alert.phases && !alert.phases.includes(phase)) return false;
    if (alert.minWeek && week < alert.minWeek) return false;
    if (alert.maxWeek && week > alert.maxWeek) return false;
    // Only show heat-stress-general when temp is actually high
    if (alert.id === 'heat-stress-general' && (!latestTempC || latestTempC < 32)) return false;
    return true;
  });
}

/**
 * Get the vaccination route from the template for a given vaccine name and species.
 */
export function getVaccineRoute(vaccineName: string, species: string): string | null {
  const template = VACCINATION_TEMPLATES.find(
    t => t.name === vaccineName && t.species.includes(species)
  );
  return template?.route ?? null;
}

/**
 * Get the prescriptive feed intake for a given species at a given age.
 * Aligned with Production-Grade specifications.
 */
export function getPrescriptiveFeedIntake(species: string, week: number): number {
  if (species === 'broiler') {
    if (week <= 3) return 0.05;
    if (week <= 5) return 0.09;
    return 0.15;
  } 
  if (species === 'layer') {
    if (week <= 6) return 0.06;
    if (week <= 16) return 0.09;
    if (week <= 60) return 0.12;
    return 0.10;
  }
  if (species === 'duck') {
    if (week <= 3) return 0.06;
    if (week <= 7) return 0.11;
    return 0.16;
  }
  if (species === 'turkey') {
    if (week <= 4) return 0.04;
    if (week <= 10) return 0.08;
    return 0.14;
  }
  return 0.05; // Default safety fallback
}

/**
 * Get the foraging modifier (feed reduction) for semi-intensive systems.
 */
export function getForagingModifier(species: string, week: number): number {
  if (species === 'duck' && week >= 6) {
    return week <= 7 ? 0.15 : 0.25;
  }
  if (species === 'turkey' && week >= 8) {
    return week <= 12 ? 0.12 : 0.22;
  }
  return 0;
}
