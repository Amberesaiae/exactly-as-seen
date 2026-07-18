import { describe, it, expect } from 'vitest';
import { preprocessFormulation } from '../lib/feed-safety';
import { normalizeIngredient, type Ingredient } from '../lib/feed-data';

const availableIngredients: Ingredient[] = [
  normalizeIngredient({ id: 'maize', name: 'Maize', category: 'energy', proteinPct: 9, energyKcal: 3350, calciumPct: 0.02, phosphorusPct: 0.3, lysinePct: 0.24, methioninePct: 0.18, fiberPct: 2, niacinMgKg: 20, usageLimits: { min: 0, max: 70 }, defaultPricePerKg: 3.5, containsAflatoxinRisk: true }),
  normalizeIngredient({ id: 'soybean_meal', name: 'Soybean Meal', category: 'protein', proteinPct: 44, energyKcal: 2230, calciumPct: 0.3, phosphorusPct: 0.65, lysinePct: 2.7, methioninePct: 0.65, fiberPct: 6, niacinMgKg: 0, usageLimits: { min: 0, max: 30 }, defaultPricePerKg: 6 }),
  normalizeIngredient({ id: 'cotton_seed_cake', name: 'Cotton Seed Meal', category: 'protein', proteinPct: 41, energyKcal: 2100, calciumPct: 0.2, phosphorusPct: 0.6, lysinePct: 1.7, methioninePct: 0.55, fiberPct: 12, niacinMgKg: 0, usageLimits: { min: 0, max: 10 }, defaultPricePerKg: 4.5, containsGossypol: true }),
  normalizeIngredient({ id: 'fish_meal_65', name: 'Fish Meal', category: 'protein', proteinPct: 60, energyKcal: 2800, calciumPct: 5, phosphorusPct: 3, lysinePct: 4.5, methioninePct: 1.8, fiberPct: 1, niacinMgKg: 0, usageLimits: { min: 0, max: 10 }, defaultPricePerKg: 8 }),
  normalizeIngredient({ id: 'oyster_shell', name: 'Oyster Shell', category: 'calcium', proteinPct: 0, energyKcal: 0, calciumPct: 38, phosphorusPct: 0, lysinePct: 0, methioninePct: 0, fiberPct: 0, niacinMgKg: 0, usageLimits: { min: 0, max: 5 }, defaultPricePerKg: 1 }),
  normalizeIngredient({ id: 'limestone', name: 'Limestone', category: 'calcium', proteinPct: 0, energyKcal: 0, calciumPct: 36, phosphorusPct: 0, lysinePct: 0, methioninePct: 0, fiberPct: 0, niacinMgKg: 0, usageLimits: { min: 0, max: 5 }, defaultPricePerKg: 0.8 }),
  normalizeIngredient({ id: 'toxin_binder', name: 'Toxin Binder', category: 'supplement', proteinPct: 0, energyKcal: 0, calciumPct: 0, phosphorusPct: 0, lysinePct: 0, methioninePct: 0, fiberPct: 0, niacinMgKg: 0, usageLimits: { min: 0.1, max: 0.3 }, defaultPricePerKg: 12 }),
  normalizeIngredient({ id: 'niacin_pure', name: 'Niacin', category: 'supplement', proteinPct: 0, energyKcal: 0, calciumPct: 0, phosphorusPct: 0, lysinePct: 0, methioninePct: 0, fiberPct: 0, niacinMgKg: 0, usageLimits: { min: 0, max: 1 }, defaultPricePerKg: 20 }),
];

describe('feed-safety', () => {
  it('blocks high-risk maize/groundnut mix without toxin binder', () => {
    const res = preprocessFormulation({
      species: 'broiler',
      targetKg: 100,
      selected: [
        { ingredient: availableIngredients[0], quantityKg: 60, unitPrice: 3.5 },
        { ingredient: availableIngredients[1], quantityKg: 40, unitPrice: 6.0 },
      ],
      availableIngredients,
    });

    expect(res.blocked).toBe(true);
    expect(res.blockedReason).toMatch(/Toxin Binder/i);
    expect(res.suggestions.some((s) => s.id === 'toxin_binder')).toBe(true);
  });

  it('blocks cotton seed for layers (gossypol / yolk discoloration)', () => {
    const res = preprocessFormulation({
      species: 'layer',
      targetKg: 100,
      selected: [
        { ingredient: availableIngredients[0], quantityKg: 50, unitPrice: 3.5 },
        { ingredient: availableIngredients[2], quantityKg: 50, unitPrice: 4.5 },
      ],
      availableIngredients,
    });

    expect(res.blocked).toBe(true);
    expect(res.blockedReason).toMatch(/Cotton Seed|gossypol|yolk/i);
  });

  it('warns when layer fish meal exceeds 8%', () => {
    const res = preprocessFormulation({
      species: 'layer',
      targetKg: 100,
      selected: [
        { ingredient: availableIngredients[0], quantityKg: 60, unitPrice: 3.5 },
        { ingredient: availableIngredients[3], quantityKg: 40, unitPrice: 8.0 },
      ],
      availableIngredients,
    });

    expect(res.warnings.some((w) => w.toLowerCase().includes('fish'))).toBe(true);
  });

  it('warns on multiple calcium sources (guidance, does not strip)', () => {
    const res = preprocessFormulation({
      species: 'layer',
      targetKg: 100,
      selected: [
        { ingredient: availableIngredients[0], quantityKg: 50, unitPrice: 3.5 },
        { ingredient: availableIngredients[4], quantityKg: 25, unitPrice: 2.0 },
        { ingredient: availableIngredients[5], quantityKg: 25, unitPrice: 1.5 },
      ],
      availableIngredients,
    });

    const calciumItems = res.selected.filter((s) => s.ingredient.category === 'calcium');
    expect(calciumItems.length).toBeGreaterThanOrEqual(1);
    expect(res.warnings.some((w) => w.toLowerCase().includes('calcium'))).toBe(true);
  });

  it('blocks ducks without niacin / waterfowl premix', () => {
    const res = preprocessFormulation({
      species: 'duck',
      targetKg: 100,
      selected: [
        { ingredient: availableIngredients[0], quantityKg: 60, unitPrice: 3.5 },
        { ingredient: availableIngredients[1], quantityKg: 40, unitPrice: 6.0 },
      ],
      availableIngredients,
    });

    expect(res.blocked).toBe(true);
    expect(res.blockedReason).toMatch(/Niacin|duck/i);
  });
});
