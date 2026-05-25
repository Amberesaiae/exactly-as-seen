export interface Ingredient {
  id: string;
  name: string;
  category: string;
  protein_pct: number;
  energy_kcal_per_kg: number;
  calcium_pct: number;
  phosphorus_pct: number;
  lysine_pct: number;
  methionine_pct: number;
  contains_gossypol: boolean;
  contains_aflatoxin_risk: boolean;
  max_share_pct: number;
}

export interface SelectedIngredient {
  ingredient: Ingredient;
  quantityKg: number;
  unitPrice: number;
  autoAdded?: boolean;
}

export interface PreprocessResult {
  selected: SelectedIngredient[];
  blocked: boolean;
  blockedReason?: string;
  warnings: string[];
}

export function preprocessFormulation(args: {
  species: string;
  targetKg: number;
  selected: SelectedIngredient[];
  availableIngredients: Ingredient[];
}): PreprocessResult {
  const warnings: string[] = [];
  let blocked = false;
  let blockedReason: string | undefined = undefined;

  let currentSelected = [...args.selected];

  // Rule R-FC-5: Duck niacin must NOT be added by the preprocessor (handled via Water-Health auto-tasks)
  currentSelected = currentSelected.filter(s => s.ingredient.id !== 'niacin');

  // Rule R-FC-4: Single calcium source (keep only the last calcium source)
  const calciumSelected = currentSelected.filter(s => s.ingredient.category === 'calcium');
  if (calciumSelected.length > 1) {
    const lastCalcium = calciumSelected[calciumSelected.length - 1];
    currentSelected = currentSelected.filter(s => s.ingredient.category !== 'calcium' || s.ingredient.id === lastCalcium.ingredient.id);
    warnings.push(`CALCIUM_SOURCE_REPLACED: Multiple calcium sources selected. Persisting only the last selection: ${lastCalcium.ingredient.name}.`);
  }

  // Rule R-FC-2: Gossypol block for layers
  if (args.species === 'layer') {
    const hasGossypol = currentSelected.some(s => s.ingredient.contains_gossypol);
    if (hasGossypol) {
      blocked = true;
      blockedReason = 'LAYER_GOSSYPOL_BLOCKED';
    }
  }

  // Rule R-FC-3: Fish meal cap for broilers
  if (args.species === 'broiler') {
    const hasFishMeal = currentSelected.some(s => s.ingredient.id === 'fish_meal');
    if (hasFishMeal) {
      warnings.push(`BROILER_FISH_MEAL_CAPPED: Fish meal is capped at 10% of target formulation to prevent flavor taint.`);
    }
  }

  // Rule R-FC-1: Aflatoxin binder (COMPULSORY at exactly 0.5% of target weight)
  const hasToxinBinder = currentSelected.some(s => s.ingredient.id === 'toxin_binder');
  const targetToxinBinderKg = Number((args.targetKg * 0.005).toFixed(2));

  if (!hasToxinBinder) {
    const toxinBinderIng = args.availableIngredients.find(i => i.id === 'toxin_binder');
    if (toxinBinderIng) {
      currentSelected.push({
        ingredient: toxinBinderIng,
        quantityKg: targetToxinBinderKg,
        unitPrice: 0, // default if not set
        autoAdded: true,
      });
    }
  } else {
    currentSelected = currentSelected.map(s => {
      if (s.ingredient.id === 'toxin_binder') {
        return {
          ...s,
          quantityKg: targetToxinBinderKg,
          autoAdded: true,
        };
      }
      return s;
    });
  }

  return {
    selected: currentSelected,
    blocked,
    blockedReason,
    warnings,
  };
}
