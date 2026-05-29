import createHighs from 'highs';
import { SelectedIngredient, Ingredient } from './feed-safety';

let highsInstance: any = null;
let highsPromise: Promise<any> | null = null;

export async function getHighs() {
  if (highsInstance) return highsInstance;
  if (!highsPromise) {
    highsPromise = createHighs({
      locateFile: (file) => `https://lovasoa.github.io/highs-js/${file}`,
    }).then(instance => {
      highsInstance = instance;
      return instance;
    });
  }
  return highsPromise;
}

export interface InfeasibilityAdvice {
  issue: string;
  suggestion: string;
}

export interface LPSolveResult {
  status: 'optimal' | 'fallback';
  quantities: { [key: string]: number };
  totalCostPesewas: number;
  fallbackReason?: 'LP_INFEASIBLE' | 'LP_TIMEOUT' | 'LP_WASM_ERROR';
  advice?: InfeasibilityAdvice[];
}

export async function solveFeedLP(args: {
  species: string;
  targetKg: number;
  selected: SelectedIngredient[];
  requirements: any;
  timeoutMs?: number;
}): Promise<LPSolveResult> {
  const timeoutMs = args.timeoutMs ?? 5000;

  const solvePromise = async (): Promise<LPSolveResult> => {
    const highs = await getHighs();
    const lpText = buildCplexLp({
      ingredients: args.selected,
      requirements: args.requirements,
      targetKg: args.targetKg,
      species: args.species,
    });

    const solution = highs.solve(lpText);
    const status = (solution.status || solution.Status || "").toLowerCase();
    const columns = solution.columns || solution.Columns || {};

    if (status !== 'optimal') {
      const result = getFallbackMix(args.selected, args.targetKg, 'LP_INFEASIBLE');
      result.advice = analyzeInfeasibility(args);
      return result;
    }

    const quantities: { [key: string]: number } = {};
    let totalCost = 0;

    args.selected.forEach(s => {
      const varName = `x_${s.ingredient.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const colData = columns[varName] || {};
      const qty = Number((colData.primal || colData.Primal || 0).toFixed(2));
      quantities[s.ingredient.id] = qty;
      totalCost += qty * s.unitPrice;
    });

    return {
      status: 'optimal',
      quantities,
      totalCostPesewas: Math.round(totalCost),
    };
  };

  const timeoutPromise = new Promise<LPSolveResult>((resolve) => {
    setTimeout(() => {
      resolve(getFallbackMix(args.selected, args.targetKg, 'LP_TIMEOUT'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([solvePromise(), timeoutPromise]);
  } catch (error) {
    console.error("HiGHS Solver Error:", error);
    return getFallbackMix(args.selected, args.targetKg, 'LP_WASM_ERROR');
  }
}

function analyzeInfeasibility(args: {
  species: string;
  targetKg: number;
  selected: SelectedIngredient[];
  requirements: any;
}): InfeasibilityAdvice[] {
  const advice: InfeasibilityAdvice[] = [];
  const { selected, requirements, species } = args;

  // 1. Protein Check
  const maxProtein = selected.reduce((sum, s) => {
    const maxUsage = s.ingredient.usageLimits.max / 100;
    return sum + (s.ingredient.proteinPct * maxUsage);
  }, 0);
  
  if (requirements.protein_min && maxProtein < requirements.protein_min) {
    advice.push({
      issue: `Insufficient protein sources (Max possible: ${maxProtein.toFixed(1)}%)`,
      suggestion: 'Add high-protein ingredients like Soybean Meal, Groundnut Cake, or BSF Larvae.'
    });
  }

  // 2. Energy Check
  const maxEnergy = selected.reduce((sum, s) => {
    const maxUsage = s.ingredient.usageLimits.max / 100;
    return sum + (s.ingredient.energyKcal * maxUsage);
  }, 0);

  if (requirements.energy_min && maxEnergy < requirements.energy_min) {
    advice.push({
      issue: `Insufficient energy sources (Max possible: ${maxEnergy.toFixed(0)} kcal/kg)`,
      suggestion: 'Add high-energy ingredients like Maize, Sorghum, or Vegetable Oil.'
    });
  }

  // 3. Duck Niacin Check
  if (species === 'duck') {
    const maxNiacin = selected.reduce((sum, s) => {
      const maxUsage = s.ingredient.usageLimits.max / 100;
      return sum + (s.ingredient.niacinMgKg * maxUsage);
    }, 0);

    if (maxNiacin < 55) {
      advice.push({
        issue: `Duck Niacin requirement impossible (Max possible: ${maxNiacin.toFixed(1)} mg/kg)`,
        suggestion: 'Add Waterfowl Vitamin Premix (which contains 150mg/kg Niacin) or a pure Niacin supplement.'
      });
    }
  }

  // 4. General fallback if no specific issue found
  if (advice.length === 0) {
    advice.push({
      issue: 'Complex constraint conflict',
      suggestion: 'Try increasing the usage limits for some ingredients or adding more variety to the mix.'
    });
  }

  return advice;
}

function getFallbackMix(
  selected: SelectedIngredient[],
  targetKg: number,
  reason: 'LP_INFEASIBLE' | 'LP_TIMEOUT' | 'LP_WASM_ERROR'
): LPSolveResult {
  const toxinBinderLine = selected.find(s => s.ingredient.id === 'toxin_binder');
  const toxinBinderKg = toxinBinderLine ? Number((targetKg * 0.005).toFixed(2)) : 0;
  
  const remainingIngredients = selected.filter(s => s.ingredient.id !== 'toxin_binder');
  const count = remainingIngredients.length;
  
  const quantities: { [key: string]: number } = {};
  let totalCost = 0;

  if (toxinBinderLine) {
    quantities['toxin_binder'] = toxinBinderKg;
    totalCost += toxinBinderKg * toxinBinderLine.unitPrice;
  }

  if (count > 0) {
    const totalRemainingKg = targetKg - toxinBinderKg;
    // Simple proportional split respecting max limits where possible
    let currentTotal = 0;
    remainingIngredients.forEach((s, idx) => {
      const maxAllowed = (s.ingredient.usageLimits.max / 100) * targetKg;
      let qty = totalRemainingKg / count;
      if (qty > maxAllowed) qty = maxAllowed;
      
      const roundedQty = Number(qty.toFixed(2));
      quantities[s.ingredient.id] = roundedQty;
      totalCost += roundedQty * s.unitPrice;
      currentTotal += roundedQty;
    });

    // Adjust last ingredient for mass balance if needed
    if (Math.abs(currentTotal + toxinBinderKg - targetKg) > 0.01) {
       const lastIng = remainingIngredients[remainingIngredients.length - 1];
       const diff = targetKg - (currentTotal + toxinBinderKg);
       quantities[lastIng.ingredient.id] = Number((quantities[lastIng.ingredient.id] + diff).toFixed(2));
    }
  }

  return {
    status: 'fallback',
    quantities,
    totalCostPesewas: Math.round(totalCost),
    fallbackReason: reason,
  };
}

export function buildCplexLp(args: {
  ingredients: SelectedIngredient[];
  requirements: any;
  targetKg: number;
  species: string;
}): string {
  const { ingredients, requirements, targetKg, species } = args;

  const vars = ingredients.map((ing) => ({
    name: `x_${ing.ingredient.id.replace(/[^a-zA-Z0-9]/g, '_')}`,
    ing,
  }));

  let lp = "Minimize\n obj: ";
  lp += vars.map(v => `${v.ing.unitPrice} ${v.name}`).join(" + ");
  lp += "\nSubject To\n";

  lp += " mass: " + vars.map(v => `1 ${v.name}`).join(" + ") + ` = ${targetKg}\n`;

  if (requirements.protein_min) {
    lp += " protein: " + vars.map(v => `${v.ing.ingredient.proteinPct} ${v.name}`).join(" + ") + ` >= ${requirements.protein_min * targetKg}\n`;
  }
  if (requirements.energy_min) {
    lp += " energy_min: " + vars.map(v => `${v.ing.ingredient.energyKcal} ${v.name}`).join(" + ") + ` >= ${requirements.energy_min * targetKg}\n`;
  }
  if (requirements.energy_max) {
    lp += " energy_max: " + vars.map(v => `${v.ing.ingredient.energyKcal} ${v.name}`).join(" + ") + ` <= ${requirements.energy_max * targetKg}\n`;
  }
  if (requirements.calcium_min) {
    lp += " calcium_min: " + vars.map(v => `${v.ing.ingredient.calciumPct} ${v.name}`).join(" + ") + ` >= ${requirements.calcium_min * targetKg}\n`;
  }
  if (requirements.calcium_max) {
    lp += " calcium_max: " + vars.map(v => `${v.ing.ingredient.calciumPct} ${v.name}`).join(" + ") + ` <= ${requirements.calcium_max * targetKg}\n`;
  }
  if (requirements.phosphorus_min) {
    lp += " phosphorus: " + vars.map(v => `${v.ing.ingredient.phosphorusPct} ${v.name}`).join(" + ") + ` >= ${requirements.phosphorus_min * targetKg}\n`;
  }
  if (requirements.lysine_min) {
    lp += " lysine: " + vars.map(v => `${v.ing.ingredient.lysinePct} ${v.name}`).join(" + ") + ` >= ${requirements.lysine_min * targetKg}\n`;
  }
  if (requirements.methionine_min) {
    lp += " methionine: " + vars.map(v => `${v.ing.ingredient.methioninePct} ${v.name}`).join(" + ") + ` >= ${requirements.methionine_min * targetKg}\n`;
  }

  // Duck Niacin Constraint
  if (species === 'duck') {
    lp += " niacin: " + vars.map(v => `${v.ing.ingredient.niacinMgKg} ${v.name}`).join(" + ") + ` >= ${55 * targetKg}\n`;
  }

  lp += "Bounds\n";
  vars.forEach(v => {
    let maxShare = Number(v.ing.ingredient.usageLimits.max) / 100;
    
    // Fish meal cap from specs
    if (species === 'layer' && v.ing.ingredient.id === 'fish_meal_65') maxShare = 0.08;
    if (species === 'broiler' && v.ing.ingredient.id === 'fish_meal_65') maxShare = 0.10;

    const ub = maxShare * targetKg;

    if (v.ing.ingredient.id === 'toxin_binder') {
      const fixedKg = Number((targetKg * 0.005).toFixed(2));
      lp += `  ${v.name} = ${fixedKg}\n`;
    } else {
      lp += `  0 <= ${v.name} <= ${ub}\n`;
    }
  });

  lp += "End\n";
  return lp;
}
