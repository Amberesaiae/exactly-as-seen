# Canonical Implementation Plan: Production-Grade Upgrade

This document outlines the structured, phased approach to upgrading the Lampfarms platform to the "Production-Grade" specifications (West African context).

## Core Philosophy
- **Lean Engineering:** Leverage the existing Supabase + React + Zustand stack.
- **Guidance over Enforcement:** Move away from hard-coded multipliers and mandatory injections. Instead, provide data-backed **Cautions**, **Lean Tips**, and **Quick Add** suggestions.
- **Data-Driven:** Inject intelligence via static TypeScript files rather than complex database migrations where possible.
- **Event-Driven:** Use Zustand store actions to mimic the "Dovetail Synergy" (cross-module orchestration).

---

## Phase 1: The Intelligence Core (Data Expansion)
**Goal:** Port the comprehensive agricultural data from the specs into the application.

### 1.1 Expand Ingredients Database (`src/lib/feed-data.ts`)
- **Action:** Expand `INGREDIENTS` array to the full 41 items.
- **New Fields:** Add `fiber`, `niacin`, `lysine`, `methionine`, `phosphorus`.
- **Key Additions:** BSF Larvae, Azolla, Palm Kernel Cake, Blood Meal, Cassava (HQCP only).

### 1.2 Expand Medications & Protocols (`src/lib/health-data.ts`)
- **Action:** Expand `MEDICATION_TEMPLATES` to the full 52 items, including 7 Traditional Remedies (Garlic, Neem, Aloe).
- **New Fields:** Add `withdrawal_meat_days`, `withdrawal_eggs_days`, `container_dosage_rules`.
- **Action:** Expand `VACCINATION_TEMPLATES` to cover the full 36 protocols for Broilers, Layers, Ducks, and Turkeys.

---

## Phase 2: Advanced Business Logic & Calculators
**Goal:** Implement the strict safety rules and advanced calculators.

### 2.1 West African Safety Preprocessor (`src/lib/feed-safety.ts`)
- **Action:** Implement **Lean Safety Suggestions** for Toxin Binder (0.1%) when maize/groundnut risk is detected.
- **Action:** Implement species-specific blocking logic:
  - Block Cotton Seed Cake for Layers (Quality issue).
  - Block Raw Cassava entirely (Fatal safety).
  - Enforce Niacin >= 55mg/kg for Ducks (Guidance).

### 2.2 LP Solver Infeasibility Analysis (`src/lib/feed-lp.ts`)
- **Action:** Upgrade the solver logic to return actionable advice (e.g., "Add Soybean Meal") when formulation fails, rather than a generic error.

### 2.3 Container-Based Dosing & Heat Stress (`src/lib/dosing-utils.ts`)
- **Action:** Implement pragmatic heat stress multipliers (capped at 1.5x).
- **Action:** Return extreme relations (2.0x-3.0x) as **Heat Stress Cautions** rather than forced guideline values.
- **Action:** Implement logic to convert 'ml/bird' into 'tablespoons per container'.

### 2.4 Medication Conflict Engine (`src/lib/medication-conflicts.ts`)
- **Action:** RESERVED BLOCKS: Only block for fatal or biologically incompatible risks (e.g., Live Vaccine + Chlorine).
- **Action:** TIMING WARNS: Move timing issues (Charcoal/Calcium) to **Warnings** with explicit wait-time advice (2-4 hours).

---

## Phase 3: "Dovetail Synergy" (Cross-Module Orchestration)
**Goal:** Automate financial and stock tracking based on user actions.

### 3.1 Store Orchestration (`src/stores/useAppStore.ts`)
- **Action:** Create "Action Thunks" that span multiple domains.
- **Feed → Finance:** When `confirmFeedFormulation` is called, automatically dispatch `addExpense` (Category: Feed) and `deductStock`.
- **Health → Finance:** When `completeHealthTask` is called, automatically dispatch `addExpense` (Category: Health) and initiate a `WithdrawalTimer`.
- **Sales → Finance:** When `recordSale` is called, automatically dispatch `addRevenue` and `reduceBatchPopulation`.

---

## Phase 4: UX Utilities & Refinements
**Goal:** Implement the UI features required by the production specs.

### 4.1 Cost Privacy Toggle
- **Action:** Implement a global Zustand state `isCostPrivacyEnabled`.
- **Action:** Create a `<PrivacyMask />` component that replaces GHS values with `●●●●` when enabled.

### 4.2 Alternative Feeding Toggle (Ducks/Turkeys)
- **Action:** Add a UI toggle in the Batch Settings for "Semi-Intensive/Free-Range".
- **Action:** Show a **Lean Logic Target** as a recommended option (12-25% reduction) rather than an automatic reduction.

### 4.3 Withdrawal Locks
- **Action:** Prevent the UI from allowing "Terminate Batch" or "Record Sale" if a medication withdrawal period is active.
