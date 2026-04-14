// Species-specific feed reference data per West African poultry standards

export interface FeedPhase {
  name: string;
  weekStart: number;
  weekEnd: number;
  proteinPct: number;
  energyKcal: number;
  calciumPct: number;
  feedPerBirdG: number; // grams per bird per day (avg for phase)
}

export const FEED_PHASES: Record<string, FeedPhase[]> = {
  broiler: [
    { name: 'Starter', weekStart: 0, weekEnd: 2, proteinPct: 23, energyKcal: 3000, calciumPct: 1.0, feedPerBirdG: 25 },
    { name: 'Grower', weekStart: 3, weekEnd: 5, proteinPct: 20, energyKcal: 3100, calciumPct: 0.9, feedPerBirdG: 80 },
    { name: 'Finisher', weekStart: 6, weekEnd: 8, proteinPct: 18, energyKcal: 3200, calciumPct: 0.85, feedPerBirdG: 130 },
  ],
  layer: [
    { name: 'Chick', weekStart: 0, weekEnd: 8, proteinPct: 20, energyKcal: 2900, calciumPct: 1.0, feedPerBirdG: 30 },
    { name: 'Grower', weekStart: 9, weekEnd: 18, proteinPct: 16, energyKcal: 2800, calciumPct: 1.0, feedPerBirdG: 70 },
    { name: 'Layer', weekStart: 19, weekEnd: 999, proteinPct: 17, energyKcal: 2750, calciumPct: 3.5, feedPerBirdG: 110 },
  ],
  duck: [
    { name: 'Starter', weekStart: 0, weekEnd: 3, proteinPct: 22, energyKcal: 2900, calciumPct: 1.0, feedPerBirdG: 40 },
    { name: 'Grower', weekStart: 4, weekEnd: 7, proteinPct: 18, energyKcal: 2800, calciumPct: 0.8, feedPerBirdG: 100 },
    { name: 'Finisher/Layer', weekStart: 8, weekEnd: 999, proteinPct: 16, energyKcal: 2700, calciumPct: 3.0, feedPerBirdG: 150 },
  ],
  turkey: [
    { name: 'Starter', weekStart: 0, weekEnd: 4, proteinPct: 28, energyKcal: 2800, calciumPct: 1.2, feedPerBirdG: 30 },
    { name: 'Grower', weekStart: 5, weekEnd: 12, proteinPct: 22, energyKcal: 2900, calciumPct: 1.0, feedPerBirdG: 120 },
    { name: 'Finisher', weekStart: 13, weekEnd: 20, proteinPct: 18, energyKcal: 3000, calciumPct: 0.85, feedPerBirdG: 250 },
  ],
};

export interface Ingredient {
  name: string;
  category: 'energy' | 'protein' | 'calcium' | 'supplement';
  proteinPct: number;
  energyKcal: number;
  calciumPct: number;
  defaultPricePerKg: number; // GHS
}

export const INGREDIENTS: Ingredient[] = [
  // Energy sources
  { name: 'Maize (Yellow Corn)', category: 'energy', proteinPct: 9, energyKcal: 3350, calciumPct: 0.02, defaultPricePerKg: 3.5 },
  { name: 'Wheat Bran', category: 'energy', proteinPct: 15, energyKcal: 1800, calciumPct: 0.12, defaultPricePerKg: 2.0 },
  { name: 'Rice Bran', category: 'energy', proteinPct: 12, energyKcal: 2200, calciumPct: 0.08, defaultPricePerKg: 1.8 },
  { name: 'Palm Kernel Cake (PKC)', category: 'energy', proteinPct: 18, energyKcal: 2200, calciumPct: 0.3, defaultPricePerKg: 2.5 },
  { name: 'Sorghum (Low-Tannin)', category: 'energy', proteinPct: 10, energyKcal: 3200, calciumPct: 0.03, defaultPricePerKg: 3.2 },
  { name: 'Cassava Peel (HQCP)', category: 'energy', proteinPct: 4, energyKcal: 2800, calciumPct: 0.1, defaultPricePerKg: 0.9 },
  // Protein sources
  { name: 'Soybean Meal', category: 'protein', proteinPct: 44, energyKcal: 2230, calciumPct: 0.3, defaultPricePerKg: 6.0 },
  { name: 'Fish Meal', category: 'protein', proteinPct: 60, energyKcal: 2800, calciumPct: 5.0, defaultPricePerKg: 8.0 },
  { name: 'Groundnut Cake', category: 'protein', proteinPct: 45, energyKcal: 2500, calciumPct: 0.2, defaultPricePerKg: 5.5 },
  { name: 'Cotton Seed Meal', category: 'protein', proteinPct: 41, energyKcal: 2100, calciumPct: 0.2, defaultPricePerKg: 4.0 },
  // Calcium sources
  { name: 'Oyster Shell', category: 'calcium', proteinPct: 0, energyKcal: 0, calciumPct: 38, defaultPricePerKg: 1.0 },
  { name: 'Limestone', category: 'calcium', proteinPct: 0, energyKcal: 0, calciumPct: 36, defaultPricePerKg: 0.8 },
  { name: 'Bone Meal', category: 'calcium', proteinPct: 12, energyKcal: 0, calciumPct: 24, defaultPricePerKg: 3.0 },
  // Supplements
  { name: 'Premix (Vitamin/Mineral)', category: 'supplement', proteinPct: 0, energyKcal: 0, calciumPct: 0, defaultPricePerKg: 15.0 },
  { name: 'Salt (NaCl)', category: 'supplement', proteinPct: 0, energyKcal: 0, calciumPct: 0, defaultPricePerKg: 1.5 },
  { name: 'Methionine', category: 'supplement', proteinPct: 58, energyKcal: 0, calciumPct: 0, defaultPricePerKg: 25.0 },
  { name: 'Lysine', category: 'supplement', proteinPct: 78, energyKcal: 0, calciumPct: 0, defaultPricePerKg: 20.0 },
  { name: 'Toxin Binder', category: 'supplement', proteinPct: 0, energyKcal: 0, calciumPct: 0, defaultPricePerKg: 12.0 },
  { name: 'Niacin (Vitamin B3)', category: 'supplement', proteinPct: 0, energyKcal: 0, calciumPct: 0, defaultPricePerKg: 30.0 },
];

// Commercial feed types per species
export interface CommercialFeedType {
  label: string;
  proteinRange: string;
  species: string[];
  phase: string;
}

export const COMMERCIAL_FEED_TYPES: CommercialFeedType[] = [
  { label: 'Broiler Starter (22–24% protein)', proteinRange: '22-24', species: ['broiler'], phase: 'starter' },
  { label: 'Broiler Grower (20–22% protein)', proteinRange: '20-22', species: ['broiler'], phase: 'grower' },
  { label: 'Broiler Finisher (18–20% protein)', proteinRange: '18-20', species: ['broiler'], phase: 'finisher' },
  { label: 'Layer Chick Starter (20% protein)', proteinRange: '20', species: ['layer'], phase: 'chick' },
  { label: 'Layer Grower (16% protein)', proteinRange: '16', species: ['layer'], phase: 'grower' },
  { label: 'Layer Mash (17% protein)', proteinRange: '17', species: ['layer'], phase: 'layer' },
  { label: 'Duck Starter (22% protein)', proteinRange: '22', species: ['duck'], phase: 'starter' },
  { label: 'Duck Grower (18% protein)', proteinRange: '18', species: ['duck'], phase: 'grower' },
  { label: 'Turkey Starter (28% protein)', proteinRange: '28', species: ['turkey'], phase: 'starter' },
  { label: 'Turkey Grower (22% protein)', proteinRange: '22', species: ['turkey'], phase: 'grower' },
  { label: 'Turkey Finisher (18% protein)', proteinRange: '18', species: ['turkey'], phase: 'finisher' },
];

// Concentrate products
export interface ConcentrateProduct {
  name: string;
  proteinPct: number;
  species: string[];
  ratioRange: [number, number]; // min:max concentrate percentage
  defaultRatio: number;
  pricePerKg: number;
}

export const CONCENTRATE_PRODUCTS: ConcentrateProduct[] = [
  { name: 'Broiler Concentrate 40%', proteinPct: 40, species: ['broiler'], ratioRange: [30, 50], defaultRatio: 40, pricePerKg: 8.0 },
  { name: 'Layer Concentrate 35%', proteinPct: 35, species: ['layer'], ratioRange: [30, 45], defaultRatio: 35, pricePerKg: 7.5 },
  { name: 'Super Concentrate 45%', proteinPct: 45, species: ['broiler', 'layer', 'turkey'], ratioRange: [30, 50], defaultRatio: 40, pricePerKg: 10.0 },
  { name: 'Duck/Turkey Concentrate 38%', proteinPct: 38, species: ['duck', 'turkey'], ratioRange: [30, 50], defaultRatio: 40, pricePerKg: 8.5 },
];

export interface SafetyRule {
  id: string;
  description: string;
  check: (species: string, ingredientNames: string[]) => { warning: boolean; message: string } | null;
}

export const SAFETY_RULES: SafetyRule[] = [
  {
    id: 'toxin_binder',
    description: 'Auto-add toxin binder with maize/groundnut',
    check: (_, names) => {
      const hasMaize = names.some(n => n.toLowerCase().includes('maize'));
      const hasGroundnut = names.some(n => n.toLowerCase().includes('groundnut'));
      const hasToxinBinder = names.some(n => n.toLowerCase().includes('toxin'));
      if ((hasMaize || hasGroundnut) && !hasToxinBinder) {
        return { warning: true, message: 'Add Toxin Binder when using maize or groundnut cake — aflatoxin protection' };
      }
      return null;
    },
  },
  {
    id: 'niacin_duck',
    description: 'Ducks require extra niacin',
    check: (species, names) => {
      const hasNiacin = names.some(n => n.toLowerCase().includes('niacin'));
      if (species === 'duck' && !hasNiacin) {
        return { warning: true, message: '⚠️ CRITICAL: Ducks require extra Niacin (Vitamin B3) — 1.5 tsp/gallon for leg health' };
      }
      return null;
    },
  },
  {
    id: 'cotton_seed_layer',
    description: 'Block cotton seed for layers',
    check: (species, names) => {
      const hasCotton = names.some(n => n.toLowerCase().includes('cotton'));
      if (species === 'layer' && hasCotton) {
        return { warning: true, message: 'Cotton Seed Meal is BLOCKED for layers — gossypol causes yolk discoloration' };
      }
      return null;
    },
  },
  {
    id: 'fish_meal_limit',
    description: 'Fish meal ≤10% for broilers',
    check: (species, names) => {
      const hasFish = names.some(n => n.toLowerCase().includes('fish'));
      if (species === 'broiler' && hasFish) {
        return { warning: false, message: 'Keep Fish Meal ≤ 10% of total mix for broilers' };
      }
      return null;
    },
  },
  {
    id: 'single_calcium',
    description: 'Use only one calcium source',
    check: (_, names) => {
      const calciumSources = names.filter(n =>
        ['oyster', 'limestone', 'bone meal'].some(c => n.toLowerCase().includes(c))
      );
      if (calciumSources.length > 1) {
        return { warning: true, message: 'Use only one calcium source — mixing causes mineral imbalances' };
      }
      return null;
    },
  },
  {
    id: 'pkc_enzyme',
    description: 'PKC >10% needs enzyme',
    check: (_, names) => {
      const hasPKC = names.some(n => n.toLowerCase().includes('pkc') || n.toLowerCase().includes('palm kernel'));
      if (hasPKC) {
        return { warning: false, message: 'If PKC exceeds 10% of mix, add enzyme supplement for digestibility' };
      }
      return null;
    },
  },
];

export function getCurrentPhase(species: string, weekNumber: number): FeedPhase | undefined {
  const phases = FEED_PHASES[species];
  if (!phases) return undefined;
  return phases.find(p => weekNumber >= p.weekStart && weekNumber <= p.weekEnd);
}

/**
 * Get compulsory auto-add ingredients for a species + selected ingredients
 */
export function getCompulsorySupplements(species: string, selectedNames: string[]): Ingredient[] {
  const result: Ingredient[] = [];
  const hasMaize = selectedNames.some(n => n.toLowerCase().includes('maize'));
  const hasGroundnut = selectedNames.some(n => n.toLowerCase().includes('groundnut'));
  const hasToxin = selectedNames.some(n => n.toLowerCase().includes('toxin'));

  if ((hasMaize || hasGroundnut) && !hasToxin) {
    const toxin = INGREDIENTS.find(i => i.name.toLowerCase().includes('toxin'));
    if (toxin) result.push(toxin);
  }

  if (species === 'duck') {
    const hasNiacin = selectedNames.some(n => n.toLowerCase().includes('niacin'));
    if (!hasNiacin) {
      const niacin = INGREDIENTS.find(i => i.name.toLowerCase().includes('niacin'));
      if (niacin) result.push(niacin);
    }
  }

  return result;
}
