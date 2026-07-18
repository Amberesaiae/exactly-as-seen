# BC-1d — Migration 7: Seed Data (52 Medications, 9 Containers, 25 Ingredients, Nutritional Requirements)

## Overview

Seeds all reference data required by BC-2 (conflict matrix, dosing) and BC-3 (LP solver). All inserts use `ON CONFLICT DO NOTHING` — idempotent and safe to re-run.

**Sprint:** Sprint 1 (runs after BC-1c — tables must exist first).

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/f907ab32-46cf-48cf-a173-d28f90d1c466 — BC-1 Migration 7 section.

## Scope

### Migration 7 — Seed data

New SQL file in file:supabase/migrations/. All inserts use `INSERT INTO ... ON CONFLICT DO NOTHING`.

**52 medications** — covering all categories: antibiotics (oxytetracycline, tylosin, enrofloxacin, amoxicillin, doxycycline, neomycin, gentamicin, lincomycin, spectinomycin, chlortetracycline), coccidiostats (amprolium, toltrazuril, diclazuril, sulfadimethoxine, sulfamethazine), dewormers (fenbendazole, levamisole, piperazine, ivermectin), antiprotozoals (metronidazole), vaccines (gumboro_intermediate, gumboro_plus, hb1, lasota, komarov, fowl_pox, marek, duck_viral_hepatitis, duck_plague, blackhead), supplements (niacin, multivitamins, electrolytes, probiotics, glucose, apple_cider_vinegar, toxin_binder, methionine_supplement, lysine_supplement, calcium_supplement, vitamin_d3, vitamin_e, zinc_supplement, selenium_supplement, activated_charcoal).

Key boolean flags per medication: `is_live_vaccine`, `is_sulfa`, `contains_calcium`, `is_tetracycline`, `is_activated_charcoal`.

**9 container types** — per CONVENTIONS §2.3: Small Bell Drinker (1L), Bell Drinker 1 gal (3L), Bell Drinker 6L, Local Drinker 10L, Jumbo Bell 14L, 5 Gallon Bucket (20L), Jerry Can 25L, 50L Drum, Nipple Tank 100L.

**25 ingredients** — covering energy (maize, wheat, sorghum, cassava, rice bran, palm kernel cake), protein (soybean meal, groundnut cake, cotton seed cake, fish meal, blood meal, feather meal, sunflower meal), calcium (oyster shell, limestone, dicalcium phosphate), supplements (toxin_binder, salt, premix, methionine, lysine, vitamin_premix, mineral_premix, tallow, vegetable_oil).

**Nutritional requirements** — 11 species/phase combinations covering broiler (starter/grower/finisher), layer (starter/grower/layer_production), duck-meat (starter/grower/finisher), duck-layer (layer_production), turkey (starter/grower/finisher).

## Acceptance Criteria

1. `medications` has exactly 52 rows after seed
2. `container_types` has exactly 9 rows after seed
3. `ingredients` has exactly 25 rows after seed
4. `nutritional_requirements` has 11 rows covering all species/phase combinations
5. All inserts are idempotent — running the migration twice produces the same result
6. Key boolean flags correct: `gumboro_intermediate.is_live_vaccine = true`, `oxytetracycline.is_sulfa = false`, `sulfadimethoxine.is_sulfa = true`, `activated_charcoal.is_activated_charcoal = true`
7. Nutritional values correct: broiler starter `protein_min = 22`, `energy_min = 3000`, `calcium_min = 0.9`

## Dependencies

BC-1c (tables must exist before seed data can be inserted).