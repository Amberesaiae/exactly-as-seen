

# LampFarms -- Comprehensive Ticket Plan

After auditing all 10 spec documents against the current codebase, here is every gap, bug, and missing feature organized into implementation tickets.

---

## Current State Summary

What exists: Welcome, Register, Login (with Google OAuth), Farm Setup wizard (3 steps), Dashboard (stat cards, batch tiles, charts, activity panel), App Shell (sidebar + mobile nav), Dexie.js schema + sync service, Zustand store, SyncIndicator, all placeholder pages, profiles table with trigger, RLS policies on all tables.

What is broken or incomplete: The `handle_new_user` trigger exists but `update_updated_at_column` trigger is defined as a function with no trigger attached to any table. The sync service (`sync.ts`) exists but Dashboard does not use it. Cost privacy persists to DB but Dashboard does not use Dexie cache. No password reset flow exists.

---

## TICKET 1: Fix Database Triggers + Schema Gaps

**Problem**: `update_updated_at_column()` function exists but is not attached as a trigger to any table. The `farms`, `houses`, `batches`, `user_preferences`, `profiles` tables all have `updated_at` columns but never auto-update them.

**Work**:
- Migration: Create triggers on `farms`, `houses`, `batches`, `user_preferences`, `profiles` tables that call `update_updated_at_column()` on UPDATE.

---

## TICKET 2: Wire Offline-First Sync Into Dashboard

**Problem**: `sync.ts` has `cacheFarms`, `cacheBatches`, `cacheHouses`, `cacheActivities` functions but Dashboard.tsx calls Supabase directly and never uses Dexie.

**Work**:
- Refactor `Dashboard.tsx` data loading to:
  1. Try Supabase first (online path), cache results into Dexie via `sync.ts`
  2. If offline or Supabase fails, read from Dexie cache
  3. Set `isSyncing` in Zustand during sync operations
- Same pattern for FarmSetup.tsx -- cache farm/houses data after setup completes

---

## TICKET 3: Password Reset Flow

**Problem**: No forgot password / reset password pages exist. The Login page has no "Forgot password?" link.

**Work**:
- Create `src/pages/ForgotPassword.tsx` -- email input, calls `supabase.auth.resetPasswordForEmail` with `redirectTo: window.location.origin + '/reset-password'`
- Create `src/pages/ResetPassword.tsx` -- checks for `type=recovery` in URL hash, shows new password form, calls `supabase.auth.updateUser({ password })`
- Add route `/forgot-password` (public) and `/reset-password` (public) to App.tsx
- Add "Forgot password?" link to Login.tsx

---

## TICKET 4: Batch Management System (Full Build)

**Problem**: `/batches` is a placeholder page. The spec defines a complete batch management system.

**Database migration** -- add columns/tables as needed:
- `mortality_records` table: `id`, `batch_id`, `farm_id`, `count`, `cause`, `notes`, `recorded_at`
- `batch_tasks` table: `id`, `batch_id`, `farm_id`, `task_type`, `title`, `description`, `due_date`, `completed`, `completed_at`
- Add Dexie schema entries for new tables

**Pages/Components**:
- `src/pages/Batches.tsx` -- Batch list page
  - Filter bar: species dropdown (broiler/layer/duck/turkey), status filter (active/completed/all)
  - Grid of batch cards showing: name, species, phase, population, week/day, pending tasks
  - "New Batch" button opens creation wizard
- `src/pages/BatchCreate.tsx` -- 3-step creation wizard
  - Step 1: Species, batch name, production system (intensive/semi-intensive), quantity, start date
  - Step 2: Assign house (from user's houses), notes
  - Step 3: Review and confirm
  - On create: insert batch, log activity, navigate to batch detail
- `src/pages/BatchDetail.tsx` -- Batch detail page with tabs
  - **Overview tab**: Population tracker (initial vs current), mortality rate %, days/weeks counter, phase indicator, assigned house
  - **Feed tab**: Placeholder linking to feed system (show "Feed schedule for this batch" card)
  - **Health tab**: Placeholder linking to health system
  - **Mortality tab**: Record mortality (count + cause + notes), mortality history list, cumulative chart
  - **Notes tab**: Free-text notes, chronological list
- Batch status management: active, completed (with completion date)
- Quick actions on batch cards: View, Record Mortality (opens modal)
- Wire batch count into Dashboard stat card

**Routes**: `/batches`, `/batches/new`, `/batches/:id`

---

## TICKET 5: Feed Calculator System (Full Build)

**Problem**: `/feed` is a placeholder. Spec defines a feed calculator with species-specific formulas.

**Database migration**:
- `feed_formulations` table: `id`, `farm_id`, `batch_id`, `species`, `phase`, `population`, `bags_count`, `bag_size_kg`, `total_kg`, `formulation_type` (quick/guided/free), `created_at`
- `feed_ingredients` table: `id`, `formulation_id`, `category` (energy/protein/calcium/supplement), `name`, `quantity_kg`, `unit_price`, `total_cost`
- `feed_schedules` table: `id`, `batch_id`, `farm_id`, `week`, `day`, `amount_per_bird_g`, `total_amount_kg`, `completed`, `completed_at`

**Pages/Components**:
- `src/pages/Feed.tsx` -- Feed main page
  - Active batch selector
  - Current feed schedule card (today's feeding)
  - Feed history list
- `src/pages/FeedFormulation.tsx` -- Custom formulation page
  - 3 modes: Quick Recipe (LP Optimize), Flexible Mix (Guided), Free Mix (Warnings Only)
  - Ingredient selection by category (energy, protein, calcium, supplements)
  - Safety rules engine: auto-add toxin binder with maize/groundnut, niacin for ducks, block cotton seed for layers, fish meal <= 10% for broilers, single calcium source only
  - Planning target: bags x bag size = total kg
  - Cost calculation with cost privacy masking
  - Nutrition analysis panel showing protein %, energy kcal, calcium %
- Species-specific feed data (hardcoded reference tables):
  - Broiler: starter (0-2wk), grower (3-5wk), finisher (6-8wk)
  - Layer: chick (0-8wk), grower (9-18wk), layer (19+wk)
  - Duck: starter (0-3wk), grower (4-7wk), finisher/layer (8+wk)
  - Turkey: starter (0-4wk), grower (5-12wk), finisher (13-20wk)

**Routes**: `/feed`, `/feed/formulate`

---

## TICKET 6: Water & Health System (Full Build)

**Problem**: `/health` is a placeholder. Spec defines medication protocols, vaccination schedules, and water management.

**Database migration**:
- `health_tasks` table: `id`, `batch_id`, `farm_id`, `task_type` (vaccination/medication/supplement), `product_name`, `dose_per_gallon`, `duration_days`, `withdrawal_meat_days`, `withdrawal_egg_days`, `scheduled_date`, `completed`, `completed_at`, `notes`
- `water_records` table: `id`, `batch_id`, `farm_id`, `date`, `gallons_consumed`, `temperature_c`, `notes`
- `vaccination_schedule` table: `id`, `batch_id`, `farm_id`, `vaccine_name`, `scheduled_week`, `scheduled_date`, `administered`, `administered_at`

**Pages/Components**:
- `src/pages/Health.tsx` -- Health main page
  - Today's health tasks card (due vaccinations, medications)
  - Active medication tracker (with withdrawal countdown)
  - Water consumption log
- Medication database (hardcoded reference):
  - Container-based dosing (gallons, tablespoons) per spec
  - Withdrawal periods for meat and eggs
  - Species-specific protocols (duck niacin requirement, etc.)
- Vaccination schedule generator based on species and start date
- Withdrawal period warnings with "safe to sell" date calculation
- Egg withdrawal tracking for layers (discard eggs count)

**Routes**: `/health`, `/health/schedule/:batchId`

---

## TICKET 7: Egg Production System (Full Build)

**Problem**: `/eggs` is a placeholder. Spec defines egg tracking for layers, ducks, turkeys.

**Database migration**:
- `egg_records` table: `id`, `batch_id`, `farm_id`, `date`, `total_eggs`, `broken`, `dirty`, `good`, `size_category` (small/medium/large), `notes`
- `egg_sales` table: `id`, `farm_id`, `date`, `quantity`, `size_category`, `unit_price`, `total_amount`, `buyer`, `notes`

**Pages/Components**:
- `src/pages/Eggs.tsx` -- Egg production page
  - Daily collection form (total, broken, dirty, by size)
  - Production rate % display (eggs / population * 100)
  - Weekly/monthly production chart
  - Egg sales recording
- Production schedule reference (hardcoded):
  - Layer: rearing (1-18wk 0%), pre-lay (16-18wk 0-5%), early (19-25wk 60-80%), peak (26-52wk 85-95%), late (53-65wk 70-85%), end (66-78wk 50-70%)
  - Duck: rearing (1-20wk 0%), early (21-28wk 50-70%), peak (29-40wk 80-90%), late (41-48wk 60-75%)
- Expected vs actual production comparison
- Withdrawal period integration (eggs to discard during medication)

**Routes**: `/eggs`, `/eggs/record`

---

## TICKET 8: Finance System (Full Build)

**Problem**: `/finance` is a placeholder. Spec defines expense tracking, revenue, and profit/loss.

**Database migration**:
- `expenses` table: `id`, `farm_id`, `batch_id`, `category`, `description`, `amount`, `date`, `source` (manual/auto), `source_ref`, `created_at`
- `revenue` table: `id`, `farm_id`, `batch_id`, `category` (bird_sales/egg_sales/other), `description`, `amount`, `date`, `buyer`, `created_at`

**Pages/Components**:
- `src/pages/Finance.tsx` -- Finance main page
  - Summary cards: Total Expenses, Total Revenue, Net Profit/Loss (all masked by cost privacy)
  - Expense breakdown by category (9 categories per spec: Feed, Health, Labor, Utilities, Equipment, Transport, Housing, Chicks, Other)
  - Revenue breakdown
  - Date range filter
- Manual expense entry modal with category picker
- Manual revenue entry modal
- Auto-recorded expenses from: feed calculator, stock purchases, health task completions, batch creation costs
- Monthly P&L chart (Recharts)
- Per-batch profitability view
- All financial values respect cost privacy toggle

**Routes**: `/finance`, `/finance/expense/new`, `/finance/revenue/new`

---

## TICKET 9: Stock Management System (Full Build)

**Problem**: `/stock` is a placeholder. Spec defines inventory tracking with reorder alerts.

**Database migration**:
- `stock_items` table: `id`, `farm_id`, `category` (feed_ingredients/medications/vaccines/supplements/equipment), `name`, `unit`, `current_quantity`, `reorder_threshold`, `unit_price`, `updated_at`
- `stock_transactions` table: `id`, `stock_item_id`, `farm_id`, `transaction_type` (purchase/usage/adjustment), `quantity`, `unit_price`, `total_cost`, `date`, `notes`, `source_ref`, `created_at`

**Pages/Components**:
- `src/pages/Stock.tsx` -- Stock main page
  - Low stock alerts banner (items below reorder threshold)
  - Category tabs: Feed Ingredients, Medications, Vaccines, Supplements, Equipment
  - Item cards with current quantity, unit, reorder threshold
  - Record Purchase modal (item, quantity, unit price, date)
  - Usage deduction (manual or auto from feed/health systems)
- Stock categories per spec:
  - Feed: bags (50kg) -- maize, soybean, fish meal, PKC, wheat bran
  - Medications: grams/ml -- amprolium, oxytetracycline, tylosin, fenbendazole
  - Vaccines: vials -- Gumboro, HB1, Lasota, Fowl Pox, Duck Hepatitis
  - Supplements: grams -- multivitamins, electrolytes, glucose, calcium, probiotics
  - Equipment: units -- feeders, drinkers, cages, tools

**Routes**: `/stock`, `/stock/purchase`

---

## TICKET 10: Records & Analytics System (Full Build)

**Problem**: `/records` is a placeholder. Spec defines a read-only analytics hub.

**Pages/Components**:
- `src/pages/Records.tsx` -- Records page with 4 tabs
  - **Batch Overview tab**: List of all batches (active + completed), sortable by date/species/status
  - **Performance tab**: FCR (feed conversion ratio), mortality rate, growth rate per batch
  - **Financial tab**: Per-batch cost breakdown, revenue, profit/loss (masked by cost privacy)
  - **Compare tab**: Select 2 batches side-by-side, compare metrics
- Filter sidebar: species, status, date range
- Export Records button (CSV download)
- All data is read-only -- aggregated from other systems

**Routes**: `/records`

---

## TICKET 11: Settings Page (Full Build)

**Problem**: `/settings` is a placeholder.

**Pages/Components**:
- `src/pages/SettingsPage.tsx`
  - **Profile section**: Full name, email (read-only), avatar upload
  - **Farm section**: Edit farm name, region, district
  - **Houses section**: Add/edit/delete houses
  - **Preferences section**: Currency, cost privacy toggle, theme (light/dark)
  - **Account section**: Change password, sign out, delete account (with confirmation)
- Profile updates write to `profiles` table
- Farm updates write to `farms` table
- Preferences updates write to `user_preferences` table
- Theme toggle applies `dark` class to `<html>` element

**Routes**: `/settings`

---

## TICKET 12: Dovetail Synergy -- Cross-System Event Integration

**Problem**: The spec's core value proposition is automatic coordination between systems. Currently no cross-system events exist.

**Work**:
- When a feed formulation is confirmed: auto-create expense record in finance, auto-deduct stock quantities
- When a health task is completed: auto-create expense record, auto-deduct medication stock
- When a batch is created with purchase cost: auto-create expense record (Chicks category)
- When egg sales are recorded: auto-create revenue record
- When stock is purchased: auto-create expense record
- Activity log entries for every cross-system action
- All auto-recorded transactions include `source: 'auto'` and `source_ref` linking to originating record

---

## TICKET 13: Dashboard Enhancements

**Problem**: Dashboard stat cards show hardcoded zeros for Tasks Today, Weekly Expenses, Monthly Revenue.

**Work**:
- Tasks Today: count from `batch_tasks` where `due_date = today` and `completed = false`, plus `health_tasks` where `scheduled_date = today` and `completed = false`
- Weekly Expenses: sum from `expenses` where `date` is in current week
- Monthly Revenue: sum from `revenue` where `date` is in current month
- Wire charts to real data:
  - Overview: daily expense + revenue line chart
  - Expenses: bar chart by category
  - Production: egg production line chart (if layers exist)
  - Performance: mortality rate trend
- Recent Activity: show sync status per item (Synced/Pending) per spec wireframe

---

## Implementation Order (Recommended)

1. **Ticket 1** -- Fix DB triggers (5 min, foundation)
2. **Ticket 3** -- Password reset (small, critical auth gap)
3. **Ticket 4** -- Batch Management (core system, everything depends on batches)
4. **Ticket 2** -- Wire offline sync into Dashboard
5. **Ticket 11** -- Settings (users need to manage their farm)
6. **Ticket 6** -- Water & Health (high farmer value)
7. **Ticket 5** -- Feed Calculator (complex, high value)
8. **Ticket 7** -- Egg Production (layers/ducks)
9. **Ticket 9** -- Stock Management
10. **Ticket 8** -- Finance (needs data from other systems)
11. **Ticket 10** -- Records & Analytics (read-only, needs all systems)
12. **Ticket 12** -- Dovetail Synergy (cross-system wiring)
13. **Ticket 13** -- Dashboard enhancements (needs real data from all systems)

---

## Technical Notes

- All new tables need RLS policies (user access via farm_id -> farms.user_id join)
- All new tables need Dexie schema entries in `db.ts` + sync functions in `sync.ts`
- All financial displays must respect `costPrivacyEnabled` from Zustand store
- All forms must check Supabase `{ error }` returns and toast on failure
- Species-specific reference data (feed formulas, vaccination schedules, medication protocols, production curves) will be hardcoded TypeScript constants in `src/lib/` files
- Container-based dosing (gallons, tablespoons) per West African standard
- Currency display uses user's preference from `user_preferences.currency`

