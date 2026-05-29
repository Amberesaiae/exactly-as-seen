# Water-Health System - Production-Grade Specification (Container-Based Dosing + West African Context)

# Water-Health System - Production-Grade Specification

**Version:** 1.0  
**Date:** January 16, 2026  
**Status:** Production-Ready  
**Epic:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2c73a304-598c-472c-b79c-20584f6dc34b

---

## Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [Core Features](#core-features)
3. [Container-Based Medication Delivery](#container-based-medication-delivery)
4. [Medication Database](#medication-database)
5. [Medication Conflict Matrix](#medication-conflict-matrix)
6. [Withdrawal Period Tracking](#withdrawal-period-tracking)
7. [Species-Specific Protocols](#species-specific-protocols)
8. [Traditional Remedies](#traditional-remedies)
9. [UI Wireframes](#ui-wireframes)
10. [Backend Integration](#backend-integration)
11. [Event-Driven Integration](#event-driven-integration)
12. [Acceptance Criteria](#acceptance-criteria)

---

## Overview & Philosophy

### Purpose

The Water-Health System provides **container-based medication delivery** for poultry farmers in West Africa, eliminating complex calculations and making medication administration practical and safe.

### Core Philosophy

**Backend Intelligence, Frontend Simplicity:**

- App calculates medication amounts (species + age + population)
- Farmer sees practical instructions ("6 tbsp per 4 gallons")
- No weighing birds, no complex math
- Container-based delivery matches reality

**App vs Reality Protocol:**

- **App Responsibilities:** Calculate amounts, track withdrawal, record costs, generate summaries
- **Farmer Responsibilities:** Choose timing, handle mixing, monitor birds, adapt to conditions
- **Avoided Complexity:** No precision timing, no micromanagement, no rigid scheduling

### Supported Species


| Species | Traditional Remedies | Commercial Focus       | Rationale                                                                                           |
| ------- | -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| Broiler | NO                   | High (meat production) | Commercial operations require strict pharmaceutical protocols                                       |
| Layer   | NO                   | High (egg production)  | Commercial operations require strict pharmaceutical protocols                                       |
| Duck    | YES                  | Medium                 | Often raised in mixed/traditional systems where ethnoveterinary remedies are culturally appropriate |
| Turkey  | YES                  | Medium                 | Often raised in mixed/traditional systems where ethnoveterinary remedies are culturally appropriate |


**Design Decision:** Broilers/Layers are commercial operations requiring strict pharmaceutical protocols. Ducks/Turkeys often raised in mixed/traditional systems where ethnoveterinary remedies are validated and culturally appropriate.

---

## Core Features

### 1. Container-Based Medication Delivery

**Universal Rule:** ONLY teaspoons/tablespoons, NEVER per kg

**Why:**

- Farmers don't weigh birds individually
- Teaspoon measurements are practical
- Standard formula: 1.5 tablespoons per gallon
- Container-based delivery matches reality

**Example:**

- ❌ WRONG: "Give 0.5g per kg body weight"
- ✅ RIGHT: "Coccidiostat - 6 tbsp per 4 gallons (15L)"

### 2. Measurement Unit Preferences

Farmers can choose their preferred display units:


| Unit Type | Options                     | Default     |
| --------- | --------------------------- | ----------- |
| Volume    | Gallons, Liters, Containers | Gallons     |
| Dose      | Tablespoons, Teaspoons, ml  | Tablespoons |


**Display Format by Preference:**

**Gallons (Default):**

```
"Coccidiostat - 6 tbsp per 4 gallons"
```

**Liters:**

```
"Coccidiostat - 6 tbsp per 15 liters"
```

**Containers:**

```
"Coccidiostat - 1.5 tbsp per Bell Drinker (4L)"
"Coccidiostat - 6 tbsp per 5 Gallon Bucket"
```

### 3. Population Tracking with Automatic Recalculation

**Formula:**

```
CURRENT_POPULATION = INITIAL - MORTALITY - CULLED - SOLD + ADDED
```

**Key Principle:** Medication amounts scale linearly with population

**Automatic Recalculation Triggers:**

- Record mortality → Immediate recalculation
- Record culling → Immediate recalculation
- Partial sale → Immediate recalculation
- Add birds → Immediate recalculation

**Example:**

```
Broiler batch, Week 4
Initial: 500 birds
Mortality (Week 1-3): 15 birds
Culled (sick): 5 birds
Current population: 500 - 15 - 5 = 480 birds

WEEK 4 CALCULATION:
- Water per bird: 200ml
- Daily water: 480 × 200ml = 96,000ml = 96L (25.4 gallons)
- Medication: 25.4 × 1.5 = 38 tbsp

APP DISPLAYS:
"Coccidiostat - 38 tbsp per 25 gallons (96L)"
"Population: 480 birds (20 lost)"
```

---

## Container-Based Medication Delivery

### Research-Validated Container Sizes (West Africa)


| Container Type                       | Volume (L)   | Volume (Gal) | Birds Per Unit | Common Use        |
| ------------------------------------ | ------------ | ------------ | -------------- | ----------------- |
| **Small Drinkers (Chicks)**          |              |              |                |                   |
| Small Bell Drinker                   | 1L           | 0.26 gal     | 10-15 chicks   | Brooding          |
| Bell Drinker (1 gal)                 | 3L           | 0.8 gal      | 20-25 chicks   | Starter phase     |
| **Medium Drinkers (Growers)**        |              |              |                |                   |
| Bell Drinker (6L)                    | 6L           | 1.6 gal      | 30-40 birds    | Grower phase      |
| Local Drinker (10L)                  | 10L          | 2.6 gal      | 40-50 birds    | Most common       |
| **Large Drinkers (Adults)**          |              |              |                |                   |
| Jumbo Bell (14L)                     | 14L          | 3.7 gal      | 50-60 birds    | Commercial        |
| 5 Gallon Bucket                      | 20L          | 5 gal        | 60-80 birds    | Very common       |
| **Bulk Containers (Mixing/Storage)** |              |              |                |                   |
| Jerry Can (25L)                      | 25L          | 6.6 gal      | Mixing         | Bulk preparation  |
| 50L Drum                             | 50L          | 13.2 gal     | Mixing         | Large flocks      |
| Nipple Tank (100L)                   | 100L         | 26.4 gal     | 200-300 birds  | Automated systems |
| **Custom**                           |              |              |                |                   |
| Custom                               | User-defined | User-defined | User-defined   | Farmer-specific   |


### Regional Defaults


| Region  | Common Containers                                             |
| ------- | ------------------------------------------------------------- |
| Nigeria | Local Drinker (10L), Jerry Can (25L), 5 Gallon Bucket (20L)   |
| Ghana   | Bell Drinker (6L), Local Drinker (10L), 5 Gallon Bucket (20L) |
| Default | Bell Drinker (6L), 5 Gallon Bucket (20L), 50L Drum            |


### Display Examples by Unit

**480 Broilers, Week 4 (96L daily water)**


| Unit Preference     | Medication Display                        | Vaccination Display                  |
| ------------------- | ----------------------------------------- | ------------------------------------ |
| Gallons             | "Coccidiostat - 38 tbsp per 25 gallons"   | "Vaccine - 19 tbsp in 12.5 gallons"  |
| Liters              | "Coccidiostat - 38 tbsp per 96 liters"    | "Vaccine - 19 tbsp in 48 liters"     |
| Local Drinker (10L) | "Coccidiostat - 4 tbsp per Local Drinker" | "Vaccine - 4 tbsp per Local Drinker" |
| 5 Gal Bucket (20L)  | "Coccidiostat - 8 tbsp per 5 Gal Bucket"  | "Vaccine - 8 tbsp per 5 Gal Bucket"  |
| Jerry Can (25L)     | "Coccidiostat - 10 tbsp per Jerry Can"    | "Vaccine - 10 tbsp per Jerry Can"    |
| 50L Drum            | "Coccidiostat - 20 tbsp per 50L Drum"     | "Vaccine - 20 tbsp per 50L Drum"     |


---

## Medication Database

### Medication Setup During Batch Creation

**User Flow:**

1. During batch creation (Step 2 or 3), farmer adds medications they have
2. Medications are organized by category
3. Farmer enters medication names (not products - e.g., "Amprolium" not "CORID")
4. App uses these names for all health tasks
5. Farmer can add more medications later in Settings

**Category-Based Entry:**

```
┌─────────────────────────────────────────────────────────────┐
│ ADD MEDICATIONS (Optional - can add later)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Select Category:                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Coccidiostat                                       ▼] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Medication Name:                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Amprolium                                            ] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│              [Cancel]  [Add Medication]                     │
│                                                             │
│ YOUR MEDICATIONS:                                           │
│ • Coccidiostat: Amprolium                                   │
│ • Antibiotic: Oxytetracycline                               │
│ • Vitamin: Multivitamins                                    │
│                                                             │
│              [Add Another]  [Continue]                      │
└─────────────────────────────────────────────────────────────┘
```

### Medication Categories


| Category            | Purpose                      | Examples                               |
| ------------------- | ---------------------------- | -------------------------------------- |
| Coccidiostat        | Prevent/treat coccidiosis    | Amprolium, Sulfadimethoxine            |
| Antibiotic          | Bacterial infections         | Oxytetracycline, Tylosin, Enrofloxacin |
| Anthelmintic        | Deworming                    | Fenbendazole, Piperazine, Levamisole   |
| Vitamin/Electrolyte | Stress support, nutrition    | Multivitamins, Electrolytes, Glucose   |
| Anti-stress         | Pre/post vaccination support | Vitamin C + Electrolytes blend         |


### Complete Medication Table

#### Coccidiostats


| Product | Active Ingredient | Dose/Gallon | Treatment Duration | Withdrawal (Meat) | Withdrawal (Eggs) | Notes                            |
| ------- | ----------------- | ----------- | ------------------ | ----------------- | ----------------- | -------------------------------- |
| CORID   | Amprolium         | 1-2 tsp     | 5-7 days           | 0-24 hours        | 0 days            | FDA approved, minimal withdrawal |
| Albon   | Sulfadimethoxine  | 1 tsp       | 5 days             | 10 days           | 10 days           | Sulfa-based, longer withdrawal   |
| Sulmet  | Sulfamethazine    | 1 tsp       | 2-4 days           | 10 days           | 10 days           | Sulfa-based                      |
| Baycox  | Toltrazuril       | Per label   | 2 days             | 14 days           | 14 days           | Single dose option               |


**Treatment Pattern:** Typically 3-5 days on, 2 days off, repeat if needed

#### Antibiotics


| Product                  | Active Ingredient               | Dose/Gallon | Treatment Duration | Withdrawal (Meat) | Withdrawal (Eggs) | Notes                             |
| ------------------------ | ------------------------------- | ----------- | ------------------ | ----------------- | ----------------- | --------------------------------- |
| Terramycin               | Oxytetracycline                 | 1-2 tsp     | 7-14 days          | 7 days            | 7 days            | Broad spectrum                    |
| Tylan                    | Tylosin                         | 1 tsp       | 3-5 days           | 5 days            | 5 days            | Respiratory infections            |
| Baytril                  | Enrofloxacin                    | Per label   | 3-5 days           | 14 days           | 14 days           | Fluoroquinolone - restricted      |
| Lincomycin               | Lincomycin                      | 1 tsp       | 7 days             | 2 days            | 2 days            | Necrotic enteritis                |
| Amoxicillin              | Amoxicillin                     | 1 tsp       | 5-7 days           | 7 days            | 7 days            | General infections                |
| Gentamicin               | Gentamicin                      | Per label   | 5-7 days           | 10 days           | 10 days           | Severe bacterial infections       |
| Colistin                 | Colistin                        | Per label   | 3-5 days           | 7 days            | 7 days            | E.coli, Salmonella (last resort)  |
| Florfenicol              | Florfenicol                     | Per label   | 3-5 days           | 10 days           | 10 days           | Respiratory, Salmonella           |
| Lincomycin-Spectinomycin | Lincomycin + Spectinomycin      | Per label   | 5-7 days           | 3 days            | 3 days            | CRD, Mycoplasma                   |
| Penicillin               | Penicillin                      | Per label   | 5-7 days           | 10 days           | 10 days           | Staphylococcus, Streptococcus     |
| Trimethoprim-Sulfa       | Trimethoprim + Sulfamethoxazole | 1 tsp       | 5-7 days           | 10 days           | 10 days           | Broad spectrum                    |
| Chlortetracycline        | Chlortetracycline               | Per label   | Continuous (feed)  | 7 days            | 7 days            | Feed additive, disease prevention |
| Erythromycin             | Erythromycin                    | Per label   | 5-7 days           | 7 days            | 7 days            | Mycoplasma, CRD                   |
| Neomycin                 | Neomycin                        | 1 tsp       | 5-7 days           | 7 days            | 7 days            | Intestinal infections, E.coli     |
| Sulfadimethoxine         | Sulfadimethoxine                | 1 tsp       | 5-7 days           | 10 days           | 10 days           | Coccidiosis, bacterial infections |


**Important:** Antibiotic use requires veterinary guidance in many regions

#### Dewormers (Anthelmintics)


| Product      | Active Ingredient | Dose/Gallon | Treatment Duration | Withdrawal (Meat) | Withdrawal (Eggs) | Notes                         |
| ------------ | ----------------- | ----------- | ------------------ | ----------------- | ----------------- | ----------------------------- |
| Safe-Guard   | Fenbendazole      | Per label   | 3-5 days           | 0 days            | 0 days            | Safe Flock approved           |
| Wazine       | Piperazine        | 1 oz/gallon | 1 day              | 14 days           | 14 days           | Roundworms only               |
| Levamisole   | Levamisole        | Per label   | 1 day              | 3 days            | 0 days            | Broad spectrum                |
| Ivermectin   | Ivermectin        | Per label   | 1 day              | 14 days           | 14 days           | External + internal parasites |
| Albendazole  | Albendazole       | Per label   | 3-5 days           | 10 days           | 10 days           | Tapeworms, roundworms         |
| Praziquantel | Praziquantel      | Per label   | 1 day              | 7 days            | 7 days            | Tapeworms                     |


**Deworming Schedule:** Every 4-6 weeks, or monthly in rainy season

#### Vitamins & Electrolytes


| Product                  | Contents              | Dose/Gallon | Treatment Duration  | Withdrawal | Notes                          |
| ------------------------ | --------------------- | ----------- | ------------------- | ---------- | ------------------------------ |
| Vitamins & Electrolytes  | Multi-vitamin blend   | 1 tsp       | 3-5 days            | 0 days     | Stress support                 |
| Electrolytes             | Sodium, Potassium     | 3/4 tsp     | 3-5 days            | 0 days     | Heat stress, dehydration       |
| Vitamin C                | Ascorbic acid         | 1/2 tsp     | 3-5 days            | 0 days     | Immune support                 |
| Glucose/Dextrose         | Sugar                 | 1 tbsp      | 1-3 days            | 0 days     | Energy boost, chick arrival    |
| Vitamin A+D+E (Vitalyte) | Fat-soluble vitamins  | 1 tsp       | 3-5 days            | 0 days     | Stress, growth                 |
| Vitamin B-Complex        | B vitamins            | 1 tsp       | 3-5 days            | 0 days     | Stress, appetite               |
| Vitamin K                | Phylloquinone         | 1/2 tsp     | 3-5 days            | 0 days     | Bleeding, coccidiosis recovery |
| Amino Acids (Aminovit)   | Essential amino acids | 1 tsp       | 5-7 days            | 0 days     | Growth, feather development    |
| Probiotics (Protexin)    | Beneficial bacteria   | 1/2 tsp     | 5-7 days            | 0 days     | Gut health, post-antibiotic    |
| Liver Tonics             | Liver support blend   | 1 tsp       | 5-7 days            | 0 days     | Toxin removal, liver support   |
| Calcium + Phosphorus     | Ca + P minerals       | 1 tsp       | Continuous (layers) | 0 days     | Bone development, layers       |
| Selenium + Vitamin E     | Se + Vit E            | 1/2 tsp     | 3-5 days            | 0 days     | Immunity, muscle development   |
| Biotin                   | Vitamin B7            | 1/4 tsp     | 5-7 days            | 0 days     | Feather quality, hoof health   |


**No withdrawal required for vitamins/electrolytes**

#### Antifungals


| Product        | Active Ingredient | Dose/Gallon | Treatment Duration | Withdrawal (Meat) | Withdrawal (Eggs) | Notes                              |
| -------------- | ----------------- | ----------- | ------------------ | ----------------- | ----------------- | ---------------------------------- |
| Nystatin       | Nystatin          | Per label   | 5-7 days           | 0 days            | 0 days            | Candidiasis, crop mycosis          |
| Copper Sulfate | Copper Sulfate    | 1/4 tsp     | 3-5 days           | 7 days            | 7 days            | Water treatment, fungal prevention |
| Ketoconazole   | Ketoconazole      | Per label   | 7-14 days          | 14 days           | 14 days           | Systemic fungal infections         |
| Amphotericin B | Amphotericin B    | Per label   | 7-14 days          | 14 days           | 14 days           | Severe aspergillosis               |


### Local Product Names (Ghana/Nigeria)


| Generic Name    | Ghana Brand     | Nigeria Brand      | Notes                    |
| --------------- | --------------- | ------------------ | ------------------------ |
| Amprolium       | Amprol, Corid   | Amprolium 20%      | Most common coccidiostat |
| Oxytetracycline | Terramycin, OTC | Oxytet, Terramycin | Widely available         |
| Tylosin         | Tylan           | Tylosin 50         | Respiratory              |
| Fenbendazole    | Panacur         | Safe-Guard         | Dewormer                 |
| Multivitamins   | Vitalyte        | Kepro Vit          | Many brands              |
| Electrolytes    | Electrovit      | Electrolyte Plus   | Heat stress              |


### Cost Reference (West Africa)


| Medication      | Package Size | Approx. Cost (GHS) | Approx. Cost (NGN) |
| --------------- | ------------ | ------------------ | ------------------ |
| Amprolium       | 100g         | 25-35              | 2,500-3,500        |
| Oxytetracycline | 100g         | 30-45              | 3,000-4,500        |
| Tylosin         | 100g         | 50-70              | 5,000-7,000        |
| Fenbendazole    | 100ml        | 40-60              | 4,000-6,000        |
| Multivitamins   | 100g         | 20-30              | 2,000-3,000        |
| Electrolytes    | 100g         | 15-25              | 1,500-2,500        |


*Prices vary by location and supplier*

---

## Medication Conflict Matrix

### DO NOT COMBINE (Same Day)


| Medication A        | Medication B      | Reason                                          | Wait Time               |
| ------------------- | ----------------- | ----------------------------------------------- | ----------------------- |
| Activated Charcoal  | ANY medication    | Charcoal absorbs medications (50-80% reduction) | 2 hours minimum         |
| Calcium supplements | Tetracyclines     | Calcium binds tetracycline, reduces absorption  | 4 hours                 |
| Sulfa drugs         | Acidic vitamins   | pH interaction reduces effectiveness            | 2 hours                 |
| Live vaccines       | Antibiotics       | Antibiotics may kill live vaccine organisms     | 3 days before/after     |
| Live vaccines       | Chlorinated water | Chlorine kills vaccine organisms                | Use dechlorinated water |


### SAFE TO COMBINE


| Combination                | Notes                           |
| -------------------------- | ------------------------------- |
| Vitamins + Electrolytes    | Common combination, safe        |
| Coccidiostat + Vitamins    | Safe, often given together      |
| Dewormer + Vitamins        | Safe, vitamins support recovery |
| Anti-stress + Electrolytes | Same product often              |


### Conflict Detection Logic

```
CONFLICT_RULES:
1. Activated charcoal blocks ALL medications (2 hour wait)
2. Calcium blocks tetracyclines (4 hour wait)
3. Sulfa drugs conflict with acidic vitamins (2 hour wait)
4. Live vaccines conflict with antibiotics (3 day wait)
5. Live vaccines conflict with chlorinated water (use dechlorinated)

VALIDATION:
- Check active tasks for batch
- Check scheduled tasks for today
- Block task creation if conflict detected
- Show farmer-friendly error message
- Suggest alternative timing
```

---

## Withdrawal Period Tracking

### How Withdrawal Works

1. **Treatment Duration:** How long to give medication (e.g., 5 days)
2. **Withdrawal Period:** Time after LAST dose before meat/eggs safe (e.g., 7 days)
3. **Safe Date:** Last dose date + withdrawal days

**Example Timeline:**

```
Day 1-5: Give antibiotic (treatment duration)
Day 5: Last dose
Day 5-12: Withdrawal period (7 days)
Day 12+: Safe to sell/consume
```

### Withdrawal Periods by Category


| Category              | Typical Withdrawal (Meat) | Typical Withdrawal (Eggs) |
| --------------------- | ------------------------- | ------------------------- |
| Coccidiostats         | 0-14 days                 | 0-14 days                 |
| Antibiotics           | 2-14 days                 | 2-14 days                 |
| Dewormers             | 0-14 days                 | 0-14 days                 |
| Vitamins/Electrolytes | 0 days                    | 0 days                    |


### Safe Termination Date Calculation

```
CALCULATION:
safe_date = last_dose_date + withdrawal_days

BATCH TERMINATION CHECK:
1. Get all active withdrawals for batch
2. Find latest safe_date
3. If today < latest safe_date:
   - Block termination
   - Show warning with safe date
   - List blocking medications
4. Else:
   - Allow termination
```

### Batch Termination Blocking

**Scenario:** Farmer tries to terminate batch during withdrawal

**App Behavior:**

```
❌ CANNOT TERMINATE BATCH

Withdrawal period active for:
- Oxytetracycline (last dose: Jan 10)
  Safe date: Jan 17 (7 days remaining)

You cannot sell or consume birds until withdrawal period ends.

[View Withdrawal Details] [Cancel]
```

---

## Species-Specific Protocols

### Water Consumption Tables

#### Broilers (per bird per day)


| Week | Water (ml) | 100 Birds     | 500 Birds     |
| ---- | ---------- | ------------- | ------------- |
| 1    | 50         | 5L (1.3 gal)  | 25L (6.6 gal) |
| 2    | 100        | 10L (2.6 gal) | 50L (13 gal)  |
| 3    | 150        | 15L (4 gal)   | 75L (20 gal)  |
| 4    | 200        | 20L (5.3 gal) | 100L (26 gal) |
| 5-6  | 250        | 25L (6.6 gal) | 125L (33 gal) |


#### Layers (per bird per day)


| Week | Water (ml) | 100 Birds     | 500 Birds     |
| ---- | ---------- | ------------- | ------------- |
| 1-2  | 50         | 5L (1.3 gal)  | 25L (6.6 gal) |
| 3-4  | 100        | 10L (2.6 gal) | 50L (13 gal)  |
| 5-8  | 150        | 15L (4 gal)   | 75L (20 gal)  |
| 9-15 | 200        | 20L (5.3 gal) | 100L (26 gal) |
| 16+  | 300        | 30L (8 gal)   | 150L (40 gal) |


#### Ducks (per bird per day) - 1.5-2x chickens


| Week | Water (ml) | 50 Birds        | 100 Birds      |
| ---- | ---------- | --------------- | -------------- |
| 1-2  | 150        | 7.5L (2 gal)    | 15L (4 gal)    |
| 3-4  | 250        | 12.5L (3.3 gal) | 25L (6.6 gal)  |
| 5-8  | 400        | 20L (5.3 gal)   | 40L (10.6 gal) |


**CRITICAL:** Ducks require **niacin supplementation** (1.5 tsp/gallon - MANDATORY)

#### Turkeys (per bird per day)


| Week  | Water (ml) | 50 Birds      | 100 Birds      |
| ----- | ---------- | ------------- | -------------- |
| 1-2   | 100        | 5L (1.3 gal)  | 10L (2.6 gal)  |
| 3-6   | 200        | 10L (2.6 gal) | 20L (5.3 gal)  |
| 7-10  | 300        | 15L (4 gal)   | 30L (8 gal)    |
| 11-14 | 400        | 20L (5.3 gal) | 40L (10.6 gal) |
| 15+   | 500        | 25L (6.6 gal) | 50L (13 gal)   |


### Heat Stress Adjustments

**Temperature Impact on Water Consumption:**


| Temperature       | Water Multiplier |
| ----------------- | ---------------- |
| Below 20°C (68°F) | 1.0x (normal)    |
| 20-25°C (68-77°F) | 1.2x             |
| 25-30°C (77-86°F) | 1.5x             |
| 30-35°C (86-95°F) | 2.0x             |
| Above 35°C (95°F) | 2.5-3.0x         |


**App Behavior:**

- App detects high temperature (if weather integration enabled)
- Adjusts water calculation automatically
- Shows farmer: "Heat stress detected - increased water amounts"
- Medication concentration stays same (per gallon), total volume increases

---

## Traditional Remedies

### Supported Species

**Traditional remedies ONLY for:**

- Ducks
- Turkeys

**NOT supported for:**

- Broilers (commercial pharmaceutical protocols only)
- Layers (commercial pharmaceutical protocols only)

### Traditional Remedy Database (Ducks/Turkeys)


| Remedy                  | Purpose                        | Preparation                 | Dosage             | Duration             | Notes                         |
| ----------------------- | ------------------------------ | --------------------------- | ------------------ | -------------------- | ----------------------------- |
| **Moringa Leaf Powder** | Immune boost, nutrition        | Dry leaves, grind to powder | 1 tbsp per gallon  | 3-5 days             | Rich in vitamins A, C, E      |
| **Garlic Water**        | Antibacterial, respiratory     | Crush 3-4 cloves per gallon | Fresh daily        | 3-7 days             | Natural antibiotic properties |
| **Apple Cider Vinegar** | Digestive health, pH balance   | Raw, unfiltered             | 1 tbsp per gallon  | Continuous (2x/week) | Maintains gut health          |
| **Ginger Root**         | Anti-inflammatory, respiratory | Grate fresh ginger          | 1 tsp per gallon   | 3-5 days             | Warming properties            |
| **Turmeric Powder**     | Anti-inflammatory, immune      | Ground turmeric             | 1/2 tsp per gallon | 3-5 days             | Combine with black pepper     |
| **Neem Leaf**           | Antiparasitic, antibacterial   | Boil leaves, strain         | 1 cup per gallon   | 3-5 days             | Traditional dewormer          |
| **Activated Charcoal**  | Toxin absorption, poisoning    | Food-grade charcoal         | 1 tsp per gallon   | 1-2 days             | Emergency use only            |


### Traditional Remedy UI Flow

**Selection Screen:**

```
┌─────────────────────────────────────────────────────────────┐
│ TRADITIONAL REMEDIES (Ducks/Turkeys Only)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️ Traditional remedies are complementary, not replacement │
│    for veterinary care in serious illness                  │
│                                                             │
│ Select Remedy:                                              │
│                                                             │
│ ○ Moringa Leaf Powder (Immune boost, nutrition)            │
│ ○ Garlic Water (Antibacterial, respiratory)                │
│ ○ Apple Cider Vinegar (Digestive health)                   │
│ ○ Ginger Root (Anti-inflammatory, respiratory)             │
│ ○ Turmeric Powder (Anti-inflammatory, immune)              │
│ ○ Neem Leaf (Antiparasitic, antibacterial)                 │
│ ○ Activated Charcoal (Toxin absorption - emergency)        │
│                                                             │
│              [Cancel]  [Continue]                           │
└─────────────────────────────────────────────────────────────┘
```

**Dosage Display:**

```
┌─────────────────────────────────────────────────────────────┐
│ GARLIC WATER - DOSAGE                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ House A - Duck Week 5                                       │
│ 95 birds (started 100, 5 lost)                             │
│                                                             │
│ PREPARATION:                                                │
│ 1. Crush 12-15 garlic cloves                               │
│ 2. Add to 40L (10.6 gallons) water                         │
│ 3. Let sit for 2-3 hours                                   │
│ 4. Strain before giving to birds                           │
│                                                             │
│ DURATION: 3-7 days                                          │
│ FREQUENCY: Fresh daily                                      │
│                                                             │
│ NOTES:                                                      │
│ - Natural antibiotic properties                            │
│ - Safe to combine with vitamins                            │
│ - Monitor bird response                                    │
│                                                             │
│              [Cancel]  [Mark as Completed]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Emergency Protocols

### Emergency vs Preventive: Key Distinction

**Preventive Protocol (Routine):**

- Scheduled in advance
- Part of weekly medication plan
- Standard doses
- Follows species protocol
- App auto-schedules

**Emergency Protocol (Crisis):**

- Triggered by disease signs
- Breaks from normal schedule
- Treatment doses (higher)
- Immediate action required
- Farmer initiates

### Emergency Disease Protocols

#### 1. Coccidiosis Outbreak

**Signs:**

- Bloody or brown droppings
- Huddling, ruffled feathers
- Reduced feed/water intake
- Mortality spike

**Emergency Treatment:**

```
Day 1-5: Amprolium (CORID)
- Dose: 2 tbsp per gallon (TREATMENT dose, not preventive)
- Provide as ONLY water source
- Ensure all birds drink

Day 6-7: Multivitamins
- Dose: 1.5 tbsp per gallon
- Recovery support

WITHDRAWAL: 0-24 hours after last amprolium dose

TRADITIONAL SUPPORT (alongside pharmaceutical):
- Garlic water for immune support
- Aloe vera for gut healing
- NOT a replacement for amprolium in outbreak
```

#### 2. Respiratory Infection

**Signs:**

- Sneezing, coughing, gasping
- Nasal/eye discharge
- Swollen face/sinuses
- Reduced activity

**Emergency Treatment:**

```
MILD (sneezing only):
- Garlic water: 8 cloves per liter, 5 days
- Electrolytes for support
- Monitor closely

MODERATE (discharge, some gasping):
- Tylosin: 1 tsp per gallon, 5 days
- Multivitamins after treatment
- WITHDRAWAL: 5 days

SEVERE (gasping, mortality):
- VET CONSULTATION REQUIRED
- May need injectable antibiotics
- Isolate affected birds
```

#### 3. Heat Stress Emergency

**Signs:**

- Panting, open-mouth breathing
- Wings spread away from body
- Lethargy, lying down
- Reduced feed intake
- Sudden deaths

**Emergency Treatment:**

```
IMMEDIATE ACTIONS:
1. Increase water availability (2-3x normal)
2. Add electrolytes: 3/4 tsp per gallon
3. Add ice to water if available
4. Improve ventilation
5. Reduce stocking density if possible

ELECTROLYTE FORMULA:
- Commercial electrolytes: 3/4 tsp per gallon
- OR homemade: 1/2 tsp salt + 1/2 tsp baking soda + 2 tbsp sugar per gallon

DURATION: Until temperature drops below 30°C (86°F)
WITHDRAWAL: 0 days (electrolytes safe)

TRADITIONAL SUPPORT:
- Aloe vera water (cooling effect)
- Watermelon juice in water (hydration + electrolytes)
```

#### 4. Blackhead Disease (Turkeys ONLY)

**Signs:**

- Yellow/sulfur-colored droppings
- Droopy, depressed birds
- Darkened head (hence "Blackhead")
- Rapid death (24-48 hours)

**Emergency Treatment:**

```
BLACKHEAD EMERGENCY (Turkeys):

IMMEDIATE:
- Metronidazole (where legal): Per vet guidance
- Isolate affected birds
- Increase garlic water (antiprotozoal support)
- Oregano water (natural antiprotozoal)

PREVENTION:
- NEVER mix turkeys with chickens
- Deworm every 2 weeks (Heterakis worm carries Blackhead)
- Keep turkeys off ground where chickens have been
- Garlic water weekly (preventive)

WITHDRAWAL: Per medication used

CRITICAL: Blackhead is #1 turkey killer - prevention is key
```

#### 5. Sudden Mortality (Unknown Cause)

**Signs:**

- Multiple deaths in 24-48 hours
- No obvious symptoms before death
- Healthy birds dying suddenly

**Emergency Response:**

```
IMMEDIATE:
1. ISOLATE dead birds (do not touch with bare hands)
2. ISOLATE sick birds from healthy
3. STOP all medications temporarily
4. Provide plain water + electrolytes only
5. CONTACT VET immediately

POSSIBLE CAUSES:
- Poisoning (feed, water, pesticides)
- Acute disease (Newcastle, Fowl Cholera)
- Suffocation (piling, ventilation failure)
- Predator stress

DO NOT:
- Give random medications
- Mix dead birds with live
- Ignore the problem
```

### When to Call Vet


| Situation                                     | Urgency   | Action             |
| --------------------------------------------- | --------- | ------------------ |
| Sudden high mortality (>5% in 24h)            | IMMEDIATE | Call vet now       |
| Neurological signs (twisting neck, paralysis) | IMMEDIATE | Possible Newcastle |
| Severe respiratory distress                   | URGENT    | Within 24 hours    |
| Bloody diarrhea not responding to treatment   | URGENT    | Within 24 hours    |
| Unknown disease                               | SOON      | Within 48 hours    |
| Routine health check                          | PLANNED   | Schedule visit     |


---

## UI Wireframes

### 1. Day-Old Chick Arrival Protocol

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: #f9fafb; padding: 20px; }
.protocol-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.protocol-header { padding: 24px; border-bottom: 1px solid #e5e7eb; background: #f0fdf4; border-radius: 12px 12px 0 0; }
.protocol-icon { font-size: 48px; text-align: center; margin-bottom: 12px; }
.protocol-title { font-size: 20px; font-weight: 600; color: #166534; text-align: center; margin-bottom: 8px; }
.protocol-subtitle { font-size: 14px; color: #15803d; text-align: center; }
.protocol-content { padding: 24px; }
.section { margin-bottom: 24px; }
.section-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.section-icon { font-size: 20px; }
.step-list { display: flex; flex-direction: column; gap: 12px; }
.step { display: flex; align-items: start; padding: 12px; background: #f9fafb; border-radius: 8px; border-left: 3px solid #16a34a; }
.step-num { width: 28px; height: 28px; background: #16a34a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; margin-right: 12px; flex-shrink: 0; }
.step-content { flex: 1; }
.step-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px; }
.step-desc { font-size: 13px; color: #6b7280; line-height: 1.5; }
.warning-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 12px; }
.warning-title { font-size: 13px; font-weight: 600; color: #991b1b; margin-bottom: 4px; }
.warning-text { font-size: 12px; color: #7f1d1d; line-height: 1.5; }
.dosage-box { background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; margin-top: 12px; }
.dosage-title { font-size: 13px; font-weight: 600; color: #1e40af; margin-bottom: 4px; }
.dosage-text { font-size: 13px; color: #1e3a8a; line-height: 1.5; }
.protocol-actions { padding: 24px; border-top: 1px solid #e5e7eb; }
.btn { width: 100%; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; background: #16a34a; color: white; }
</style>
</head>
<body>
<div class="protocol-container">
  <div class="protocol-header">
    <div class="protocol-icon">🐣</div>
    <div class="protocol-title">Day-Old Chick Arrival Protocol</div>
    <div class="protocol-subtitle">Critical first 72 hours for chick survival</div>
  </div>
  
  <div class="protocol-content">
    <div class="section">
      <div class="section-title">
        <span class="section-icon">🏠</span>
        Before Arrival (Preparation)
      </div>
      <div class="step-list">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">
            <div class="step-title">Prepare Brooding Area</div>
            <div class="step-desc">Clean and disinfect brooding area. Set up heat source (35-37°C for broilers, 32-35°C for layers). Spread clean litter.</div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-content">
            <div class="step-title">Prepare Sugar Water</div>
            <div class="step-desc">Mix glucose/sugar water (1 tablespoon per gallon). This provides immediate energy for stressed chicks.</div>
            <div class="dosage-box">
              <div class="dosage-title">Dosage for 100 Chicks</div>
              <div class="dosage-text">1 tablespoon sugar per 1.3 gallons (5L water)</div>
            </div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-content">
            <div class="step-title">Set Up Feeders & Drinkers</div>
            <div class="step-desc">Place small bell drinkers (1L or 3L) and chick feeders. Ensure easy access for small chicks.</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">
        <span class="section-icon">📦</span>
        Day 1: Arrival Day
      </div>
      <div class="step-list">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">
            <div class="step-title">Immediate Water Access</div>
            <div class="step-desc">Give sugar water immediately. Dip beaks of weak chicks to teach them to drink.</div>
            <div class="warning-box">
              <div class="warning-title">⚠️ Critical</div>
              <div class="warning-text">Chicks can die from dehydration within 24 hours. Water is more important than feed on Day 1.</div>
            </div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-content">
            <div class="step-title">Add Anti-Stress + Glucose</div>
            <div class="step-desc">After 2-3 hours, switch to anti-stress vitamins + glucose in water. Continue for 3 days.</div>
            <div class="dosage-box">
              <div class="dosage-title">Dosage for 100 Chicks (Day 1-3)</div>
              <div class="dosage-text">Anti-stress: 2 tbsp per 1.3 gallons (5L)<br>Glucose: 1 tbsp per 1.3 gallons (5L)</div>
            </div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-content">
            <div class="step-title">Introduce Feed</div>
            <div class="step-desc">After chicks drink, introduce starter feed. Sprinkle on paper/cardboard for easy access.</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">
        <span class="section-icon">💊</span>
        Day 4-6: Coccidiosis Prevention
      </div>
      <div class="step-list">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">
            <div class="step-title">Start Coccidiostat</div>
            <div class="step-desc">Switch from anti-stress to coccidiostat (e.g., Amprolium). Continue for 3 days.</div>
            <div class="dosage-box">
              <div class="dosage-title">Dosage for 100 Chicks (Day 4-6)</div>
              <div class="dosage-text">Coccidiostat: 1.5 tbsp per 1.3 gallons (5L)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">
        <span class="section-icon">💉</span>
        Day 7: First Vaccination
      </div>
      <div class="step-list">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">
            <div class="step-title">Gumboro Vaccine (Broilers/Layers)</div>
            <div class="step-desc">Withhold water 2-3 hours. Mix vaccine in half daily water. Ensure all chicks drink within 1 hour.</div>
            <div class="dosage-box">
              <div class="dosage-title">Dosage for 100 Chicks (Day 7)</div>
              <div class="dosage-text">Vaccine: 1 tbsp in 0.66 gallons (2.5L water)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">
        <span class="section-icon">📊</span>
        Monitoring Checklist
      </div>
      <div class="step-list">
        <div class="step">
          <div class="step-content">
            <div class="step-desc">
              ✓ Chicks active and moving<br>
              ✓ Chicks eating and drinking<br>
              ✓ No piling (sign of cold stress)<br>
              ✓ No panting (sign of heat stress)<br>
              ✓ Droppings normal (not watery)<br>
              ✓ Mortality < 2% in first week
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="protocol-actions">
    <button class="btn">I Understand - Start Batch</button>
  </div>
</div>
</body>
</html>
```

### 2. Water-Health Setup Wizard

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: #f9fafb; padding: 20px; }
.wizard-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.wizard-header { padding: 24px; border-bottom: 1px solid #e5e7eb; }
.wizard-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 8px; }
.wizard-subtitle { font-size: 14px; color: #6b7280; }
.wizard-progress { display: flex; padding: 24px; gap: 8px; }
.progress-step { flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px; }
.progress-step.active { background: #16a34a; }
.wizard-content { padding: 24px; }
.form-group { margin-bottom: 20px; }
.form-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
.form-select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.form-radio-group { display: flex; flex-direction: column; gap: 12px; }
.form-radio { display: flex; align-items: center; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; }
.form-radio input { margin-right: 12px; }
.form-radio-label { font-size: 14px; color: #374151; }
.form-radio-desc { font-size: 12px; color: #6b7280; margin-top: 4px; }
.wizard-actions { padding: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
.btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; }
.btn-secondary { background: #f3f4f6; color: #374151; }
.btn-primary { background: #16a34a; color: white; }
</style>
</head>
<body>
<div class="wizard-container">
  <div class="wizard-header">
    <div class="wizard-title">Water-Health Setup</div>
    <div class="wizard-subtitle">Configure your measurement preferences</div>
  </div>
  
  <div class="wizard-progress">
    <div class="progress-step active"></div>
    <div class="progress-step"></div>
    <div class="progress-step"></div>
  </div>
  
  <div class="wizard-content">
    <div class="form-group">
      <label class="form-label">Preferred Volume Unit</label>
      <div class="form-radio-group">
        <label class="form-radio">
          <input type="radio" name="volume_unit" value="gallons" checked>
          <div>
            <div class="form-radio-label">Gallons</div>
            <div class="form-radio-desc">Display as "6 tbsp per 4 gallons"</div>
          </div>
        </label>
        <label class="form-radio">
          <input type="radio" name="volume_unit" value="liters">
          <div>
            <div class="form-radio-label">Liters</div>
            <div class="form-radio-desc">Display as "6 tbsp per 15 liters"</div>
          </div>
        </label>
        <label class="form-radio">
          <input type="radio" name="volume_unit" value="containers">
          <div>
            <div class="form-radio-label">Containers</div>
            <div class="form-radio-desc">Display as "1.5 tbsp per Bell Drinker (4L)"</div>
          </div>
        </label>
      </div>
    </div>
  </div>
  
  <div class="wizard-actions">
    <button class="btn btn-secondary">Back</button>
    <button class="btn btn-primary">Continue</button>
  </div>
</div>
</body>
</html>
```

### 2. Weekly Task Dashboard

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: #f9fafb; padding: 20px; }
.dashboard-container { max-width: 1200px; margin: 0 auto; }
.dashboard-header { margin-bottom: 24px; }
.dashboard-title { font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 8px; }
.dashboard-subtitle { font-size: 14px; color: #6b7280; }
.task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
.task-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.task-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; }
.task-title { font-size: 16px; font-weight: 600; color: #111827; }
.task-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.badge-vaccination { background: #dbeafe; color: #1e40af; }
.badge-medication { background: #fef3c7; color: #92400e; }
.badge-deworming { background: #fce7f3; color: #9f1239; }
.task-info { margin-bottom: 16px; }
.task-info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
.task-info-label { color: #6b7280; }
.task-info-value { color: #111827; font-weight: 500; }
.task-dosage { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.task-dosage-text { font-size: 14px; color: #166534; font-weight: 500; }
.task-actions { display: flex; gap: 8px; }
.btn { padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; flex: 1; }
.btn-outline { background: white; color: #374151; border: 1px solid #d1d5db; }
.btn-primary { background: #16a34a; color: white; }
</style>
</head>
<body>
<div class="dashboard-container">
  <div class="dashboard-header">
    <div class="dashboard-title">Today's Health Tasks</div>
    <div class="dashboard-subtitle">3 tasks pending for January 16, 2026</div>
  </div>
  
  <div class="task-grid">
    <!-- Vaccination Task -->
    <div class="task-card">
      <div class="task-header">
        <div class="task-title">Newcastle Disease Vaccine</div>
        <div class="task-badge badge-vaccination">Vaccination</div>
      </div>
      <div class="task-info">
        <div class="task-info-row">
          <span class="task-info-label">Batch:</span>
          <span class="task-info-value">House A - Broiler Week 3</span>
        </div>
        <div class="task-info-row">
          <span class="task-info-label">Population:</span>
          <span class="task-info-value">480 birds (20 lost)</span>
        </div>
        <div class="task-info-row">
          <span class="task-info-label">Method:</span>
          <span class="task-info-value">Drinking water</span>
        </div>
      </div>
      <div class="task-dosage">
        <div class="task-dosage-text">Vaccine - 11 tbsp in 9 gallons (36L)</div>
      </div>
      <div class="task-actions">
        <button class="btn btn-outline">View Details</button>
        <button class="btn btn-primary">Complete Task</button>
      </div>
    </div>
    
    <!-- Medication Task -->
    <div class="task-card">
      <div class="task-header">
        <div class="task-title">Coccidiostat (Day 3 of 5)</div>
        <div class="task-badge badge-medication">Medication</div>
      </div>
      <div class="task-info">
        <div class="task-info-row">
          <span class="task-info-label">Batch:</span>
          <span class="task-info-value">House B - Layer Week 4</span>
        </div>
        <div class="task-info-row">
          <span class="task-info-label">Population:</span>
          <span class="task-info-value">295 birds (5 lost)</span>
        </div>
        <div class="task-info-row">
          <span class="task-info-label">Medication:</span>
          <span class="task-info-value">Amprolium (CORID)</span>
        </div>
      </div>
      <div class="task-dosage">
        <div class="task-dosage-text">Coccidiostat - 7 tbsp per 5 gallons (18L)</div>
      </div>
      <div class="task-actions">
        <button class="btn btn-outline">View Details</button>
        <button class="btn btn-primary">Complete Task</button>
      </div>
    </div>
    
    <!-- Deworming Task -->
    <div class="task-card">
      <div class="task-header">
        <div class="task-title">Monthly Deworming</div>
        <div class="task-badge badge-deworming">Deworming</div>
      </div>
      <div class="task-info">
        <div class="task-info-row">
          <span class="task-info-label">Batch:</span>
          <span class="task-info-value">House C - Duck Week 6</span>
        </div>
        <div class="task-info-row">
          <span class="task-info-label">Population:</span>
          <span class="task-info-value">95 birds (5 lost)</span>
        </div>
        <div class="task-info-row">
          <span class="task-info-label">Medication:</span>
          <span class="task-info-value">Fenbendazole (Safe-Guard)</span>
        </div>
      </div>
      <div class="task-dosage">
        <div class="task-dosage-text">Dewormer - 9 tbsp per 6 gallons (24L)</div>
      </div>
      <div class="task-actions">
        <button class="btn btn-outline">View Details</button>
        <button class="btn btn-primary">Complete Task</button>
      </div>
    </div>
  </div>
</div>
</body>
</html>
```

### 3. Vaccination Completion Modal

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: rgba(0,0,0,0.5); padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.modal { background: white; border-radius: 12px; max-width: 500px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.modal-header { padding: 24px; border-bottom: 1px solid #e5e7eb; }
.modal-title { font-size: 18px; font-weight: 600; color: #111827; }
.modal-content { padding: 24px; }
.protocol-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.protocol-title { font-size: 14px; font-weight: 600; color: #166534; margin-bottom: 12px; }
.protocol-step { display: flex; align-items: start; margin-bottom: 8px; }
.protocol-step-num { width: 24px; height: 24px; background: #16a34a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; flex-shrink: 0; }
.protocol-step-text { font-size: 13px; color: #14532d; line-height: 1.5; }
.checklist { margin-bottom: 24px; }
.checklist-title { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; }
.checklist-item { display: flex; align-items: start; padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px; }
.checklist-item input { margin-right: 12px; margin-top: 2px; }
.checklist-item-text { font-size: 14px; color: #374151; }
.info-box { background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; margin-bottom: 24px; }
.info-box-title { font-size: 14px; font-weight: 600; color: #1e40af; margin-bottom: 8px; }
.info-box-text { font-size: 13px; color: #1e3a8a; line-height: 1.5; }
.form-group { margin-bottom: 20px; }
.form-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.form-textarea { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical; min-height: 80px; }
.modal-actions { padding: 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; }
.btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; flex: 1; }
.btn-secondary { background: #f3f4f6; color: #374151; }
.btn-primary { background: #16a34a; color: white; }
</style>
</head>
<body>
<div class="modal">
  <div class="modal-header">
    <div class="modal-title">Complete Vaccination Task</div>
  </div>
  
  <div class="modal-content">
    <div class="protocol-box">
      <div class="protocol-title">📋 Vaccination Protocol</div>
      <div class="protocol-step">
        <div class="protocol-step-num">1</div>
        <div class="protocol-step-text">Buy vaccine early morning with ice blocks</div>
      </div>
      <div class="protocol-step">
        <div class="protocol-step-num">2</div>
        <div class="protocol-step-text">Remove water 2-3 hours before (make birds thirsty)</div>
      </div>
      <div class="protocol-step">
        <div class="protocol-step-num">3</div>
        <div class="protocol-step-text">Mix vaccine in half of daily water (9 gallons)</div>
      </div>
      <div class="protocol-step">
        <div class="protocol-step-num">4</div>
        <div class="protocol-step-text">Ensure all birds drink within 1 hour</div>
      </div>
      <div class="protocol-step">
        <div class="protocol-step-num">5</div>
        <div class="protocol-step-text">Give anti-stress next 2 days</div>
      </div>
    </div>
    
    <div class="checklist">
      <div class="checklist-title">Completion Checklist</div>
      <label class="checklist-item">
        <input type="checkbox" checked>
        <span class="checklist-item-text">Withheld water for 2-3 hours before vaccination</span>
      </label>
      <label class="checklist-item">
        <input type="checkbox" checked>
        <span class="checklist-item-text">Used dechlorinated water (no chlorine)</span>
      </label>
      <label class="checklist-item">
        <input type="checkbox" checked>
        <span class="checklist-item-text">Mixed vaccine in half of daily water (9 gallons)</span>
      </label>
      <label class="checklist-item">
        <input type="checkbox" checked>
        <span class="checklist-item-text">Birds consumed all vaccine water within 1 hour</span>
      </label>
    </div>
    
    <div class="info-box">
      <div class="info-box-title">🔔 Automatic Follow-Up Tasks</div>
      <div class="info-box-text">
        The system will automatically schedule:<br>
        • Anti-stress vitamins (tomorrow + day after)<br>
        • Multivitamins (day after tomorrow)<br>
        <br>
        These support birds' recovery from vaccination stress.
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Vaccine Cost (GHS) *</label>
      <input type="number" class="form-input" placeholder="Enter vaccine cost..." step="0.01" required>
    </div>
    
    <div class="form-group">
      <label class="form-label">Notes (Optional)</label>
      <textarea class="form-textarea" placeholder="Any observations or issues during vaccination..."></textarea>
    </div>
  </div>
  
  <div class="modal-actions">
    <button class="btn btn-secondary">Cancel</button>
    <button class="btn btn-primary">Complete Vaccination</button>
  </div>
</div>
</body>
</html>
```

### 4. Medication Conflict Warning

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: rgba(0,0,0,0.5); padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.modal { background: white; border-radius: 12px; max-width: 500px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.modal-header { padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 12px; }
.modal-icon { width: 48px; height: 48px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.modal-title { font-size: 18px; font-weight: 600; color: #991b1b; }
.modal-content { padding: 24px; }
.conflict-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.conflict-title { font-size: 14px; font-weight: 600; color: #991b1b; margin-bottom: 12px; }
.conflict-item { display: flex; align-items: start; margin-bottom: 12px; }
.conflict-item:last-child { margin-bottom: 0; }
.conflict-icon { margin-right: 8px; color: #dc2626; }
.conflict-text { font-size: 14px; color: #7f1d1d; line-height: 1.5; }
.suggestion-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; }
.suggestion-title { font-size: 14px; font-weight: 600; color: #166534; margin-bottom: 8px; }
.suggestion-text { font-size: 13px; color: #14532d; line-height: 1.5; }
.modal-actions { padding: 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; }
.btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; flex: 1; }
.btn-secondary { background: #f3f4f6; color: #374151; }
.btn-primary { background: #16a34a; color: white; }
</style>
</head>
<body>
<div class="modal">
  <div class="modal-header">
    <div class="modal-icon">⚠️</div>
    <div class="modal-title">Medication Conflict Detected</div>
  </div>
  
  <div class="modal-content">
    <div class="conflict-box">
      <div class="conflict-title">Cannot Combine These Medications</div>
      <div class="conflict-item">
        <span class="conflict-icon">✕</span>
        <div class="conflict-text">
          <strong>Oxytetracycline (Antibiotic)</strong> conflicts with <strong>Calcium Supplement</strong><br>
          <em>Reason:</em> Calcium binds tetracycline, reduces absorption by 50-80%
        </div>
      </div>
      <div class="conflict-item">
        <span class="conflict-icon">⏱</span>
        <div class="conflict-text">
          <strong>Wait Time Required:</strong> 4 hours minimum between medications
        </div>
      </div>
    </div>
    
    <div class="suggestion-box">
      <div class="suggestion-title">💡 Suggested Timing</div>
      <div class="suggestion-text">
        • Give Oxytetracycline in morning water (8:00 AM)<br>
        • Give Calcium supplement in afternoon water (2:00 PM or later)<br>
        <br>
        This ensures proper absorption of both medications.
      </div>
    </div>
  </div>
  
  <div class="modal-actions">
    <button class="btn btn-secondary">Cancel Task</button>
    <button class="btn btn-primary">Adjust Timing</button>
  </div>
</div>
</body>
</html>
```

### 5. Withdrawal Period Warning

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: rgba(0,0,0,0.5); padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.modal { background: white; border-radius: 12px; max-width: 500px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.modal-header { padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 12px; }
.modal-icon { width: 48px; height: 48px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.modal-title { font-size: 18px; font-weight: 600; color: #991b1b; }
.modal-content { padding: 24px; }
.warning-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.warning-text { font-size: 14px; color: #7f1d1d; line-height: 1.5; margin-bottom: 16px; }
.withdrawal-list { margin-top: 16px; }
.withdrawal-item { background: white; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
.withdrawal-item:last-child { margin-bottom: 0; }
.withdrawal-med { font-size: 14px; font-weight: 600; color: #991b1b; margin-bottom: 4px; }
.withdrawal-info { font-size: 13px; color: #7f1d1d; }
.safe-date-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; }
.safe-date-title { font-size: 14px; font-weight: 600; color: #166534; margin-bottom: 8px; }
.safe-date-text { font-size: 16px; color: #14532d; font-weight: 600; }
.modal-actions { padding: 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; }
.btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; flex: 1; }
.btn-secondary { background: #f3f4f6; color: #374151; }
</style>
</head>
<body>
<div class="modal">
  <div class="modal-header">
    <div class="modal-icon">🚫</div>
    <div class="modal-title">Cannot Terminate Batch</div>
  </div>
  
  <div class="modal-content">
    <div class="warning-box">
      <div class="warning-text">
        <strong>Withdrawal period active.</strong> You cannot sell or consume birds until the withdrawal period ends.
      </div>
      
      <div class="withdrawal-list">
        <div class="withdrawal-item">
          <div class="withdrawal-med">Oxytetracycline (Terramycin)</div>
          <div class="withdrawal-info">
            Last dose: January 10, 2026<br>
            Withdrawal: 7 days<br>
            Days remaining: 4 days
          </div>
        </div>
        <div class="withdrawal-item">
          <div class="withdrawal-med">Sulfadimethoxine (Albon)</div>
          <div class="withdrawal-info">
            Last dose: January 12, 2026<br>
            Withdrawal: 10 days<br>
            Days remaining: 6 days
          </div>
        </div>
      </div>
    </div>
    
    <div class="safe-date-box">
      <div class="safe-date-title">✅ Safe Termination Date</div>
      <div class="safe-date-text">January 22, 2026 (6 days from now)</div>
    </div>
  </div>
  
  <div class="modal-actions">
    <button class="btn btn-secondary">Close</button>
  </div>
</div>
</body>
</html>
```

---

## Backend Integration

### Database Models

#### WaterHealthPreferences Model

```python
class WaterHealthPreferences(Base):
    __tablename__ = "water_health_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Measurement preferences
    volume_unit = Column(String(20), default="gallons", nullable=False)  # gallons, liters, containers
    container_type = Column(String(50), nullable=True)  # bell_6L, bucket_20L, drum_50L, custom
    custom_container_volume_liters = Column(Float, nullable=True)  # For custom containers
    
    # Display preferences
    show_both_units = Column(Boolean, default=False)  # Show "6 tbsp per 4 gallons (15L)"
    show_costs = Column(Boolean, default=True)
    show_traditional_options = Column(Boolean, default=True)  # For Duck/Turkey
    
    # Notification preferences
    remind_daily_tasks = Column(Boolean, default=True)
    alert_low_stock = Column(Boolean, default=True)
    notify_withdrawal_end = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="water_health_preferences")
```

#### HealthTask Model

```python
class HealthTask(Base):
    __tablename__ = "health_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    
    # Task details
    task_type = Column(String(50), nullable=False)  # vaccination, medication, deworming, anti_stress, traditional_remedy
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=True)
    medication_name = Column(String(100), nullable=False)
    
    # Scheduling
    scheduled_date = Column(Date, nullable=False, index=True)
    scheduled_week = Column(Integer, nullable=False)  # Batch week when task scheduled
    
    # Dosage (calculated at task creation)
    population_at_creation = Column(Integer, nullable=False)
    water_liters = Column(Float, nullable=False)
    water_gallons = Column(Float, nullable=False)
    dose_tbsp = Column(Float, nullable=False)
    display_text = Column(String(200), nullable=False)  # "Coccidiostat - 6 tbsp per 4 gallons (15L)"
    
    # Treatment details
    treatment_duration_days = Column(Integer, nullable=True)  # For multi-day treatments
    treatment_day = Column(Integer, nullable=True)  # Day 1 of 5, Day 2 of 5, etc.
    
    # Completion
    status = Column(String(20), default="pending", nullable=False)  # pending, completed, skipped
    completed_at = Column(DateTime, nullable=True)
    completed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    completion_notes = Column(Text, nullable=True)
    
    # Withdrawal tracking
    withdrawal_days_meat = Column(Integer, nullable=True)
    withdrawal_days_eggs = Column(Integer, nullable=True)
    safe_date_meat = Column(Date, nullable=True)
    safe_date_eggs = Column(Date, nullable=True)
    
    # Cost tracking
    cost = Column(Float, nullable=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=True)  # Auto-created expense
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    batch = relationship("Batch", back_populates="health_tasks")
    medication = relationship("Medication")
    completed_by_user = relationship("User")
    expense = relationship("Expense")
```

#### Medication Model

```python
class Medication(Base):
    __tablename__ = "medications"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    name = Column(String(100), nullable=False, index=True)
    active_ingredient = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # coccidiostat, antibiotic, anthelmintic, vitamin, anti_stress, traditional
    
    # Dosage
    dose_per_gallon = Column(String(50), nullable=False)  # "1-2 tsp", "1 tbsp", "Per label"
    treatment_duration_days = Column(Integer, nullable=True)
    
    # Withdrawal periods
    withdrawal_meat_days = Column(Integer, default=0)
    withdrawal_eggs_days = Column(Integer, default=0)
    
    # Safety
    species_restrictions = Column(JSON, nullable=True)  # {"broiler": true, "layer": false, "duck": true, "turkey": true}
    conflicts_with = Column(JSON, nullable=True)  # ["calcium", "chlorinated_water"]
    
    # Traditional remedy specific
    is_traditional = Column(Boolean, default=False)
    preparation_instructions = Column(Text, nullable=True)
    
    # Stock tracking
    current_stock_grams = Column(Float, default=0)
    unit_cost_per_gram = Column(Float, nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

#### WithdrawalPeriod Model

```python
class WithdrawalPeriod(Base):
    __tablename__ = "withdrawal_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    health_task_id = Column(Integer, ForeignKey("health_tasks.id"), nullable=False)
    
    # Medication details
    medication_name = Column(String(100), nullable=False)
    last_dose_date = Column(Date, nullable=False)
    
    # Withdrawal periods
    withdrawal_meat_days = Column(Integer, nullable=False)
    withdrawal_eggs_days = Column(Integer, nullable=False)
    safe_date_meat = Column(Date, nullable=False, index=True)
    safe_date_eggs = Column(Date, nullable=False, index=True)
    
    # Status
    status = Column(String(20), default="active", nullable=False)  # active, expired
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    batch = relationship("Batch", back_populates="withdrawal_periods")
    health_task = relationship("HealthTask")
```

### API Endpoints

#### Setup & Preferences

**POST /api/v1/water-health/setup**

- Create initial water-health preferences
- Request: `{volume_unit, container_type, show_both_units, show_traditional_options}`
- Response: `{preferences}`

**GET /api/v1/water-health/preferences**

- Get user's water-health preferences
- Response: `{preferences}`

**PUT /api/v1/water-health/preferences**

- Update water-health preferences
- Request: `{volume_unit, container_type, ...}`
- Response: `{preferences}`

#### Tasks

**GET /api/v1/water-health/tasks/today**

- Get today's health tasks for all batches
- Response: `{tasks: [{task_id, batch, medication, dosage, status}]}`

**GET /api/v1/water-health/tasks/batch/{batch_id}**

- Get all health tasks for a batch
- Query params: `status` (pending, completed, all)
- Response: `{tasks: [{task_id, medication, scheduled_date, dosage, status}]}`

**POST /api/v1/water-health/tasks/{task_id}/complete**

- Mark health task as completed
- Request: `{completion_notes, checklist_items}`
- Response: `{task, expense_created, stock_updated, withdrawal_period}`

**POST /api/v1/water-health/tasks/{task_id}/skip**

- Skip a health task
- Request: `{reason}`
- Response: `{task}`

#### Medications

**GET /api/v1/water-health/medications**

- Get all medications
- Query params: `category`, `species`, `include_traditional`
- Response: `{medications: [{id, name, category, dosage, withdrawal}]}`

**POST /api/v1/water-health/medications/check-conflict**

- Check if two medications conflict
- Request: `{medication_a_id, medication_b_id, batch_id}`
- Response: `{conflict: boolean, message, wait_time}`

**GET /api/v1/water-health/medications/{medication_id}/calculate**

- Calculate dosage for a batch
- Query params: `batch_id`
- Response: `{population, water_liters, water_gallons, dose_tbsp, display_text}`

#### Withdrawal Periods

**GET /api/v1/water-health/withdrawal/batch/{batch_id}**

- Get active withdrawal periods for a batch
- Response: `{withdrawal_periods: [{medication, last_dose, safe_date_meat, safe_date_eggs, days_remaining}]}`

**GET /api/v1/water-health/withdrawal/batch/{batch_id}/can-terminate**

- Check if batch can be terminated (no active withdrawals)
- Response: `{can_terminate: boolean, safe_date, blocking_medications}`

### Calculation Service

```python
class WaterHealthCalculationService:
    """Calculate medication dosages based on species, age, and population"""
    
    # Water consumption lookup (ml per bird per day)
    WATER_TABLE = {
        'broiler': {1: 50, 2: 100, 3: 150, 4: 200, 5: 250, 6: 250},
        'layer': {1: 50, 2: 50, 3: 100, 4: 100, 5: 150, 6: 150, 7: 150, 8: 150, 
                  9: 200, 10: 200, 11: 200, 12: 200, 13: 200, 14: 200, 15: 200, 16: 300},
        'duck': {1: 150, 2: 150, 3: 250, 4: 250, 5: 400, 6: 400, 7: 400, 8: 400},
        'turkey': {1: 100, 2: 100, 3: 200, 4: 200, 5: 200, 6: 200, 7: 300, 8: 300,
                   9: 300, 10: 300, 11: 400, 12: 400, 13: 400, 14: 400, 15: 500}
    }
    
    def calculate_medication_dosage(self, batch: Batch, user_prefs: WaterHealthPreferences) -> dict:
        """Calculate medication dosage with user's preferred display units"""
        current_pop = batch.current_population
        water_per_bird = self.WATER_TABLE[batch.species][batch.age_weeks]
        
        # Always calculate in liters internally
        daily_water_liters = (water_per_bird * current_pop) / 1000
        gallons = daily_water_liters / 3.785
        tablespoons = gallons * 1.5  # Standard formula
        
        # Format based on user preference
        display = self._format_display(tablespoons, daily_water_liters, user_prefs)
        
        return {
            'population': current_pop,
            'water_liters': round(daily_water_liters, 1),
            'water_gallons': round(gallons, 1),
            'dose_tbsp': round(tablespoons, 1),
            'display': display,
            'unit_preference': user_prefs.volume_unit
        }
    
    def calculate_vaccination_water(self, batch: Batch, user_prefs: WaterHealthPreferences) -> dict:
        """Calculate vaccination water (half of daily)"""
        daily = self.calculate_medication_dosage(batch, user_prefs)
        
        return {
            'water_liters': daily['water_liters'] / 2,
            'water_gallons': daily['water_gallons'] / 2,
            'dose_tbsp': daily['dose_tbsp'] / 2,
            'display': self._format_vaccination_display(daily, user_prefs)
        }
    
    def _format_display(self, tablespoons: float, water_liters: float, user_prefs: WaterHealthPreferences) -> str:
        """Format medication display based on user's preferred unit"""
        unit_pref = user_prefs.volume_unit
        
        if unit_pref == 'liters':
            return f"{round(tablespoons)} tbsp per {round(water_liters)} liters"
        
        elif unit_pref == 'containers' and user_prefs.container_type:
            container = CONTAINER_TYPES.get(user_prefs.container_type)
            if container and container['volume_liters']:
                num_containers = water_liters / container['volume_liters']
                tbsp_per_container = tablespoons / num_containers
                
                if num_containers >= 1:
                    return f"{round(tbsp_per_container, 1)} tbsp per {container['name']}"
                else:
                    return f"{round(tablespoons)} tbsp in {round(water_liters)}L water"
        
        else:  # Default: gallons
            gallons = water_liters / 3.785
            return f"{round(tablespoons)} tbsp per {round(gallons, 1)} gallons"
```

### Configuration Files

#### medications.json

**Location:** `backend/config/medications.json`

**Purpose:** Complete medication database with dosages, withdrawal periods, conflicts, and West African context

**Structure:**

```json
{
  "coccidiostats": [
    {
      "id": "amprolium",
      "name": "Amprolium",
      "brand_names_ghana": ["Amprol", "Corid"],
      "brand_names_nigeria": ["Amprolium 20%"],
      "category": "coccidiostat",
      "dose_per_gallon": "1-2 tsp",
      "treatment_duration_days": 5,
      "withdrawal_meat_days": 0,
      "withdrawal_eggs_days": 0,
      "species_restrictions": {"broiler": true, "layer": true, "duck": true, "turkey": true},
      "conflicts_with": [],
      "cost_per_100g_ghs": 30,
      "cost_per_100g_ngn": 3000,
      "notes": "Most common coccidiostat, FDA approved, minimal withdrawal"
    }
    // ... 7 more coccidiostats
  ],
  "antibiotics": [
    // ... 15 antibiotics (Oxytetracycline, Tylosin, Enrofloxacin, etc.)
  ],
  "anthelmintics": [
    // ... 6 dewormers (Fenbendazole, Piperazine, Levamisole, etc.)
  ],
  "vitamins": [
    // ... 13 vitamins/supplements
  ],
  "antifungals": [
    // ... 4 antifungals (Nystatin, Copper Sulfate, etc.)
  ],
  "traditional_remedies": [
    {
      "id": "moringa",
      "name": "Moringa Leaf Powder",
      "category": "traditional",
      "purpose": "Immune boost, nutrition",
      "preparation": "Dry leaves, grind to powder",
      "dose_per_gallon": "1 tbsp",
      "duration_days": 5,
      "withdrawal_meat_days": 0,
      "withdrawal_eggs_days": 0,
      "species_restrictions": {"broiler": false, "layer": false, "duck": true, "turkey": true},
      "notes": "Rich in vitamins A, C, E"
    }
    // ... 6 more traditional remedies
  ]
}
```

**Usage:**

- ConfigService loads medications.json at startup
- Database can override with custom medications
- Hybrid approach: JSON defaults + database overrides

---

## Event-Driven Integration

### Event Types

```python
class HealthEventType(str, Enum):
    HEALTH_TASK_COMPLETED = "health_task_completed"
    VACCINATION_COMPLETED = "vaccination_completed"
    MEDICATION_STARTED = "medication_started"
    WITHDRAWAL_PERIOD_STARTED = "withdrawal_period_started"
    WITHDRAWAL_PERIOD_ENDED = "withdrawal_period_ended"
```

### Event Payloads

```python
@dataclass
class HealthTaskCompletedEvent:
    event_type: HealthEventType = HealthEventType.HEALTH_TASK_COMPLETED
    task_id: int
    batch_id: int
    medication_name: str
    medication_category: str
    cost: float
    stock_used_grams: float
    withdrawal_days_meat: int
    withdrawal_days_eggs: int
    safe_date_meat: date
    safe_date_eggs: date
    timestamp: datetime = field(default_factory=datetime.utcnow)
```

### Integration Flows

#### 1. Health Task Completion → Automatic Expense Creation

```
USER ACTION: Complete health task

1. HealthTaskGenerationService.complete_task(task_id)
   ↓
2. Calculate cost (medication_grams × cost_per_gram)
   ↓
3. Publish HEALTH_TASK_COMPLETED event
   ↓
4. UnifiedExpenseService handler (Automatic pattern only)
   - Create expense record
   - Category: "Health & Medication"
   - Link to batch
   - Link to health task
   ↓
5. StorageIntegrationService handler (Automatic pattern only)
   - Update medication stock
   - Deduct grams used
   ↓
6. WithdrawalService handler
   - Create withdrawal period record
   - Set safe dates
   ↓
7. Return success with expense_id, stock_updated, withdrawal_period
```

#### 2. Vaccination Completion → Auto-Schedule Anti-Stress

```
USER ACTION: Complete vaccination task

1. HealthTaskGenerationService.complete_vaccination(task_id)
   ↓
2. Publish VACCINATION_COMPLETED event
   ↓
3. HealthTaskGenerationService handler
   - Auto-schedule anti-stress (tomorrow + day after)
   - Auto-schedule multivitamins (day after tomorrow)
   ↓
4. UnifiedExpenseService handler (Automatic pattern only)
   - Create vaccine expense
   ↓
5. Return success with follow_up_tasks scheduled
```

#### 3. Withdrawal Period End → Notification

```
SCHEDULED JOB: Check withdrawal periods daily

1. WithdrawalService.check_expiring_withdrawals()
   ↓
2. Find withdrawal periods ending today
   ↓
3. Publish WITHDRAWAL_PERIOD_ENDED event
   ↓
4. NotificationService handler
   - Send notification to farmer
   - "Batch X is now safe to sell/consume"
   ↓
5. Update withdrawal_period.status = "expired"
```

### Dual Feed Pattern Integration

**Automatic (Intensive) Pattern:**

- Health task completion → Auto-create expense
- Health task completion → Auto-update stock
- Full dovetail integration

**Flexible (Semi-Intensive) Pattern:**

- Health task completion → Manual expense entry
- Health task completion → Manual stock update
- No automatic integration

**Implementation:**

```python
def complete_health_task(task_id: int, batch: Batch):
    # Complete task
    task = health_task_repo.get(task_id)
    task.status = "completed"
    task.completed_at = datetime.utcnow()
    
    # Publish event
    event = HealthTaskCompletedEvent(
        task_id=task.id,
        batch_id=batch.id,
        medication_name=task.medication_name,
        cost=task.cost,
        ...
    )
    
    # Event handlers check production_system
    if batch.production_system == "intensive":
        # Automatic pattern - handlers execute
        event_bus.publish(event)
    else:
        # Flexible pattern - handlers skip
        # Farmer handles expense/stock manually
        pass
    
    return task
```

---

## Acceptance Criteria

### Functional Requirements

**Container-Based Medication Delivery:**

- [ ] User can select preferred volume unit (gallons, liters, containers)
- [ ] User can select container type (10 container types + custom)
- [ ] Medication dosages display in user's preferred unit
- [ ] Dosages recalculate automatically when population changes
- [ ] Display format matches user preference exactly

**Medication Database:**

- [ ] 20+ medications in database (coccidiostats, antibiotics, dewormers, vitamins)
- [ ] Each medication has dosage, treatment duration, withdrawal periods
- [ ] Local product names (Ghana/Nigeria) included
- [ ] Cost reference data included

**Medication Conflict Matrix:**

- [ ] 5 critical conflicts detected (charcoal, calcium, sulfa, live vaccines)
- [ ] Conflict detection blocks task creation
- [ ] Farmer-friendly error messages shown
- [ ] Alternative timing suggested

**Withdrawal Period Tracking:**

- [ ] Withdrawal periods created automatically on task completion
- [ ] Safe dates calculated correctly (last_dose + withdrawal_days)
- [ ] Batch termination blocked during active withdrawal
- [ ] Warning shown with safe date and blocking medications

**Species-Specific Protocols:**

- [ ] Water consumption tables for 4 species (broilers, layers, ducks, turkeys)
- [ ] Heat stress adjustments (1.0x to 3.0x multipliers)
- [ ] Duck niacin supplementation (CRITICAL - 1.5 tsp/gallon)
- [ ] Turkey higher water consumption (1.5-2x chickens)

**Traditional Remedies:**

- [ ] 7 traditional remedies available (moringa, garlic, vinegar, ginger, turmeric, neem, charcoal)
- [ ] Traditional remedies ONLY for ducks/turkeys
- [ ] Traditional remedies NOT available for broilers/layers
- [ ] Preparation instructions shown
- [ ] Dosage and duration specified

**Event-Driven Integration:**

- [ ] Health task completion → Auto-create expense (Automatic pattern)
- [ ] Health task completion → Auto-update stock (Automatic pattern)
- [ ] Vaccination completion → Auto-schedule anti-stress
- [ ] Withdrawal period end → Notification sent

**Dual Feed Pattern Integration:**

- [ ] Automatic pattern: Full dovetail integration
- [ ] Flexible pattern: Manual expense/stock entry
- [ ] Production system determines integration behavior

### Performance Requirements

- [ ] Medication dosage calculation < 100ms
- [ ] Conflict detection < 200ms
- [ ] Task completion (with events) < 500ms
- [ ] Daily task generation < 2 seconds (all batches)

### UI/UX Requirements

- [ ] Setup wizard completes in 3 steps
- [ ] Weekly task dashboard loads in < 1 second
- [ ] Task completion modal has checklist
- [ ] Conflict warning shows clear error message
- [ ] Withdrawal warning blocks termination with safe date

### Integration Requirements

- [ ] Finance system receives expense events
- [ ] Stock system receives inventory update events
- [ ] Batch system receives task completion events
- [ ] Notification system receives withdrawal end events

---

## Implementation Notes

### Existing Files to Modify

**Backend:**

- `backend/app/models/batch.py` - Add `current_population` property
- `backend/app/models/system.py` - Add `WaterHealthPreferences`, `HealthTask`, `Medication`, `WithdrawalPeriod` models
- `backend/app/services/` - Add `WaterHealthCalculationService`, `HealthTaskGenerationService`
- `backend/app/api/v1/` - Add `water_health.py` router

**Frontend:**

- `frontend/src/pages/` - Add `water-health-setup-page.tsx`, `water-health-dashboard-page.tsx`
- `frontend/src/components/water-health/` - Add task cards, completion modals, conflict warnings
- `frontend/src/services/` - Add `waterHealthService.ts`

### New Files to Create

**Backend:**

- `backend/app/services/water_health_calculation_service.py`
- `backend/app/services/health_task_generation_service.py`
- `backend/app/services/withdrawal_service.py`
- `backend/app/api/v1/water_health.py`
- `backend/config/medications.json` - Medication database
- `backend/config/container_types.json` - Container configurations

**Frontend:**

- `frontend/src/pages/water-health-setup-page.tsx`
- `frontend/src/pages/water-health-dashboard-page.tsx`
- `frontend/src/components/water-health/task-card.tsx`
- `frontend/src/components/water-health/vaccination-completion-modal.tsx`
- `frontend/src/components/water-health/medication-completion-modal.tsx`
- `frontend/src/components/water-health/conflict-warning-modal.tsx`
- `frontend/src/components/water-health/withdrawal-warning-modal.tsx`
- `frontend/src/components/water-health/traditional-remedy-selector.tsx`
- `frontend/src/services/waterHealthService.ts`

---

## References

- **Priest Research:** file:priest/10-water-health-calculator-visual-ux/
- **Old Spec:** docs/priest new/specs/Water-Health_System_-*Production-Grade_Specification*(Old_Spec_Approach_+_Priest_Research).md
- **Backend Architecture:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/35142770-c1b0-4df2-85e2-5a839616334a
- **Frontend Architecture:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/9e3bb05f-9ca8-4cc6-9f97-a5d0eb53ae92
- **Batch Management System:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/c18bcbcb-e4da-43cc-b5cd-5e27c2e4ed1f
- **Epic Brief:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2c73a304-598c-472c-b79c-20584f6dc34b

---

**End of Water-Health System Specification**