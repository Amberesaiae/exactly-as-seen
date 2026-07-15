import { describe, it, expect } from 'vitest';
import { computeDose, type Medication } from '@/lib/dosing';

describe('medication-dosing (species-specific)', () => {
  const makeMed = (id: string, method = 'drinking_water', dosePerGal?: number): Medication => ({
    id,
    delivery_method: method,
    dose_per_gallon: dosePerGal,
  });

  describe('broiler dosing', () => {
    it('oxytetracycline (tbsp) for broiler', () => {
      const result = computeDose(makeMed('oxytetracycline', 'drinking_water', 1), 7.57);
      expect(result).not.toBeNull();
      expect(result!.unit).toBe('tbsp');
      expect(result!.amount).toBe(2);
    });

    it('enrofloxacin (ml) for broiler', () => {
      const result = computeDose(makeMed('enrofloxacin', 'drinking_water', 2), 3.785);
      expect(result).not.toBeNull();
      expect(result!.unit).toBe('ml');
      expect(result!.amount).toBe(2);
    });

    it('glucose (tbsp) for broiler', () => {
      const result = computeDose(makeMed('glucose', 'drinking_water', 4), 3.785);
      expect(result).not.toBeNull();
      expect(result!.unit).toBe('tbsp');
      expect(result!.amount).toBe(4);
    });

    it('multivitamins (tbsp) for broiler', () => {
      const result = computeDose(makeMed('multivitamins', 'drinking_water', 1), 3.785);
      expect(result).not.toBeNull();
      expect(result!.unit).toBe('tbsp');
    });
  });

  describe('layer dosing', () => {
    it('ivermectin (ml) for layer', () => {
      const result = computeDose(makeMed('ivermectin', 'drinking_water', 1), 7.57);
      expect(result).not.toBeNull();
      expect(result!.unit).toBe('ml');
      expect(result!.amount).toBe(2);
    });

    it('fenbendazole (ml) for layer', () => {
      const result = computeDose(makeMed('fenbendazole', 'drinking_water', 3), 7.57);
      expect(result).not.toBeNull();
      expect(result!.unit).toBe('ml');
      expect(result!.amount).toBe(6);
    });
  });

  describe('duck dosing', () => {
    it('activated_charcoal (tbsp) for duck', () => {
      const result = computeDose(makeMed('activated_charcoal', 'drinking_water', 1), 3.785);
      expect(result).not.toBeNull();
      expect(result!.unit).toBe('tbsp');
    });

    it('apple_cider_vinegar (tbsp) for duck', () => {
      const result = computeDose(makeMed('apple_cider_vinegar', 'drinking_water', 1), 7.57);
      expect(result).not.toBeNull();
      expect(result!.unit).toBe('tbsp');
      expect(result!.amount).toBe(2);
    });
  });

  describe('turkey dosing', () => {
    it('levamisole (ml) for turkey', () => {
      const result = computeDose(makeMed('levamisole', 'drinking_water', 2), 7.57);
      expect(result).not.toBeNull();
      expect(result!.unit).toBe('ml');
      expect(result!.amount).toBe(4);
    });

    it('oxytetracycline (tbsp) for turkey', () => {
      const result = computeDose(makeMed('oxytetracycline', 'drinking_water', 1.5), 11.355);
      expect(result).not.toBeNull();
      expect(result!.unit).toBe('tbsp');
      expect(result!.amount).toBe(4.5);
    });
  });

  describe('injection route returns null', () => {
    it('injection delivery returns null for any species', () => {
      expect(computeDose(makeMed('vaccine1', 'injection'), 5)).toBeNull();
    });

    it('wing_web delivery returns null', () => {
      expect(computeDose(makeMed('fowl_pox', 'wing_web'), 5)).toBeNull();
    });

    it('spray delivery returns null', () => {
      expect(computeDose(makeMed('spray_vaccine', 'spray'), 5)).toBeNull();
    });
  });

  describe('dose scaling with water volume', () => {
    it('dose scales linearly with water volume', () => {
      const small = computeDose(makeMed('corid', 'drinking_water', 1), 3.785);
      const large = computeDose(makeMed('corid', 'drinking_water', 1), 7.57);
      expect(large!.amount).toBe(small!.amount * 2);
    });

    it('dose scales with dose_per_gallon', () => {
      const low = computeDose(makeMed('corid', 'drinking_water', 1), 3.785);
      const high = computeDose(makeMed('corid', 'drinking_water', 2), 3.785);
      expect(high!.amount).toBe(low!.amount * 2);
    });
  });
});
