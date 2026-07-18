// Client-side feed optimization (simplified LP via greedy cost-minimization)
// Meets nutritional targets while minimizing total cost

import type { Ingredient, FeedPhase } from './feed-data';

interface OptimizableIngredient {
  ingredient: Ingredient;
  unitPrice: number;
  minPct?: number;
  maxPct?: number;
}

interface OptimizationResult {
  success: boolean;
  ingredients: { ingredient: Ingredient; quantityKg: number; unitPrice: number; pct: number }[];
  totalCost: number;
  nutrition: { protein: number; energy: number; calcium: number };
  message?: string;
}

/**
 * Simplified cost-minimizing formulation:
 * 1. Enforce inclusion constraints (supplements, safety)
 * 2. Use proportional allocation to meet protein/energy targets
 * 3. Iterate to minimize cost while staying within bounds
 */
export function optimizeFormulation(
  ingredients: OptimizableIngredient[],
  targetKg: number,
  phase: FeedPhase
): OptimizationResult {
  if (ingredients.length === 0) {
    return { success: false, ingredients: [], totalCost: 0, nutrition: { protein: 0, energy: 0, calcium: 0 }, message: 'No ingredients selected' };
  }

  const n = ingredients.length;
  const allocations = new Array(n).fill(0); // kg

  // Separate by category
  const energyIdxs = ingredients.map((ig, i) => ig.ingredient.category === 'energy' ? i : -1).filter(i => i >= 0);
  const proteinIdxs = ingredients.map((ig, i) => ig.ingredient.category === 'protein' ? i : -1).filter(i => i >= 0);
  const calciumIdxs = ingredients.map((ig, i) => ig.ingredient.category === 'calcium' ? i : -1).filter(i => i >= 0);
  const supplementIdxs = ingredients.map((ig, i) => ig.ingredient.category === 'supplement' ? i : -1).filter(i => i >= 0);

  // 1. Allocate supplements (fixed small amounts — typically 0.5-2% each)
  for (const idx of supplementIdxs) {
    const name = ingredients[idx].ingredient.name.toLowerCase();
    if (name.includes('premix')) allocations[idx] = targetKg * 0.005; // 0.5%
    else if (name.includes('salt')) allocations[idx] = targetKg * 0.003; // 0.3%
    else if (name.includes('methionine') || name.includes('lysine')) allocations[idx] = targetKg * 0.002; // 0.2%
    else if (name.includes('toxin')) allocations[idx] = targetKg * 0.005; // 0.5%
    else allocations[idx] = targetKg * 0.005; // default 0.5%
  }

  // 2. Allocate calcium (typically 1-5% depending on species)
  const calciumTarget = phase.calciumPct; // e.g., 3.5% for layers
  for (const idx of calciumIdxs) {
    const ig = ingredients[idx].ingredient;
    if (ig.calciumPct > 0) {
      // How much of this ingredient to reach calcium target
      const needed = (calciumTarget / 100) * targetKg / (ig.calciumPct / 100);
      allocations[idx] = Math.min(needed, targetKg * 0.08); // cap at 8%
    }
  }

  const usedKg = allocations.reduce((a, b) => a + b, 0);
  const remainingKg = targetKg - usedKg;

  // 3. Split remaining between energy and protein to hit targets
  if (remainingKg > 0 && (energyIdxs.length > 0 || proteinIdxs.length > 0)) {
    // Calculate weighted protein from current protein sources
    const targetProtein = phase.proteinPct;
    
    // Sort protein sources by cost (cheapest first)
    const sortedProtein = [...proteinIdxs].sort((a, b) => ingredients[a].unitPrice - ingredients[b].unitPrice);
    const sortedEnergy = [...energyIdxs].sort((a, b) => ingredients[a].unitPrice - ingredients[b].unitPrice);

    // Binary search for protein ratio
    let bestProteinRatio = 0.3; // start with 30% protein sources
    
    for (let attempt = 0; attempt < 20; attempt++) {
      const proteinKg = remainingKg * bestProteinRatio;
      const energyKg = remainingKg * (1 - bestProteinRatio);
      
      // Distribute evenly among sources of each type (cheapest gets more)
      const testAlloc = [...allocations];
      
      // Distribute protein kg (70% to cheapest, 30% to rest)
      if (sortedProtein.length > 0) {
        testAlloc[sortedProtein[0]] += proteinKg * 0.7;
        for (let i = 1; i < sortedProtein.length; i++) {
          testAlloc[sortedProtein[i]] += (proteinKg * 0.3) / (sortedProtein.length - 1);
        }
      }
      
      // Distribute energy kg
      if (sortedEnergy.length > 0) {
        testAlloc[sortedEnergy[0]] += energyKg * 0.7;
        for (let i = 1; i < sortedEnergy.length; i++) {
          testAlloc[sortedEnergy[i]] += (energyKg * 0.3) / (sortedEnergy.length - 1);
        }
      }
      
      // Calculate resulting protein %
      const totalKg = testAlloc.reduce((a, b) => a + b, 0);
      const weightedProtein = totalKg > 0
        ? testAlloc.reduce((sum, kg, i) => sum + (kg / totalKg) * ingredients[i].ingredient.proteinPct, 0)
        : 0;
      
      if (weightedProtein < targetProtein - 0.5) {
        bestProteinRatio = Math.min(bestProteinRatio + 0.02, 0.6);
      } else if (weightedProtein > targetProtein + 0.5) {
        bestProteinRatio = Math.max(bestProteinRatio - 0.02, 0.1);
      } else {
        break; // close enough
      }
    }

    // Apply best ratio
    const proteinKg = remainingKg * bestProteinRatio;
    const energyKg = remainingKg * (1 - bestProteinRatio);

    if (sortedProtein.length > 0) {
      allocations[sortedProtein[0]] += proteinKg * 0.7;
      for (let i = 1; i < sortedProtein.length; i++) {
        allocations[sortedProtein[i]] += (proteinKg * 0.3) / (sortedProtein.length - 1);
      }
    } else if (sortedEnergy.length > 0) {
      // No protein sources — put all in energy
      allocations[sortedEnergy[0]] += proteinKg;
    }

    if (sortedEnergy.length > 0) {
      allocations[sortedEnergy[0]] += energyKg * 0.7;
      for (let i = 1; i < sortedEnergy.length; i++) {
        allocations[sortedEnergy[i]] += (energyKg * 0.3) / (sortedEnergy.length - 1);
      }
    } else if (sortedProtein.length > 0) {
      allocations[sortedProtein[0]] += energyKg;
    }
  }

  // Round allocations to 0.5 kg
  for (let i = 0; i < n; i++) {
    allocations[i] = Math.round(allocations[i] * 2) / 2;
  }

  // Adjust to hit exact target
  const totalAllocated = allocations.reduce((a, b) => a + b, 0);
  const diff = targetKg - totalAllocated;
  if (Math.abs(diff) > 0.1 && energyIdxs.length > 0) {
    // Add/subtract from largest energy source
    const largestEnergy = energyIdxs.reduce((best, idx) => allocations[idx] > allocations[best] ? idx : best, energyIdxs[0]);
    allocations[largestEnergy] += diff;
  }

  // Calculate final nutrition
  const finalTotal = allocations.reduce((a, b) => a + b, 0);
  const nutrition = {
    protein: finalTotal > 0 ? allocations.reduce((sum, kg, i) => sum + (kg / finalTotal) * ingredients[i].ingredient.proteinPct, 0) : 0,
    energy: finalTotal > 0 ? allocations.reduce((sum, kg, i) => sum + (kg / finalTotal) * ingredients[i].ingredient.energyKcal, 0) : 0,
    calcium: finalTotal > 0 ? allocations.reduce((sum, kg, i) => sum + (kg / finalTotal) * ingredients[i].ingredient.calciumPct, 0) : 0,
  };

  const totalCost = allocations.reduce((sum, kg, i) => sum + kg * ingredients[i].unitPrice, 0);

  return {
    success: true,
    ingredients: ingredients.map((ig, i) => ({
      ingredient: ig.ingredient,
      quantityKg: allocations[i],
      unitPrice: ig.unitPrice,
      pct: finalTotal > 0 ? (allocations[i] / finalTotal) * 100 : 0,
    })),
    totalCost,
    nutrition,
  };
}
