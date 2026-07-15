import { describe, it, expect } from 'vitest';
import { optimizeFormulation } from '@/lib/feed-optimizer';
import type { Ingredient, FeedPhase } from '@/lib/feed-data';

const broilerStarterPhase: FeedPhase = {
  name: 'Starter',
  weekStart: 0,
  weekEnd: 3,
  proteinPct: 23,
  energyKcal: 3200,
  calciumPct: 1.0,
  feedPerBirdG: 25,
};

const layerPhase: FeedPhase = {
  name: 'Layer',
  weekStart: 19,
  weekEnd: 999,
  proteinPct: 16.5,
  energyKcal: 2800,
  calciumPct: 3.5,
  feedPerBirdG: 110,
};

const maize: Ingredient = {
  id: 'maize',
  name: 'Maize (Corn)',
  category: 'energy',
  proteinPct: 8.5,
  energyKcal: 3350,
  calciumPct: 0.02,
  phosphorusPct: 0.28,
  lysinePct: 0.24,
  methioninePct: 0.18,
  fiberPct: 2.2,
  niacinMgKg: 20,
  usageLimits: { min: 0, max: 70 },
  defaultPricePerKg: 3.5,
};

const soybeanMeal: Ingredient = {
  id: 'soybean_meal_44',
  name: 'Soybean Meal (44% CP)',
  category: 'protein',
  proteinPct: 44,
  energyKcal: 2230,
  calciumPct: 0.3,
  phosphorusPct: 0.65,
  lysinePct: 2.8,
  methioninePct: 0.6,
  fiberPct: 6.5,
  niacinMgKg: 0,
  usageLimits: { min: 0, max: 30 },
  defaultPricePerKg: 6,
};

const limestone: Ingredient = {
  id: 'limestone',
  name: 'Limestone',
  category: 'calcium',
  proteinPct: 0,
  energyKcal: 0,
  calciumPct: 38,
  phosphorusPct: 0,
  lysinePct: 0,
  methioninePct: 0,
  fiberPct: 0,
  niacinMgKg: 0,
  usageLimits: { min: 0, max: 5 },
  defaultPricePerKg: 0.8,
};

const premix: Ingredient = {
  id: 'premix_broiler',
  name: 'Vitamin Premix (Broiler)',
  category: 'supplement',
  proteinPct: 0,
  energyKcal: 0,
  calciumPct: 0,
  phosphorusPct: 0,
  lysinePct: 0,
  methioninePct: 0,
  fiberPct: 0,
  niacinMgKg: 0,
  usageLimits: { min: 0.25, max: 0.5 },
  defaultPricePerKg: 15,
};

const toxinBinder: Ingredient = {
  id: 'toxin_binder',
  name: 'Mycotoxin Binder',
  category: 'supplement',
  proteinPct: 0,
  energyKcal: 0,
  calciumPct: 0,
  phosphorusPct: 0,
  lysinePct: 0,
  methioninePct: 0,
  fiberPct: 0,
  niacinMgKg: 0,
  usageLimits: { min: 0.1, max: 0.3 },
  defaultPricePerKg: 12,
};

describe('feed-optimizer.ts', () => {
  it('returns failure for empty ingredients', () => {
    const result = optimizeFormulation([], 100, broilerStarterPhase);
    expect(result.success).toBe(false);
    expect(result.message).toBe('No ingredients selected');
    expect(result.totalCost).toBe(0);
  });

  it('allocates supplements at fixed percentages', () => {
    const result = optimizeFormulation(
      [
        { ingredient: premix, unitPrice: 15 },
        { ingredient: toxinBinder, unitPrice: 12 },
      ],
      100,
      broilerStarterPhase
    );

    expect(result.success).toBe(true);
    const premixItem = result.ingredients.find(i => i.ingredient.id === 'premix_broiler');
    const toxinItem = result.ingredients.find(i => i.ingredient.id === 'toxin_binder');
    expect(premixItem!.quantityKg).toBe(0.5); // 0.5% of 100
    expect(toxinItem!.quantityKg).toBe(0.5); // 0.5% of 100
  });

  it('allocates calcium to meet phase target', () => {
    const result = optimizeFormulation(
      [
        { ingredient: maize, unitPrice: 3.5 },
        { ingredient: soybeanMeal, unitPrice: 6 },
        { ingredient: limestone, unitPrice: 0.8 },
      ],
      100,
      broilerStarterPhase
    );

    expect(result.success).toBe(true);
    const limestoneItem = result.ingredients.find(i => i.ingredient.id === 'limestone');
    expect(limestoneItem!.quantityKg).toBeGreaterThan(0);
  });

  it('splits remaining between energy and protein', () => {
    const result = optimizeFormulation(
      [
        { ingredient: maize, unitPrice: 3.5 },
        { ingredient: soybeanMeal, unitPrice: 6 },
      ],
      100,
      broilerStarterPhase
    );

    expect(result.success).toBe(true);
    const maizeItem = result.ingredients.find(i => i.ingredient.id === 'maize');
    const soyItem = result.ingredients.find(i => i.ingredient.id === 'soybean_meal_44');
    expect(maizeItem!.quantityKg).toBeGreaterThan(0);
    expect(soyItem!.quantityKg).toBeGreaterThan(0);
  });

  it('total cost equals sum of quantity * unitPrice', () => {
    const result = optimizeFormulation(
      [
        { ingredient: maize, unitPrice: 3.5 },
        { ingredient: soybeanMeal, unitPrice: 6 },
      ],
      100,
      broilerStarterPhase
    );

    expect(result.success).toBe(true);
    const expectedCost = result.ingredients.reduce(
      (sum, i) => sum + i.quantityKg * i.unitPrice,
      0
    );
    expect(result.totalCost).toBeCloseTo(expectedCost, 0);
  });

  it('allocations sum approximately to target kg', () => {
    const result = optimizeFormulation(
      [
        { ingredient: maize, unitPrice: 3.5 },
        { ingredient: soybeanMeal, unitPrice: 6 },
      ],
      100,
      broilerStarterPhase
    );

    expect(result.success).toBe(true);
    const totalKg = result.ingredients.reduce((sum, i) => sum + i.quantityKg, 0);
    expect(totalKg).toBeCloseTo(100, -1); // within 10 kg tolerance
  });

  it('nutrition values are positive', () => {
    const result = optimizeFormulation(
      [
        { ingredient: maize, unitPrice: 3.5 },
        { ingredient: soybeanMeal, unitPrice: 6 },
      ],
      100,
      broilerStarterPhase
    );

    expect(result.nutrition.protein).toBeGreaterThan(0);
    expect(result.nutrition.energy).toBeGreaterThan(0);
  });

  it('prefers cheaper protein sources', () => {
    const cheapProtein: Ingredient = {
      ...soybeanMeal,
      id: 'palm_kernel_cake',
      name: 'Palm Kernel Cake',
      defaultPricePerKg: 2.5,
      proteinPct: 18,
    };

    const result = optimizeFormulation(
      [
        { ingredient: maize, unitPrice: 3.5 },
        { ingredient: cheapProtein, unitPrice: 2.5 },
        { ingredient: soybeanMeal, unitPrice: 6 },
      ],
      100,
      broilerStarterPhase
    );

    expect(result.success).toBe(true);
    const cheapItem = result.ingredients.find(i => i.ingredient.id === 'palm_kernel_cake');
    const expensiveItem = result.ingredients.find(i => i.ingredient.id === 'soybean_meal_44');
    expect(cheapItem!.quantityKg).toBeGreaterThanOrEqual(expensiveItem!.quantityKg);
  });

  it('handles layer phase with higher calcium target', () => {
    const result = optimizeFormulation(
      [
        { ingredient: maize, unitPrice: 3.5 },
        { ingredient: soybeanMeal, unitPrice: 6 },
        { ingredient: limestone, unitPrice: 0.8 },
      ],
      100,
      layerPhase
    );

    expect(result.success).toBe(true);
    const limestoneItem = result.ingredients.find(i => i.ingredient.id === 'limestone');
    // Layer phase needs 3.5% calcium, so limestone allocation should be higher
    expect(limestoneItem!.quantityKg).toBeGreaterThan(0);
  });

  it('pct values sum approximately to 100%', () => {
    const result = optimizeFormulation(
      [
        { ingredient: maize, unitPrice: 3.5 },
        { ingredient: soybeanMeal, unitPrice: 6 },
      ],
      100,
      broilerStarterPhase
    );

    expect(result.success).toBe(true);
    const totalPct = result.ingredients.reduce((sum, i) => sum + i.pct, 0);
    expect(totalPct).toBeCloseTo(100, -1);
  });
});
