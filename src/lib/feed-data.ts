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
    { name: 'Starter', weekStart: 0, weekEnd: 3, proteinPct: 23, energyKcal: 3200, calciumPct: 1.0, feedPerBirdG: 25 },
    { name: 'Grower', weekStart: 4, weekEnd: 5, proteinPct: 20, energyKcal: 3200, calciumPct: 0.9, feedPerBirdG: 80 },
    { name: 'Finisher', weekStart: 6, weekEnd: 8, proteinPct: 19, energyKcal: 3200, calciumPct: 0.85, feedPerBirdG: 130 },
  ],
  layer: [
    { name: 'Chick', weekStart: 0, weekEnd: 8, proteinPct: 19, energyKcal: 2800, calciumPct: 1.0, feedPerBirdG: 30 },
    { name: 'Grower', weekStart: 9, weekEnd: 18, proteinPct: 17, energyKcal: 2750, calciumPct: 1.0, feedPerBirdG: 70 },
    { name: 'Layer', weekStart: 19, weekEnd: 999, proteinPct: 16.5, energyKcal: 2800, calciumPct: 3.5, feedPerBirdG: 110 },
  ],
  duck: [
    { name: 'Starter', weekStart: 0, weekEnd: 3, proteinPct: 22, energyKcal: 2900, calciumPct: 0.8, feedPerBirdG: 40 },
    { name: 'Grower', weekStart: 4, weekEnd: 7, proteinPct: 19, energyKcal: 2850, calciumPct: 0.7, feedPerBirdG: 100 },
    { name: 'Finisher/Layer', weekStart: 8, weekEnd: 999, proteinPct: 17, energyKcal: 2800, calciumPct: 0.6, feedPerBirdG: 150 },
  ],
  turkey: [
    { name: 'Starter', weekStart: 0, weekEnd: 4, proteinPct: 27, energyKcal: 2950, calciumPct: 1.2, feedPerBirdG: 30 },
    { name: 'Grower', weekStart: 5, weekEnd: 12, proteinPct: 23, energyKcal: 3000, calciumPct: 1.0, feedPerBirdG: 120 },
    { name: 'Finisher', weekStart: 13, weekEnd: 20, proteinPct: 19, energyKcal: 2950, calciumPct: 0.9, feedPerBirdG: 250 },
  ],
};

export interface Ingredient {
  id: string;
  name: string;
  category: 'energy' | 'protein' | 'calcium' | 'supplement' | string;
  proteinPct: number;
  energyKcal: number;
  calciumPct: number;
  fiberPct: number;
  lysinePct: number;
  methioninePct: number;
  phosphorusPct: number;
  niacinMgKg: number;
  usageLimits: {
    min: number;
    max: number;
  };
  defaultPricePerKg: number; // GHS
  /** Optional safety flags used by preprocessFormulation / LP path */
  containsGossypol?: boolean;
  containsAflatoxinRisk?: boolean;
  maxSharePct?: number;
}

/** Normalize DB or partial ingredient rows into Ingredient. */
export function normalizeIngredient(raw: Record<string, unknown> | Ingredient): Ingredient {
  const r = raw as Record<string, unknown>;
  const maxShare = Number(r.maxSharePct ?? r.max_share_pct ?? (r.usageLimits as { max?: number } | undefined)?.max ?? 100);
  const minShare = Number((r.usageLimits as { min?: number } | undefined)?.min ?? 0);
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    category: String(r.category ?? 'supplement'),
    proteinPct: Number(r.proteinPct ?? r.protein_pct ?? 0),
    energyKcal: Number(r.energyKcal ?? r.energy_kcal_per_kg ?? 0),
    calciumPct: Number(r.calciumPct ?? r.calcium_pct ?? 0),
    fiberPct: Number(r.fiberPct ?? r.fiber_pct ?? 0),
    lysinePct: Number(r.lysinePct ?? r.lysine_pct ?? 0),
    methioninePct: Number(r.methioninePct ?? r.methionine_pct ?? 0),
    phosphorusPct: Number(r.phosphorusPct ?? r.phosphorus_pct ?? 0),
    niacinMgKg: Number(r.niacinMgKg ?? r.niacin_mg_kg ?? 0),
    usageLimits: { min: minShare, max: maxShare },
    defaultPricePerKg: Number(r.defaultPricePerKg ?? r.price_per_kg ?? r.unitPrice ?? 0),
    containsGossypol: Boolean(r.containsGossypol ?? r.contains_gossypol ?? false),
    containsAflatoxinRisk: Boolean(r.containsAflatoxinRisk ?? r.contains_aflatoxin_risk ?? false),
    maxSharePct: maxShare,
  };
}

export const INGREDIENTS: Ingredient[] = [
  // Energy Sources (9)
  { id: 'maize', name: 'Maize (Corn)', category: 'energy', proteinPct: 8.5, energyKcal: 3350, fiberPct: 2.2, lysinePct: 0.24, methioninePct: 0.18, calciumPct: 0.02, phosphorusPct: 0.28, niacinMgKg: 20, usageLimits: { min: 0, max: 70 }, defaultPricePerKg: 3.5 },
  { id: 'sorghum', name: 'Sorghum (Low-Tannin)', category: 'energy', proteinPct: 10.0, energyKcal: 3250, fiberPct: 2.7, lysinePct: 0.22, methioninePct: 0.16, calciumPct: 0.04, phosphorusPct: 0.30, niacinMgKg: 45, usageLimits: { min: 0, max: 60 }, defaultPricePerKg: 3.2 },
  { id: 'pearl_millet', name: 'Pearl Millet', category: 'energy', proteinPct: 11.0, energyKcal: 3150, fiberPct: 3.0, lysinePct: 0.30, methioninePct: 0.22, calciumPct: 0.05, phosphorusPct: 0.30, niacinMgKg: 0, usageLimits: { min: 0, max: 50 }, defaultPricePerKg: 3.0 },
  { id: 'cassava_peel', name: 'Cassava Peel (HQCP)', category: 'energy', proteinPct: 2.5, energyKcal: 2800, fiberPct: 10.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.10, phosphorusPct: 0.08, niacinMgKg: 0, usageLimits: { min: 0, max: 20 }, defaultPricePerKg: 0.9 },
  { id: 'wheat_bran', name: 'Wheat Bran', category: 'energy', proteinPct: 15.5, energyKcal: 2100, fiberPct: 11.0, lysinePct: 0.60, methioninePct: 0.25, calciumPct: 0.12, phosphorusPct: 1.20, niacinMgKg: 0, usageLimits: { min: 0, max: 10 }, defaultPricePerKg: 2.0 },
  { id: 'rice_bran', name: 'Rice Bran', category: 'energy', proteinPct: 13.5, energyKcal: 2040, fiberPct: 12.0, lysinePct: 0.60, methioninePct: 0.28, calciumPct: 0.08, phosphorusPct: 1.40, niacinMgKg: 0, usageLimits: { min: 0, max: 15 }, defaultPricePerKg: 1.8 },
  { id: 'palm_oil', name: 'Palm Oil', category: 'energy', proteinPct: 0.0, energyKcal: 8800, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0, max: 5 }, defaultPricePerKg: 12.0 },
  { id: 'vegetable_oil', name: 'Vegetable Oil', category: 'energy', proteinPct: 0.0, energyKcal: 8500, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0, max: 5 }, defaultPricePerKg: 15.0 },
  { id: 'molasses', name: 'Molasses', category: 'energy', proteinPct: 4.0, energyKcal: 2400, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.80, phosphorusPct: 0.08, niacinMgKg: 0, usageLimits: { min: 0, max: 5 }, defaultPricePerKg: 5.0 },

  // Protein Sources (15)
  { id: 'soybean_meal_44', name: 'Soybean Meal (44% CP)', category: 'protein', proteinPct: 44.0, energyKcal: 2230, fiberPct: 6.5, lysinePct: 2.8, methioninePct: 0.60, calciumPct: 0.30, phosphorusPct: 0.65, niacinMgKg: 0, usageLimits: { min: 0, max: 30 }, defaultPricePerKg: 6.0 },
  { id: 'soybean_meal_48', name: 'Soybean Meal (48% CP)', category: 'protein', proteinPct: 48.0, energyKcal: 2400, fiberPct: 3.5, lysinePct: 2.9, methioninePct: 0.65, calciumPct: 0.30, phosphorusPct: 0.65, niacinMgKg: 0, usageLimits: { min: 0, max: 30 }, defaultPricePerKg: 6.5 },
  { id: 'groundnut_cake', name: 'Groundnut Cake', category: 'protein', proteinPct: 45.0, energyKcal: 2150, fiberPct: 5.0, lysinePct: 1.5, methioninePct: 0.50, calciumPct: 0.15, phosphorusPct: 0.55, niacinMgKg: 160, usageLimits: { min: 0, max: 25 }, defaultPricePerKg: 5.5 },
  { id: 'fish_meal_65', name: 'Fish Meal (65% CP)', category: 'protein', proteinPct: 65.0, energyKcal: 2800, fiberPct: 1.0, lysinePct: 5.0, methioninePct: 1.8, calciumPct: 5.0, phosphorusPct: 3.0, niacinMgKg: 0, usageLimits: { min: 0, max: 10 }, defaultPricePerKg: 8.0 },
  { id: 'fish_meal_72', name: 'Fish Meal (72% CP)', category: 'protein', proteinPct: 72.0, energyKcal: 3000, fiberPct: 0.5, lysinePct: 5.8, methioninePct: 2.1, calciumPct: 4.5, phosphorusPct: 2.8, niacinMgKg: 0, usageLimits: { min: 0, max: 10 }, defaultPricePerKg: 10.0 },
  { id: 'palm_kernel_cake', name: 'Palm Kernel Cake (PKC)', category: 'protein', proteinPct: 18.0, energyKcal: 2400, fiberPct: 16.0, lysinePct: 0.65, methioninePct: 0.35, calciumPct: 0.25, phosphorusPct: 0.60, niacinMgKg: 0, usageLimits: { min: 0, max: 20 }, defaultPricePerKg: 2.5 },
  { id: 'cotton_seed_cake', name: 'Cotton Seed Cake', category: 'protein', proteinPct: 41.0, energyKcal: 2100, fiberPct: 12.0, lysinePct: 1.6, methioninePct: 0.55, calciumPct: 0.20, phosphorusPct: 1.00, niacinMgKg: 0, usageLimits: { min: 0, max: 10 }, defaultPricePerKg: 4.0 },
  { id: 'blood_meal', name: 'Blood Meal', category: 'protein', proteinPct: 80.0, energyKcal: 2600, fiberPct: 1.0, lysinePct: 7.5, methioninePct: 1.0, calciumPct: 0.30, phosphorusPct: 0.25, niacinMgKg: 0, usageLimits: { min: 0, max: 5 }, defaultPricePerKg: 12.0 },
  { id: 'meat_bone_meal', name: 'Meat and Bone Meal', category: 'protein', proteinPct: 50.0, energyKcal: 2400, fiberPct: 2.0, lysinePct: 2.5, methioninePct: 0.70, calciumPct: 10.0, phosphorusPct: 5.0, niacinMgKg: 0, usageLimits: { min: 0, max: 10 }, defaultPricePerKg: 7.5 },
  { id: 'feather_meal', name: 'Feather Meal', category: 'protein', proteinPct: 85.0, energyKcal: 2300, fiberPct: 1.0, lysinePct: 2.0, methioninePct: 0.60, calciumPct: 0.40, phosphorusPct: 0.70, niacinMgKg: 0, usageLimits: { min: 0, max: 3 }, defaultPricePerKg: 9.0 },
  { id: 'bsf_larvae', name: 'Black Soldier Fly Larvae (BSF)', category: 'protein', proteinPct: 42.0, energyKcal: 2400, fiberPct: 7.0, lysinePct: 2.4, methioninePct: 0.85, calciumPct: 3.0, phosphorusPct: 0.90, niacinMgKg: 0, usageLimits: { min: 0, max: 15 }, defaultPricePerKg: 8.5 },
  { id: 'azolla', name: 'Azolla (Water Fern)', category: 'protein', proteinPct: 25.0, energyKcal: 1600, fiberPct: 15.0, lysinePct: 1.0, methioninePct: 0.40, calciumPct: 1.5, phosphorusPct: 0.50, niacinMgKg: 0, usageLimits: { min: 0, max: 10 }, defaultPricePerKg: 2.0 },
  { id: 'sunflower_meal', name: 'Sunflower Seed Meal', category: 'protein', proteinPct: 38.0, energyKcal: 2100, fiberPct: 14.0, lysinePct: 1.2, methioninePct: 0.70, calciumPct: 0.40, phosphorusPct: 1.00, niacinMgKg: 0, usageLimits: { min: 0, max: 15 }, defaultPricePerKg: 4.5 },
  { id: 'sesame_cake', name: 'Sesame Seed Cake', category: 'protein', proteinPct: 40.0, energyKcal: 2200, fiberPct: 6.0, lysinePct: 1.0, methioninePct: 1.10, calciumPct: 2.0, phosphorusPct: 1.10, niacinMgKg: 0, usageLimits: { min: 0, max: 15 }, defaultPricePerKg: 5.0 },
  { id: 'brewers_grains', name: 'Brewers Dried Grains', category: 'protein', proteinPct: 25.0, energyKcal: 1900, fiberPct: 15.0, lysinePct: 0.8, methioninePct: 0.45, calciumPct: 0.30, phosphorusPct: 0.50, niacinMgKg: 0, usageLimits: { min: 0, max: 10 }, defaultPricePerKg: 1.5 },

  // Calcium Sources (6)
  { id: 'limestone', name: 'Limestone', category: 'calcium', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 38.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0, max: 5 }, defaultPricePerKg: 0.8 },
  { id: 'oyster_shell', name: 'Oyster Shell', category: 'calcium', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 36.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0, max: 5 }, defaultPricePerKg: 1.0 },
  { id: 'bone_meal', name: 'Bone Meal', category: 'calcium', proteinPct: 12.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 24.0, phosphorusPct: 12.0, niacinMgKg: 0, usageLimits: { min: 0, max: 5 }, defaultPricePerKg: 3.0 },
  { id: 'dcp', name: 'Dicalcium Phosphate (DCP)', category: 'calcium', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 22.0, phosphorusPct: 18.0, niacinMgKg: 0, usageLimits: { min: 0, max: 2 }, defaultPricePerKg: 15.0 },
  { id: 'mcp', name: 'Monocalcium Phosphate (MCP)', category: 'calcium', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 16.0, phosphorusPct: 21.0, niacinMgKg: 0, usageLimits: { min: 0, max: 2 }, defaultPricePerKg: 18.0 },
  { id: 'eggshell_meal', name: 'Eggshell Meal', category: 'calcium', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 36.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0, max: 5 }, defaultPricePerKg: 1.2 },

  // Supplements (11)
  { id: 'salt', name: 'Salt (Sodium Chloride)', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0.2, max: 0.5 }, defaultPricePerKg: 1.5 },
  { id: 'lysine_hcl', name: 'L-Lysine HCl', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 78.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0, max: 1 }, defaultPricePerKg: 20.0 },
  { id: 'dl_methionine', name: 'DL-Methionine', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 99.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0, max: 1 }, defaultPricePerKg: 25.0 },
  { id: 'toxin_binder', name: 'Mycotoxin Binder', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0.1, max: 0.3 }, defaultPricePerKg: 12.0 },
  { id: 'premix_broiler', name: 'Vitamin Premix (Broiler)', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0.25, max: 0.5 }, defaultPricePerKg: 15.0 },
  { id: 'premix_layer', name: 'Vitamin Premix (Layer)', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0.25, max: 0.5 }, defaultPricePerKg: 15.0 },
  { id: 'premix_duck', name: 'Waterfowl Vitamin Premix', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 150, usageLimits: { min: 0.25, max: 0.5 }, defaultPricePerKg: 18.0 },
  { id: 'premix_turkey', name: 'Vitamin Premix (Turkey)', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0.25, max: 0.5 }, defaultPricePerKg: 18.0 },
  { id: 'niacin_pure', name: 'Niacin (Vitamin B3)', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 500000, usageLimits: { min: 0, max: 0.1 }, defaultPricePerKg: 30.0 },
  { id: 'coccidiostat', name: 'Coccidiostat', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0, max: 0.1 }, defaultPricePerKg: 20.0 },
  { id: 'blackhead_prev', name: 'Blackhead Preventive', category: 'supplement', proteinPct: 0.0, energyKcal: 0, fiberPct: 0.0, lysinePct: 0.0, methioninePct: 0.0, calciumPct: 0.0, phosphorusPct: 0.0, niacinMgKg: 0, usageLimits: { min: 0, max: 0.1 }, defaultPricePerKg: 22.0 },
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

/**
 * Feed reduction percentages for semi-intensive/free-range systems.
 * Applied to computed target weight when foraging is active.
 */
export const FORAGING_MODIFIERS: Record<string, number> = {
  duck: 0.25,   // 25% reduction (High foraging efficiency)
  turkey: 0.20, // 20% reduction
  layer: 0.12,  // 12% reduction
  broiler: 0.0, // Commercial broilers rarely forage effectively
};

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

  return result;
}
