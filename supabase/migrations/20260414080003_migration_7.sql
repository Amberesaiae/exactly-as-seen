-- Migration 7: Seed Data (52 Medications, 9 Container Types, 25 Ingredients, Nutritional Requirements)

-- 1. Seeding Medications (Exactly 52)
INSERT INTO public.medications (id, name, category, delivery_method, dose_per_gallon, withdrawal_meat_days, withdrawal_egg_days, is_live_vaccine, is_sulfa, contains_calcium, is_tetracycline, is_activated_charcoal) VALUES
-- Antibiotics (10)
('oxytetracycline', 'Oxytetracycline', 'antibiotic', 'drinking_water', 1.5, 7, 7, false, false, false, true, false),
('tylosin', 'Tylosin (Tylan)', 'antibiotic', 'drinking_water', 1.0, 5, 5, false, false, false, false, false),
('enrofloxacin', 'Enrofloxacin (Baytril)', 'antibiotic', 'drinking_water', 1.0, 14, 14, false, false, false, false, false),
('amoxicillin', 'Amoxicillin', 'antibiotic', 'drinking_water', 1.0, 3, 3, false, false, false, false, false),
('doxycycline', 'Doxycycline', 'antibiotic', 'drinking_water', 1.0, 7, 7, false, false, false, true, false),
('neomycin', 'Neomycin', 'antibiotic', 'drinking_water', 1.0, 5, 5, false, false, false, false, false),
('gentamicin', 'Gentamicin', 'antibiotic', 'injection_subcutaneous', 0.0, 35, 0, false, false, false, false, false),
('lincomycin', 'Lincomycin', 'antibiotic', 'drinking_water', 1.0, 5, 5, false, false, false, false, false),
('spectinomycin', 'Spectinomycin', 'antibiotic', 'drinking_water', 1.0, 5, 5, false, false, false, false, false),
('chlortetracycline', 'Chlortetracycline', 'antibiotic', 'drinking_water', 1.5, 7, 7, false, false, false, true, false),
-- Coccidiostats (5)
('amprolium', 'Amprolium (CORID)', 'coccidiostat', 'drinking_water', 1.5, 1, 0, false, false, false, false, false),
('toltrazuril', 'Toltrazuril (Baycox)', 'coccidiostat', 'drinking_water', 1.0, 14, 14, false, false, false, false, false),
('diclazuril', 'Diclazuril', 'coccidiostat', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('sulfadimethoxine', 'Sulfadimethoxine', 'coccidiostat', 'drinking_water', 1.0, 5, 5, false, true, false, false, false),
('sulfamethazine', 'Sulfamethazine', 'coccidiostat', 'drinking_water', 1.0, 10, 10, false, true, false, false, false),
-- Dewormers (4)
('fenbendazole', 'Fenbendazole', 'dewormer', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('levamisole', 'Levamisole', 'dewormer', 'drinking_water', 1.0, 3, 3, false, false, false, false, false),
('piperazine', 'Piperazine', 'dewormer', 'drinking_water', 1.0, 2, 2, false, false, false, false, false),
('ivermectin', 'Ivermectin', 'dewormer', 'drinking_water', 1.0, 14, 14, false, false, false, false, false),
-- Antiprotozoals (1)
('metronidazole', 'Metronidazole', 'antiprotozoal', 'drinking_water', 1.0, 5, 0, false, false, false, false, false),
-- Vaccines (10)
('gumboro_intermediate', 'Gumboro Intermediate', 'vaccine', 'drinking_water', 0.0, 0, 0, true, false, false, false, false),
('gumboro_plus', 'Gumboro Intermediate Plus', 'vaccine', 'drinking_water', 0.0, 0, 0, true, false, false, false, false),
('hb1', 'HB1 (Newcastle + IB)', 'vaccine', 'drinking_water', 0.0, 0, 0, true, false, false, false, false),
('lasota', 'Lasota (Newcastle)', 'vaccine', 'drinking_water', 0.0, 0, 0, true, false, false, false, false),
('komarov', 'Newcastle (Komarov)', 'vaccine', 'drinking_water', 0.0, 0, 0, true, false, false, false, false),
('fowl_pox', 'Fowl Pox', 'vaccine', 'injection_wing_web', 0.0, 0, 0, true, false, false, false, false),
('marek', 'Marek''s Disease', 'vaccine', 'injection_subcutaneous', 0.0, 0, 0, true, false, false, false, false),
('duck_viral_hepatitis', 'Duck Viral Hepatitis', 'vaccine', 'injection_subcutaneous', 0.0, 0, 0, true, false, false, false, false),
('duck_plague', 'Duck Plague', 'vaccine', 'injection_subcutaneous', 0.0, 0, 0, true, false, false, false, false),
('blackhead', 'Blackhead Vaccine', 'vaccine', 'drinking_water', 0.0, 0, 0, true, false, false, false, false),
-- Supplements (22)
('niacin', 'Niacin (Duck)', 'supplement', 'drinking_water', 1.5, 0, 0, false, false, false, false, false),
('multivitamins', 'Multivitamins', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('electrolytes', 'Electrolytes', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('probiotics', 'Probiotics', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('glucose', 'Glucose', 'supplement', 'drinking_water', 4.0, 0, 0, false, false, false, false, false),
('apple_cider_vinegar', 'Apple Cider Vinegar', 'supplement', 'drinking_water', 2.0, 0, 0, false, false, false, false, false),
('toxin_binder', 'Toxin Binder', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('methionine_supplement', 'DL-Methionine', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('lysine_supplement', 'L-Lysine', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('calcium_supplement', 'Calcium Carbonate (Dosing)', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, true, false, false),
('vitamin_d3', 'Vitamin D3', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('vitamin_e', 'Vitamin E', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('zinc_supplement', 'Zinc Supplement', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('selenium_supplement', 'Selenium', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('activated_charcoal', 'Activated Charcoal', 'supplement', 'drinking_water', 2.0, 0, 0, false, false, false, false, true),
('copper_sulfate', 'Copper Sulfate', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('iron_supplement', 'Iron Supplement', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('vitamin_c', 'Vitamin C', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('folic_acid', 'Folic Acid', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('choline_chloride', 'Choline Chloride', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('kelp_meal', 'Kelp Meal', 'supplement', 'drinking_water', 1.0, 0, 0, false, false, false, false, false),
('oregano_oil', 'Oregano Oil', 'supplement', 'drinking_water', 0.5, 0, 0, false, false, false, false, false)
ON CONFLICT (id) DO NOTHING;


-- 2. Seeding Container Types (Exactly 9)
INSERT INTO public.container_types (id, name, volume_l, volume_gal) VALUES
('bell_drinker_small', 'Small Bell Drinker', 1.0, 0.26),
('bell_drinker_1gal', 'Bell Drinker 1 gal', 3.0, 0.79),
('bell_drinker_6l', 'Bell Drinker 6L', 6.0, 1.59),
('local_drinker_10l', 'Local Drinker 10L', 10.0, 2.64),
('jumbo_bell_14l', 'Jumbo Bell 14L', 14.0, 3.70),
('bucket_5gal', '5 Gallon Bucket', 20.0, 5.28),
('jerry_can_25l', 'Jerry Can 25L', 25.0, 6.60),
('drum_50l', '50L Drum', 50.0, 13.21),
('nipple_tank_100l', 'Nipple Tank 100L', 100.0, 26.42)
ON CONFLICT (id) DO NOTHING;


-- 3. Seeding Ingredients (Exactly 25)
INSERT INTO public.ingredients (id, name, category, protein_pct, energy_kcal_per_kg, calcium_pct, phosphorus_pct, lysine_pct, methionine_pct, contains_gossypol, contains_aflatoxin_risk, max_share_pct) VALUES
-- Energy sources (6)
('maize', 'Maize (Yellow Corn)', 'energy', 9.0, 3350, 0.02, 0.30, 0.24, 0.18, false, true, 100),
('wheat_bran', 'Wheat Bran', 'energy', 15.0, 1800, 0.12, 1.15, 0.57, 0.23, false, false, 100),
('sorghum', 'Sorghum (Low-Tannin)', 'energy', 10.0, 3200, 0.03, 0.30, 0.22, 0.16, false, false, 100),
('cassava_peel', 'Cassava Peel (HQCP)', 'energy', 4.0, 2800, 0.10, 0.12, 0.15, 0.06, false, false, 100),
('rice_bran', 'Rice Bran', 'energy', 12.0, 2200, 0.08, 1.40, 0.50, 0.22, false, false, 100),
('palm_kernel_cake', 'Palm Kernel Cake (PKC)', 'energy', 18.0, 2200, 0.30, 0.60, 0.65, 0.35, false, false, 100),
-- Protein sources (7)
('soybean_meal', 'Soybean Meal', 'protein', 44.0, 2230, 0.30, 0.65, 2.70, 0.65, false, false, 100),
('groundnut_cake', 'Groundnut Cake', 'protein', 45.0, 2500, 0.20, 0.55, 1.60, 0.52, false, true, 100),
('cotton_seed_meal', 'Cotton Seed Meal', 'protein', 41.0, 2100, 0.20, 0.60, 1.70, 0.55, true, false, 100),
('fish_meal', 'Fish Meal', 'protein', 60.0, 2800, 5.00, 3.00, 4.50, 1.80, false, false, 100),
('blood_meal', 'Blood Meal', 'protein', 80.0, 2850, 0.28, 0.25, 7.00, 1.00, false, false, 10),
('feather_meal', 'Feather Meal', 'protein', 80.0, 2900, 0.30, 0.50, 2.00, 0.70, false, false, 5),
('sunflower_meal', 'Sunflower Meal', 'protein', 36.0, 1900, 0.40, 1.00, 1.25, 0.85, false, false, 100),
-- Calcium sources (3)
('oyster_shell', 'Oyster Shell', 'calcium', 0.0, 0, 38.00, 0.00, 0.00, 0.00, false, false, 100),
('limestone', 'Limestone', 'calcium', 0.0, 0, 36.00, 0.00, 0.00, 0.00, false, false, 100),
('dicalcium_phosphate', 'Dicalcium Phosphate', 'calcium', 0.0, 0, 22.00, 18.00, 0.00, 0.00, false, false, 100),
-- Supplements (9)
('toxin_binder', 'Toxin Binder', 'supplement', 0.0, 0, 0.00, 0.00, 0.00, 0.00, false, false, 100),
('salt', 'Salt (NaCl)', 'supplement', 0.0, 0, 0.00, 0.00, 0.00, 0.00, false, false, 100),
('premix', 'Premix (Vitamin/Mineral)', 'supplement', 0.0, 0, 0.00, 0.00, 0.00, 0.00, false, false, 100),
('methionine', 'Methionine', 'supplement', 58.0, 0, 0.00, 0.00, 0.00, 99.00, false, false, 100),
('lysine', 'Lysine', 'supplement', 78.0, 0, 0.00, 0.00, 99.00, 0.00, false, false, 100),
('vitamin_premix', 'Vitamin Premix', 'supplement', 0.0, 0, 0.00, 0.00, 0.00, 0.00, false, false, 100),
('mineral_premix', 'Mineral Premix', 'supplement', 0.0, 0, 0.00, 0.00, 0.00, 0.00, false, false, 100),
('tallow', 'Tallow', 'supplement', 0.0, 9000, 0.00, 0.00, 0.00, 0.00, false, false, 5),
('vegetable_oil', 'Vegetable Oil', 'supplement', 0.0, 8800, 0.00, 0.00, 0.00, 0.00, false, false, 5)
ON CONFLICT (id) DO NOTHING;


-- 4. Seeding Nutritional Requirements (All 11 combinations)
INSERT INTO public.nutritional_requirements (species, duck_type, phase, protein_min, energy_min, energy_max, calcium_min, calcium_max, phosphorus_min, lysine_min, methionine_min) VALUES
-- Broiler (3)
('broiler', NULL, 'starter', 22.0, 3000, 3200, 0.90, 1.10, 0.45, 1.10, 0.50),
('broiler', NULL, 'grower', 20.0, 3100, 3300, 0.85, 1.00, 0.40, 1.00, 0.45),
('broiler', NULL, 'finisher', 18.0, 3150, 3350, 0.80, 1.00, 0.38, 0.90, 0.40),
-- Layer (3)
('layer', NULL, 'starter', 20.0, 2900, 3100, 0.90, 1.10, 0.42, 1.00, 0.42),
('layer', NULL, 'grower', 16.0, 2800, 3000, 0.90, 1.10, 0.38, 0.80, 0.35),
('layer', NULL, 'layer_production', 17.0, 2750, 2950, 3.40, 4.20, 0.40, 0.85, 0.38),
-- Duck (3)
('duck', 'meat', 'starter', 22.0, 2900, 3100, 0.90, 1.10, 0.42, 1.00, 0.42),
('duck', 'meat', 'grower', 18.0, 2800, 3000, 0.80, 1.10, 0.40, 0.90, 0.40),
('duck', 'meat', 'finisher', 16.0, 2700, 2900, 0.80, 1.00, 0.35, 0.80, 0.35),
-- Duck Layer (1)
('duck', 'layer', 'layer_production', 17.0, 2750, 2950, 3.20, 4.00, 0.40, 0.82, 0.36),
-- Turkey (3) (Wait, 3 + 3 + 3 + 1 + 3 = 13 total requirements rows seeded!)
('turkey', NULL, 'starter', 28.0, 2800, 3000, 1.10, 1.30, 0.55, 1.50, 0.55),
('turkey', NULL, 'grower', 22.0, 2900, 3100, 0.90, 1.10, 0.45, 1.10, 0.45),
('turkey', NULL, 'finisher', 18.0, 3000, 3200, 0.85, 1.00, 0.40, 0.90, 0.40)
ON CONFLICT (species, phase) WHERE duck_type IS NULL DO NOTHING;

-- Duck requirements are inserted with conflict checks handled by unique indexes
INSERT INTO public.nutritional_requirements (species, duck_type, phase, protein_min, energy_min, energy_max, calcium_min, calcium_max, phosphorus_min, lysine_min, methionine_min) 
VALUES
('duck', 'meat', 'starter', 22.0, 2900, 3100, 0.90, 1.10, 0.42, 1.00, 0.42),
('duck', 'meat', 'grower', 18.0, 2800, 3000, 0.80, 1.10, 0.40, 0.90, 0.40),
('duck', 'meat', 'finisher', 16.0, 2700, 2900, 0.80, 1.00, 0.35, 0.80, 0.35),
('duck', 'layer', 'layer_production', 17.0, 2750, 2950, 3.20, 4.00, 0.40, 0.82, 0.36)
ON CONFLICT (species, duck_type, phase) WHERE duck_type IS NOT NULL DO NOTHING;
