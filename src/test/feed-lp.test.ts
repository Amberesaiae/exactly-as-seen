import { describe, it, expect, vi } from 'vitest';
import { solveFeedLP, buildCplexLp } from '../lib/feed-lp';
import type { SelectedIngredient } from '../lib/feed-safety';
import { normalizeIngredient } from '../lib/feed-data';

vi.mock('highs', () => {
  return {
    default: vi.fn().mockRejectedValue(new Error('WASM load error')),
  };
});

const availableIngredients = [
  normalizeIngredient({ id: 'maize', name: 'Maize', category: 'energy', proteinPct: 9, energyKcal: 3350, calciumPct: 0.02, phosphorusPct: 0.3, lysinePct: 0.24, methioninePct: 0.18, fiberPct: 2, niacinMgKg: 20, usageLimits: { min: 0, max: 70 }, defaultPricePerKg: 3.5 }),
  normalizeIngredient({ id: 'soybean_meal', name: 'Soybean Meal', category: 'protein', proteinPct: 44, energyKcal: 2230, calciumPct: 0.3, phosphorusPct: 0.65, lysinePct: 2.7, methioninePct: 0.65, fiberPct: 6, niacinMgKg: 0, usageLimits: { min: 0, max: 30 }, defaultPricePerKg: 6 }),
  normalizeIngredient({ id: 'toxin_binder', name: 'Toxin Binder', category: 'supplement', proteinPct: 0, energyKcal: 0, calciumPct: 0, phosphorusPct: 0, lysinePct: 0, methioninePct: 0, fiberPct: 0, niacinMgKg: 0, usageLimits: { min: 0.1, max: 0.3 }, defaultPricePerKg: 12 }),
];

describe('feed-lp', () => {
  it('buildCplexLp should generate correct CPLEX-LP format', () => {
    const selected: SelectedIngredient[] = [
      { ingredient: availableIngredients[0], quantityKg: 0, unitPrice: 3.5 },
      { ingredient: availableIngredients[1], quantityKg: 0, unitPrice: 6.0 },
      { ingredient: availableIngredients[2], quantityKg: 0.5, unitPrice: 0.0, autoAdded: true },
    ];

    const requirements = {
      protein_min: 20,
      energy_min: 2900,
      energy_max: 3200,
    };

    const lpText = buildCplexLp({
      ingredients: selected,
      requirements,
      targetKg: 100,
      species: 'broiler',
    });

    expect(lpText).toContain('Minimize');
    expect(lpText).toContain('Subject To');
    expect(lpText).toContain('mass:');
    expect(lpText).toContain('protein:');
    expect(lpText).toContain('energy_min:');
    expect(lpText).toContain('energy_max:');
    expect(lpText).toContain('Bounds');
    expect(lpText).toContain('End');
  });

  it('solveFeedLP should fallback gracefully when infeasible or when solver fails', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const selected: SelectedIngredient[] = [
      { ingredient: availableIngredients[0], quantityKg: 0, unitPrice: 3.5 },
      { ingredient: availableIngredients[1], quantityKg: 0, unitPrice: 6.0 },
      { ingredient: availableIngredients[2], quantityKg: 0.5, unitPrice: 0.0, autoAdded: true },
    ];

    const requirements = {
      protein_min: 99.0,
    };

    const res = await solveFeedLP({
      species: 'broiler',
      targetKg: 100,
      selected,
      requirements,
      timeoutMs: 1000,
    });

    expect(res.status).toBe('fallback');
    expect(res.fallbackReason).toBeDefined();
    errSpy.mockRestore();
  });
});

