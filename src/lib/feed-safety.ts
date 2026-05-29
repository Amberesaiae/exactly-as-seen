import { Ingredient } from './feed-data';

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
  suggestions: { id: string; name: string; reason: string }[];
}

/**
 * Production-Grade Feed Safety Preprocessor.
 * Realigned to 'Lean Engineering' foundation: Guidance over Enforcement, 
 * except for Fatal or Mandatory Biosecurity rules.
 */
export function preprocessFormulation(args: {
  species: string;
  targetKg: number;
  selected: SelectedIngredient[];
  availableIngredients: Ingredient[];
}): PreprocessResult {
  const warnings: string[] = [];
  const suggestions: PreprocessResult['suggestions'] = [];
  let blocked = false;
  let blockedReason: string | undefined = undefined;

  const currentSelected = [...args.selected];

  // 1. Aflatoxin Protocol (MANDATORY in West Africa)
  // maize, groundnut, and cotton seed have HIGH risk.
  const highRiskSelected = currentSelected.some(s => 
    ['maize', 'groundnut', 'cotton_seed'].some(risk => s.ingredient.id.toLowerCase().includes(risk))
  );
  const hasToxinBinder = currentSelected.some(s => s.ingredient.id === 'toxin_binder');
  
  if (highRiskSelected && !hasToxinBinder) {
    // ELITE SPEC: Blocking is mandatory if toxin binder is missing with high-risk ingredients
    blocked = true;
    blockedReason = 'MANDATORY SAFETY: Toxin Binder must be included when using Maize or Groundnut (West African Aflatoxin Protocol).';
    
    suggestions.push({
      id: 'toxin_binder',
      name: 'Toxin Binder',
      reason: 'Aflatoxin Protection: 0.1% inclusion mandatory for maize-based mixes.'
    });
  }

  // 2. Duck Niacin: CRITICAL Blocking (NRC 1994)
  if (args.species === 'duck') {
    const hasNiacinSource = currentSelected.some(s => 
      s.ingredient.id === 'niacin_pure' || s.ingredient.id === 'premix_duck'
    );
    if (!hasNiacinSource) {
      blocked = true;
      blockedReason = 'CRITICAL NUTRITION: Ducks require high Niacin (55mg/kg) to prevent leg weakness. Add Waterfowl Premix or Niacin.';
    }
  }

  // 3. Raw Cassava: Fatal Block
  const hasRawCassava = currentSelected.some(s => s.ingredient.id.includes('raw_cassava'));
  if (hasRawCassava) {
    blocked = true;
    blockedReason = 'FATAL SAFETY: Raw cassava contains high HCN (Cyanide). Use only HQCP processed cassava.';
  }

  // 4. Gossypol: Quality Block for Layers
  if (args.species === 'layer' && currentSelected.some(s => s.ingredient.id.includes('cotton_seed'))) {
    blocked = true;
    blockedReason = 'QUALITY BLOCK: Cotton Seed Meal causes egg yolk discoloration in layers.';
  }

  // 5. Fish Meal Taint: Guidance
  const fishMealQty = currentSelected.filter(s => s.ingredient.id.includes('fish_meal'))
    .reduce((sum, s) => sum + s.quantityKg, 0);
  const fishMealPct = (fishMealQty / args.targetKg) * 100;
  
  if (args.species === 'layer' && fishMealPct > 8) {
    warnings.push('CAUTION: Fish meal > 8% causes fishy taint in eggs.');
  }

  // 6. Calcium Imbalance: Guidance
  const calciumCount = currentSelected.filter(s => s.ingredient.category === 'calcium').length;
  if (calciumCount > 1) {
    warnings.push('LEAN TIP: Multiple calcium sources selected. Consider using only one to avoid mineral locking.');
  }

  return {
    selected: currentSelected,
    blocked,
    blockedReason,
    warnings,
    suggestions,
  };
}
