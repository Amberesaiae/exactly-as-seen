-- Migration: Seed remaining 16 ingredients to reach the research target of 41
-- Existing 25 ingredients are in migration_7.sql (20260414080003)
-- These 16 bring the total to 41, matching the feed-data.ts / research spec

-- Energy sources (3 new → 9 total)
-- Protein sources (7 new → 15 total, including dual grades)
-- Calcium sources (3 new → 6 total)
-- Supplements (3 new → 11 total, including species-specific premixes + actives)

INSERT INTO public.ingredients (id, name, category, protein_pct, energy_kcal_per_kg, calcium_pct, phosphorus_pct, lysine_pct, methionine_pct, contains_gossypol, contains_aflatoxin_risk, max_share_pct) VALUES
-- ──────────────────────────────────────────────
-- Energy sources (3)
-- ──────────────────────────────────────────────
('pearl_millet', 'Pearl Millet', 'energy', 11.0, 3150, 0.05, 0.30, 0.30, 0.22, false, false, 50),
('palm_oil', 'Palm Oil', 'energy', 0.0, 8800, 0.00, 0.00, 0.00, 0.00, false, false, 5),
('molasses', 'Molasses', 'energy', 4.0, 2400, 0.80, 0.08, 0.00, 0.00, false, false, 5),

-- ──────────────────────────────────────────────
-- Protein sources (7)
-- ──────────────────────────────────────────────
('soybean_meal_48', 'Soybean Meal (48% CP)', 'protein', 48.0, 2400, 0.30, 0.65, 2.90, 0.65, false, false, 30),
('fish_meal_72', 'Fish Meal (72% CP)', 'protein', 72.0, 3000, 4.50, 2.80, 5.80, 2.10, false, false, 10),
('meat_bone_meal', 'Meat and Bone Meal', 'protein', 50.0, 2400, 10.00, 5.00, 2.50, 0.70, false, false, 10),
('bsf_larvae', 'Black Soldier Fly Larvae (BSF)', 'protein', 42.0, 2400, 3.00, 0.90, 2.40, 0.85, false, false, 15),
('azolla', 'Azolla (Water Fern)', 'protein', 25.0, 1600, 1.50, 0.50, 1.00, 0.40, false, false, 10),
('sesame_cake', 'Sesame Seed Cake', 'protein', 40.0, 2200, 2.00, 1.10, 1.00, 1.10, false, false, 15),
('brewers_grains', 'Brewers Dried Grains', 'protein', 25.0, 1900, 0.30, 0.50, 0.80, 0.45, false, false, 10),

-- ──────────────────────────────────────────────
-- Calcium / phosphorus sources (3)
-- ──────────────────────────────────────────────
('bone_meal', 'Bone Meal', 'calcium', 12.0, 0, 24.00, 12.00, 0.00, 0.00, false, false, 5),
('mcp', 'Monocalcium Phosphate (MCP)', 'calcium', 0.0, 0, 16.00, 21.00, 0.00, 0.00, false, false, 2),
('eggshell_meal', 'Eggshell Meal', 'calcium', 0.0, 0, 36.00, 0.00, 0.00, 0.00, false, false, 5),

-- ──────────────────────────────────────────────
-- Supplements (3)
-- ──────────────────────────────────────────────
('premix_layer', 'Vitamin Premix (Layer)', 'supplement', 0.0, 0, 0.00, 0.00, 0.00, 0.00, false, false, 100),
('premix_duck', 'Waterfowl Vitamin Premix', 'supplement', 0.0, 0, 0.00, 0.00, 0.00, 0.00, false, false, 100),
('premix_turkey', 'Vitamin Premix (Turkey)', 'supplement', 0.0, 0, 0.00, 0.00, 0.00, 0.00, false, false, 100)
ON CONFLICT (id) DO NOTHING;
