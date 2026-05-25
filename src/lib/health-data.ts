// Vaccination schedules, medication reference data, and species health alerts

export interface VaccineTemplate {
  name: string;
  species: string[];
  scheduledWeek: number;
  route: string;
  notes?: string;
}

export const VACCINATION_TEMPLATES: VaccineTemplate[] = [
  { name: 'Gumboro Intermediate', species: ['broiler'], scheduledWeek: 1, route: 'Drinking water' },
  { name: 'HB1 (Newcastle + IB)', species: ['broiler'], scheduledWeek: 2, route: 'Eye drop / Drinking water' },
  { name: 'Gumboro Intermediate Plus', species: ['broiler'], scheduledWeek: 3, route: 'Drinking water' },
  { name: 'Lasota (Newcastle)', species: ['broiler'], scheduledWeek: 4, route: 'Drinking water' },
  { name: 'Gumboro Intermediate Plus', species: ['broiler'], scheduledWeek: 5, route: 'Drinking water' },
  { name: 'Marek\'s Disease', species: ['layer'], scheduledWeek: 0, route: 'SC injection at hatchery', notes: 'Day-old' },
  { name: 'Newcastle (HB1)', species: ['layer', 'duck', 'turkey'], scheduledWeek: 1, route: 'Eye drop / Drinking water' },
  { name: 'Gumboro (IBD) 1st', species: ['layer'], scheduledWeek: 2, route: 'Drinking water' },
  { name: 'Gumboro (IBD) 2nd', species: ['layer'], scheduledWeek: 3, route: 'Drinking water' },
  { name: 'Newcastle (Lasota)', species: ['layer', 'duck', 'turkey'], scheduledWeek: 4, route: 'Drinking water' },
  { name: 'Fowl Pox', species: ['layer'], scheduledWeek: 6, route: 'Wing web' },
  { name: 'Newcastle Booster', species: ['layer', 'duck'], scheduledWeek: 8, route: 'Drinking water' },
  { name: 'Fowl Typhoid', species: ['layer'], scheduledWeek: 10, route: 'SC injection' },
  { name: 'Newcastle (Komarov/Killed)', species: ['layer'], scheduledWeek: 16, route: 'IM injection' },
  { name: 'Duck Hepatitis', species: ['duck'], scheduledWeek: 1, route: 'SC injection' },
  { name: 'Duck Plague', species: ['duck'], scheduledWeek: 8, route: 'SC injection' },
  { name: 'Blackhead (Histomoniasis)', species: ['turkey'], scheduledWeek: 3, route: 'Drinking water' },
];

export interface MedicationTemplate {
  name: string;
  taskType: 'medication' | 'supplement';
  dosePerGallon: string; // human-readable dosing
  durationDays: number;
  withdrawalMeatDays: number;
  withdrawalEggDays: number;
  indication: string;
}

export const MEDICATION_TEMPLATES: MedicationTemplate[] = [
  { name: 'Amprolium (Corid)', taskType: 'medication', dosePerGallon: '1 tsp per gallon', durationDays: 5, withdrawalMeatDays: 1, withdrawalEggDays: 0, indication: 'Coccidiosis treatment' },
  { name: 'Oxytetracycline', taskType: 'medication', dosePerGallon: '1 tbsp per gallon', durationDays: 5, withdrawalMeatDays: 7, withdrawalEggDays: 7, indication: 'Respiratory/bacterial infections' },
  { name: 'Tylosin (Tylan)', taskType: 'medication', dosePerGallon: '1 tsp per gallon', durationDays: 5, withdrawalMeatDays: 5, withdrawalEggDays: 5, indication: 'Mycoplasma / CRD' },
  { name: 'Fenbendazole (Safe-Guard)', taskType: 'medication', dosePerGallon: '1 ml per gallon', durationDays: 3, withdrawalMeatDays: 14, withdrawalEggDays: 14, indication: 'Internal parasites (worms)' },
  { name: 'Enrofloxacin (Baytril)', taskType: 'medication', dosePerGallon: '1 ml per gallon', durationDays: 5, withdrawalMeatDays: 10, withdrawalEggDays: 10, indication: 'Severe bacterial infections' },
  { name: 'Multivitamins + Electrolytes', taskType: 'supplement', dosePerGallon: '1 tbsp per gallon', durationDays: 3, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Stress relief, post-vaccination, heat stress' },
  { name: 'Glucose/Sugar Water', taskType: 'supplement', dosePerGallon: '4 tbsp per gallon', durationDays: 1, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Day-old chick arrival, energy boost' },
  { name: 'Probiotics', taskType: 'supplement', dosePerGallon: '1 tsp per gallon', durationDays: 5, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Gut health, post-antibiotic recovery' },
  { name: 'Apple Cider Vinegar', taskType: 'supplement', dosePerGallon: '1 tbsp per gallon', durationDays: 7, withdrawalMeatDays: 0, withdrawalEggDays: 0, indication: 'Gut health, pH balance' },
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
 * Get the MedicationTemplate for a given product name.
 */
export function getMedTemplate(productName: string): MedicationTemplate | null {
  return MEDICATION_TEMPLATES.find(m => m.name === productName) ?? null;
}
