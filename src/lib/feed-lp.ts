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

export interface LPSolveResult {
  status: 'optimal' | 'fallback';
  quantities: { [key: string]: number };
  totalCostPesewas: number;
  fallbackReason?: 'LP_INFEASIBLE' | 'LP_TIMEOUT' | 'LP_WASM_ERROR';
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
      return getFallbackMix(args.selected, args.targetKg, 'LP_INFEASIBLE');
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
    const qtyPerIng = Number(((targetKg - toxinBinderKg) / count).toFixed(2));
    remainingIngredients.forEach(s => {
      quantities[s.ingredient.id] = qtyPerIng;
      totalCost += qtyPerIng * s.unitPrice;
    });
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
    lp += " protein: " + vars.map(v => `${v.ing.ingredient.protein_pct} ${v.name}`).join(" + ") + ` >= ${requirements.protein_min * targetKg}\n`;
  }
  if (requirements.energy_min) {
    lp += " energy_min: " + vars.map(v => `${v.ing.ingredient.energy_kcal_per_kg} ${v.name}`).join(" + ") + ` >= ${requirements.energy_min * targetKg}\n`;
  }
  if (requirements.energy_max) {
    lp += " energy_max: " + vars.map(v => `${v.ing.ingredient.energy_kcal_per_kg} ${v.name}`).join(" + ") + ` <= ${requirements.energy_max * targetKg}\n`;
  }
  if (requirements.calcium_min) {
    lp += " calcium_min: " + vars.map(v => `${v.ing.ingredient.calcium_pct} ${v.name}`).join(" + ") + ` >= ${requirements.calcium_min * targetKg}\n`;
  }
  if (requirements.calcium_max) {
    lp += " calcium_max: " + vars.map(v => `${v.ing.ingredient.calcium_pct} ${v.name}`).join(" + ") + ` <= ${requirements.calcium_max * targetKg}\n`;
  }
  if (requirements.phosphorus_min) {
    lp += " phosphorus: " + vars.map(v => `${v.ing.ingredient.phosphorus_pct} ${v.name}`).join(" + ") + ` >= ${requirements.phosphorus_min * targetKg}\n`;
  }
  if (requirements.lysine_min) {
    lp += " lysine: " + vars.map(v => `${v.ing.ingredient.lysine_pct} ${v.name}`).join(" + ") + ` >= ${requirements.lysine_min * targetKg}\n`;
  }
  if (requirements.methionine_min) {
    lp += " methionine: " + vars.map(v => `${v.ing.ingredient.methionine_pct} ${v.name}`).join(" + ") + ` >= ${requirements.methionine_min * targetKg}\n`;
  }

  lp += "Bounds\n";
  vars.forEach(v => {
    let maxShare = Number(v.ing.ingredient.max_share_pct) / 100;
    
    if (species === 'broiler' && v.ing.ingredient.id === 'fish_meal') {
      maxShare = 0.10;
    }

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
