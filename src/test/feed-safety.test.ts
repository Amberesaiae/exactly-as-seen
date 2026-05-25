import { describe, it, expect } from 'vitest';
import { preprocessFormulation, Ingredient, SelectedIngredient } from '../lib/feed-safety';

const availableIngredients: Ingredient[] = [
  { id: 'maize', name: 'Maize', category: 'energy', protein_pct: 9, energy_kcal_per_kg: 3350, calcium_pct: 0.02, phosphorus_pct: 0.3, lysine_pct: 0.24, methionine_pct: 0.18, contains_gossypol: false, contains_aflatoxin_risk: true, max_share_pct: 100 },
  { id: 'soybean_meal', name: 'Soybean Meal', category: 'protein', protein_pct: 44, energy_kcal_per_kg: 2230, calcium_pct: 0.3, phosphorus_pct: 0.65, lysine_pct: 2.7, methionine_pct: 0.65, contains_gossypol: false, contains_aflatoxin_risk: false, max_share_pct: 100 },
  { id: 'cotton_seed_meal', name: 'Cotton Seed Meal', category: 'protein', protein_pct: 41, energy_kcal_per_kg: 2100, calcium_pct: 0.2, phosphorus_pct: 0.6, lysine_pct: 1.7, methionine_pct: 0.55, contains_gossypol: true, contains_aflatoxin_risk: false, max_share_pct: 100 },
  { id: 'fish_meal', name: 'Fish Meal', category: 'protein', protein_pct: 60, energy_kcal_per_kg: 2800, calcium_pct: 5.0, phosphorus_pct: 3.0, lysine_pct: 4.5, methionine_pct: 1.8, contains_gossypol: false, contains_aflatoxin_risk: false, max_share_pct: 100 },
  { id: 'oyster_shell', name: 'Oyster Shell', category: 'calcium', protein_pct: 0, energy_kcal_per_kg: 0, calcium_pct: 38, phosphorus_pct: 0, lysine_pct: 0, methionine_pct: 0, contains_gossypol: false, contains_aflatoxin_risk: false, max_share_pct: 100 },
  { id: 'limestone', name: 'Limestone', category: 'calcium', protein_pct: 0, energy_kcal_per_kg: 0, calcium_pct: 36, phosphorus_pct: 0, lysine_pct: 0, methionine_pct: 0, contains_gossypol: false, contains_aflatoxin_risk: false, max_share_pct: 100 },
  { id: 'toxin_binder', name: 'Toxin Binder', category: 'supplement', protein_pct: 0, energy_kcal_per_kg: 0, calcium_pct: 0, phosphorus_pct: 0, lysine_pct: 0, methionine_pct: 0, contains_gossypol: false, contains_aflatoxin_risk: false, max_share_pct: 100 },
  { id: 'niacin', name: 'Niacin', category: 'supplement', protein_pct: 0, energy_kcal_per_kg: 0, calcium_pct: 0, phosphorus_pct: 0, lysine_pct: 0, methionine_pct: 0, contains_gossypol: false, contains_aflatoxin_risk: false, max_share_pct: 100 },
];

describe('feed-safety', () => {
  it('Rule R-FC-1: Compulsory toxin binder at exactly 0.5% should be auto-added', () => {
    const res = preprocessFormulation({
      species: 'broiler',
      targetKg: 100,
      selected: [
        { ingredient: availableIngredients[0], quantityKg: 60, unitPrice: 3.5 },
        { ingredient: availableIngredients[1], quantityKg: 40, unitPrice: 6.0 },
      ],
      availableIngredients,
    });

    const tb = res.selected.find(s => s.ingredient.id === 'toxin_binder');
    expect(tb).toBeDefined();
    expect(tb?.quantityKg).toBe(0.5); // 0.5% of 100kg is 0.5kg
    expect(tb?.autoAdded).toBe(true);
  });

  it('Rule R-FC-2: Cotton seed meal with gossypol for Layer should BLOCK', () => {
    const res = preprocessFormulation({
      species: 'layer',
      targetKg: 100,
      selected: [
        { ingredient: availableIngredients[0], quantityKg: 50, unitPrice: 3.5 },
        { ingredient: availableIngredients[2], quantityKg: 50, unitPrice: 4.5 }, // Cotton seed meal (contains_gossypol: true)
      ],
      availableIngredients,
    });

    expect(res.blocked).toBe(true);
    expect(res.blockedReason).toBe('LAYER_GOSSYPOL_BLOCKED');
  });

  it('Rule R-FC-3: Fish meal for Broiler should emit warnings', () => {
    const res = preprocessFormulation({
      species: 'broiler',
      targetKg: 100,
      selected: [
        { ingredient: availableIngredients[0], quantityKg: 60, unitPrice: 3.5 },
        { ingredient: availableIngredients[3], quantityKg: 40, unitPrice: 8.0 }, // Fish Meal
      ],
      availableIngredients,
    });

    expect(res.warnings).toContain('BROILER_FISH_MEAL_CAPPED: Fish meal is capped at 10% of target formulation to prevent flavor taint.');
  });

  it('Rule R-FC-4: Multiple calcium sources should keep only the last one and warn', () => {
    const res = preprocessFormulation({
      species: 'layer',
      targetKg: 100,
      selected: [
        { ingredient: availableIngredients[0], quantityKg: 50, unitPrice: 3.5 },
        { ingredient: availableIngredients[4], quantityKg: 25, unitPrice: 2.0 }, // Oyster Shell (calcium)
        { ingredient: availableIngredients[5], quantityKg: 25, unitPrice: 1.5 }, // Limestone (calcium)
      ],
      availableIngredients,
    });

    const calciumItems = res.selected.filter(s => s.ingredient.category === 'calcium');
    expect(calciumItems).toHaveLength(1);
    expect(calciumItems[0].ingredient.id).toBe('limestone'); // keeps the last one
    expect(res.warnings.some(w => w.includes('CALCIUM_SOURCE_REPLACED'))).toBe(true);
  });

  it('Rule R-FC-5: Duck batch should explicitly filter out niacin supplement line', () => {
    const res = preprocessFormulation({
      species: 'duck',
      targetKg: 100,
      selected: [
        { ingredient: availableIngredients[0], quantityKg: 50, unitPrice: 3.5 },
        { ingredient: availableIngredients[7], quantityKg: 50, unitPrice: 10.0 }, // Niacin (should be filtered out)
      ],
      availableIngredients,
    });

    const hasNiacin = res.selected.some(s => s.ingredient.id === 'niacin');
    expect(hasNiacin).toBe(false);
  });
});
