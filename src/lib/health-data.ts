// Vaccination schedules and medication reference data

export interface VaccineTemplate {
  name: string;
  species: string[];
  scheduledWeek: number;
  route: string;
  notes?: string;
}

export const VACCINATION_TEMPLATES: VaccineTemplate[] = [
  { name: 'Marek\'s Disease', species: ['broiler', 'layer'], scheduledWeek: 0, route: 'SC injection at hatchery', notes: 'Day-old' },
  { name: 'Newcastle (HB1)', species: ['broiler', 'layer', 'duck', 'turkey'], scheduledWeek: 1, route: 'Eye drop / Drinking water' },
  { name: 'Gumboro (IBD) 1st', species: ['broiler', 'layer'], scheduledWeek: 2, route: 'Drinking water' },
  { name: 'Gumboro (IBD) 2nd', species: ['broiler', 'layer'], scheduledWeek: 3, route: 'Drinking water' },
  { name: 'Newcastle (Lasota)', species: ['broiler', 'layer', 'duck', 'turkey'], scheduledWeek: 4, route: 'Drinking water' },
  { name: 'Fowl Pox', species: ['broiler', 'layer'], scheduledWeek: 6, route: 'Wing web' },
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
    { phase: 'Rearing', weekStart: 1, weekEnd: 20, rateMin: 0, rateMax: 0 },
    { phase: 'Early', weekStart: 21, weekEnd: 28, rateMin: 50, rateMax: 70 },
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
