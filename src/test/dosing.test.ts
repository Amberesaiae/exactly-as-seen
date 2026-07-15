import { describe, it, expect } from 'vitest';
import { computeDose } from '@/lib/dosing';
import { getWaterPrescription, getRegionalTemperature } from '@/lib/dosing-utils';

describe('computeDose (dosing.ts)', () => {
  it('returns null for non-drinking_water delivery', () => {
    const result = computeDose({ id: 'inject1', delivery_method: 'injection', dose_per_gallon: 5 }, 10);
    expect(result).toBeNull();
  });

  it('calculates dose for oxytetracycline (tbsp)', () => {
    const result = computeDose({ id: 'oxytetracycline', delivery_method: 'drinking_water', dose_per_gallon: 1 }, 3.785);
    expect(result).not.toBeNull();
    expect(result!.unit).toBe('tbsp');
    expect(result!.amount).toBe(1);
  });

  it('calculates dose for enrofloxacin (ml)', () => {
    const result = computeDose({ id: 'enrofloxacin', delivery_method: 'drinking_water', dose_per_gallon: 2 }, 7.57);
    expect(result).not.toBeNull();
    expect(result!.unit).toBe('ml');
    expect(result!.amount).toBe(4);
  });

  it('calculates dose for glucose (tbsp)', () => {
    const result = computeDose({ id: 'glucose', delivery_method: 'drinking_water', dose_per_gallon: 4 }, 3.785);
    expect(result).not.toBeNull();
    expect(result!.unit).toBe('tbsp');
    expect(result!.amount).toBe(4);
  });

  it('defaults to tsp for unknown medication', () => {
    const result = computeDose({ id: 'unknown_med', delivery_method: 'drinking_water', dose_per_gallon: 1 }, 3.785);
    expect(result).not.toBeNull();
    expect(result!.unit).toBe('tsp');
  });

  it('uses 1.0 dose_per_gallon as default when null', () => {
    const result = computeDose({ id: 'corid', delivery_method: 'drinking_water', dose_per_gallon: null }, 3.785);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(1);
  });
});

describe('getWaterPrescription (dosing-utils.ts)', () => {
  it('returns correct base water for broiler week 1', () => {
    const result = getWaterPrescription({ species: 'broiler', week: 1, population: 100 });
    expect(result.baseMlPerBird).toBe(50);
    expect(result.appliedMultiplier).toBe(1.0);
    expect(result.liters).toBe(5);
  });

  it('returns correct base water for broiler week 4', () => {
    const result = getWaterPrescription({ species: 'broiler', week: 4, population: 100 });
    expect(result.baseMlPerBird).toBe(200);
  });

  it('returns correct base water for broiler week 5+', () => {
    const result = getWaterPrescription({ species: 'broiler', week: 10, population: 100 });
    expect(result.baseMlPerBird).toBe(250);
  });

  it('returns correct base water for layer', () => {
    const r1 = getWaterPrescription({ species: 'layer', week: 1, population: 50 });
    expect(r1.baseMlPerBird).toBe(50);

    const r3 = getWaterPrescription({ species: 'layer', week: 3, population: 50 });
    expect(r3.baseMlPerBird).toBe(100);

    const r10 = getWaterPrescription({ species: 'layer', week: 10, population: 50 });
    expect(r10.baseMlPerBird).toBe(200);

    const r20 = getWaterPrescription({ species: 'layer', week: 20, population: 50 });
    expect(r20.baseMlPerBird).toBe(300);
  });

  it('returns correct base water for duck', () => {
    const r1 = getWaterPrescription({ species: 'duck', week: 1, population: 50 });
    expect(r1.baseMlPerBird).toBe(150);

    const r3 = getWaterPrescription({ species: 'duck', week: 3, population: 50 });
    expect(r3.baseMlPerBird).toBe(250);

    const r10 = getWaterPrescription({ species: 'duck', week: 10, population: 50 });
    expect(r10.baseMlPerBird).toBe(450);

    const r25 = getWaterPrescription({ species: 'duck', week: 25, population: 50 });
    expect(r25.baseMlPerBird).toBe(500);
  });

  it('returns correct base water for turkey', () => {
    const r1 = getWaterPrescription({ species: 'turkey', week: 1, population: 50 });
    expect(r1.baseMlPerBird).toBe(100);

    const r5 = getWaterPrescription({ species: 'turkey', week: 5, population: 50 });
    expect(r5.baseMlPerBird).toBe(200);

    const r15 = getWaterPrescription({ species: 'turkey', week: 15, population: 50 });
    expect(r15.baseMlPerBird).toBe(500);
  });

  it('applies heat stress multiplier capped at 1.5x', () => {
    const result = getWaterPrescription({ species: 'broiler', week: 4, population: 100, temperatureC: 35 });
    expect(result.multiplier).toBe(2.0);
    expect(result.appliedMultiplier).toBe(1.5);
  });

  it('applies extreme heat multiplier capped at 1.5x', () => {
    const result = getWaterPrescription({ species: 'broiler', week: 4, population: 100, temperatureC: 36 });
    expect(result.multiplier).toBe(2.5);
    expect(result.appliedMultiplier).toBe(1.5);
    expect(result.caution).not.toBeNull();
    expect(result.caution!.type).toBe('extreme_heat');
  });

  it('applies 1.2x at 20-25°C', () => {
    const result = getWaterPrescription({ species: 'broiler', week: 4, population: 100, temperatureC: 22 });
    expect(result.multiplier).toBe(1.2);
    expect(result.appliedMultiplier).toBe(1.2);
  });

  it('no multiplier at 20°C or below', () => {
    const result = getWaterPrescription({ species: 'broiler', week: 4, population: 100, temperatureC: 18 });
    expect(result.multiplier).toBe(1.0);
    expect(result.appliedMultiplier).toBe(1.0);
  });

  it('calculates gallons correctly', () => {
    const result = getWaterPrescription({ species: 'broiler', week: 1, population: 100 });
    const expectedGallons = Number((5 / 3.785).toFixed(1));
    expect(result.gallons).toBe(expectedGallons);
  });

  it('handles week 0 edge case (falls through to default 250 for broiler)', () => {
    const result = getWaterPrescription({ species: 'broiler', week: 0, population: 100 });
    // week 0 doesn't match any explicit branch, falls to else = 250
    expect(result.baseMlPerBird).toBe(250);
  });

  it('handles week 52 edge case', () => {
    const result = getWaterPrescription({ species: 'layer', week: 52, population: 100 });
    expect(result.baseMlPerBird).toBe(300);
  });
});

describe('getRegionalTemperature (dosing-utils.ts)', () => {
  it('returns 31 for northern regions', () => {
    expect(getRegionalTemperature('Northern')).toBe(31);
    expect(getRegionalTemperature('Savannah')).toBe(31);
    expect(getRegionalTemperature('Upper East')).toBe(31);
    expect(getRegionalTemperature('Oti')).toBe(31);
    expect(getRegionalTemperature('Brong Ahafo')).toBe(31);
  });

  it('returns 28 for southern regions', () => {
    expect(getRegionalTemperature('Greater Accra')).toBe(28);
    expect(getRegionalTemperature('Central')).toBe(28);
    expect(getRegionalTemperature('Volta')).toBe(28);
    expect(getRegionalTemperature('Western')).toBe(28);
  });

  it('returns 28 for null/unknown', () => {
    expect(getRegionalTemperature(null)).toBe(28);
    expect(getRegionalTemperature('Unknown')).toBe(28);
  });
});
