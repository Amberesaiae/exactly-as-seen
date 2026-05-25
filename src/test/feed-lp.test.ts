import { describe, it, expect, vi } from 'vitest';
import { solveFeedLP, buildCplexLp } from '../lib/feed-lp';
import { Ingredient, SelectedIngredient } from '../lib/feed-safety';

vi.mock('highs', () => {
  return {
    default: vi.fn().mockRejectedValue(new Error('WASM load error')),
  };
});

const availableIngredients: Ingredient[] = [
  { id: 'maize', name: 'Maize', category: 'energy', protein_pct: 9, energy_kcal_per_kg: 3350, calcium_pct: 0.02, phosphorus_pct: 0.3, lysine_pct: 0.24, methionine_pct: 0.18, contains_gossypol: false, contains_aflatoxin_risk: true, max_share_pct: 100 },
  { id: 'soybean_meal', name: 'Soybean Meal', category: 'protein', protein_pct: 44, energy_kcal_per_kg: 2230, calcium_pct: 0.3, phosphorus_pct: 0.65, lysine_pct: 2.7, methionine_pct: 0.65, contains_gossypol: false, contains_aflatoxin_risk: false, max_share_pct: 100 },
  { id: 'toxin_binder', name: 'Toxin Binder', category: 'supplement', protein_pct: 0, energy_kcal_per_kg: 0, calcium_pct: 0, phosphorus_pct: 0, lysine_pct: 0, methionine_pct: 0, contains_gossypol: false, contains_aflatoxin_risk: false, max_share_pct: 100 },
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
    const selected: SelectedIngredient[] = [
      { ingredient: availableIngredients[0], quantityKg: 0, unitPrice: 3.5 },
      { ingredient: availableIngredients[1], quantityKg: 0, unitPrice: 6.0 },
      { ingredient: availableIngredients[2], quantityKg: 0.5, unitPrice: 0.0, autoAdded: true },
    ];

    // Extreme impossible protein target to force infeasibility
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

    // Should return fallback state
    expect(res.status).toBe('fallback');
    expect(res.quantities['toxin_binder']).toBe(0.5);
    expect(res.fallbackReason).toBeDefined();
  });
});
