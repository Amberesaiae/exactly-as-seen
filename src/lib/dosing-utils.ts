/**
 * West African Poultry Dosing and Water Consumption Utilities
 * Realigned to 'Lean Engineering' foundation: Guidance over Enforcement.
 * Uses core species protocols from research with pragmatic 'Lean Tool' capping.
 */

export interface WaterPrescriptionResult {
  liters: number;
  gallons: number;
  baseMlPerBird: number;
  multiplier: number;
  appliedMultiplier: number; // Capped multiplier used for calculations
  caution?: {
    type: 'heat_stress' | 'extreme_heat';
    message: string;
    suggestedMultiplier: number; // The higher spec-based multiplier for user awareness
  } | null;
}

/**
 * Get the prescriptive daily water consumption for a flock.
 * Pragmatic Dosing: Calculations are capped at 1.5x to avoid overkill ledgering.
 * Extreme scenarios (2.0x-3.0x) are returned as 'caution' objects for guidance.
 */
export function getWaterPrescription(args: {
  species: string;
  duckType?: string | null;
  week: number;
  population: number;
  temperatureC?: number | null;
}): WaterPrescriptionResult {
  const { species, week, population, temperatureC } = args;

  // 1. Get Base ml per bird per day (Core Protocol)
  let baseMl = 50;

  if (species === 'broiler') {
    if (week === 1) baseMl = 50;
    else if (week === 2) baseMl = 100;
    else if (week === 3) baseMl = 150;
    else if (week === 4) baseMl = 200;
    else baseMl = 250;
  } 
  else if (species === 'layer') {
    if (week <= 2) baseMl = 50;
    else if (week <= 4) baseMl = 100;
    else if (week <= 8) baseMl = 150;
    else if (week <= 15) baseMl = 200;
    else baseMl = 300;
  } 
  else if (species === 'duck') {
    if (week <= 2) baseMl = 150;
    else if (week <= 4) baseMl = 250;
    else baseMl = 400; 
  } 
  else if (species === 'turkey') {
    if (week <= 2) baseMl = 100;
    else if (week <= 6) baseMl = 200;
    else if (week <= 10) baseMl = 300;
    else if (week <= 14) baseMl = 400;
    else baseMl = 500;
  }

  // 2. Pragmatic Heat Logic (Lean Foundation)
  // We identify the true multiplier from the spec but cap the implementation.
  let trueMultiplier = 1.0;
  let caution: WaterPrescriptionResult['caution'] = null;

  if (temperatureC) {
    if (temperatureC > 35) {
      trueMultiplier = 2.5; 
      caution = {
        type: 'extreme_heat',
        suggestedMultiplier: 2.5,
        message: 'EXTREME HEAT: Spec suggests 2.5x to 3x water. House temperature is dangerous; ensure max ventilation and cool water.'
      };
    } else if (temperatureC > 30) {
      trueMultiplier = 2.0;
      caution = {
        type: 'heat_stress',
        suggestedMultiplier: 2.0,
        message: 'HEAT STRESS: Multiplier 2.0x recommended. Birds are panting to stay cool.'
      };
    } else if (temperatureC > 25) {
      trueMultiplier = 1.5;
    } else if (temperatureC >= 20) {
      trueMultiplier = 1.2;
    }
  }

  // 3. Lean Capping (Crucial Realignment)
  // Baseline water intake is capped at 1.5x for auto-calculations to prevent overkill.
  const appliedMultiplier = Math.min(1.5, trueMultiplier);

  const liters = (baseMl * population * appliedMultiplier) / 1000;
  const gallons = Number((liters / 3.785).toFixed(1));

  return {
    liters: Number(liters.toFixed(1)),
    gallons,
    baseMlPerBird: baseMl,
    multiplier: trueMultiplier,
    appliedMultiplier,
    caution,
  };
}

/**
 * Provides regional ambient temperature fallbacks for Ghana.
 */
export function getRegionalTemperature(region: string | null): number {
  if (!region) return 28.0;
  const r = region.toLowerCase();

  if (
    r.includes('northern') ||
    r.includes('savannah') ||
    r.includes('upper') ||
    r.includes('oti') ||
    r.includes('brong')
  ) {
    return 31.0;
  }
  
  if (
    r.includes('accra') ||
    r.includes('central') ||
    r.includes('volta') ||
    r.includes('western')
  ) {
    return 28.0;
  }

  return 28.0;
}
