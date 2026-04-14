

# Audit & Fix Plan: Cohesive System Workflows

## Issues Found

### A. Dashboard Is a Shell — Not a Real Dashboard
1. **Stat cards are hardcoded zeros** — "Tasks Today" always shows `0`, "Weekly Expenses" and "Monthly Revenue" show `GHS 0.00`. No actual queries to `expenses`, `revenue`, `batch_tasks`, or `health_tasks`.
2. **Analytics charts use dummy data** — `sampleChartData` is all zeros. No real data from any module.
3. **No farm setup redirect** — `Index.tsx` sends authenticated users to `/dashboard` even if `farmReady === false`. They should go to `/farm-setup`.
4. **Activity feed hidden on mobile** — the Recent Activity column has `hidden lg:block`, invisible on 360px viewport.
5. **Currency hardcoded as "GHS"** — ignores `user_preferences.currency`.

### B. Cross-Module Data Gaps
6. **Feed purchase doesn't create stock transaction** — Stock page tracks purchases, but Feed page's formulation cost doesn't deduct from stock or create expense entries.
7. **Egg sales create `revenue` entries** — confirmed working in Eggs.tsx. But Finance page loads revenue independently; no duplicate-prevention on source_ref.
8. **Stock purchase creates expense** — confirmed in Stock.tsx. Good.
9. **Health medication doesn't create expense** — when a medication is recorded in Health, no expense entry is created for the medication cost.
10. **Batch completion doesn't propagate** — completing a batch in BatchDetail doesn't affect related feed schedules, health tasks, or show in Records performance tab.

### C. Navigation & UX Gaps
11. **Mobile nav "More" goes to `/settings`** — should open a menu with Eggs, Finance, Stock, Records, Settings. Users can't reach Eggs/Finance/Stock on mobile without the sidebar.
12. **No `DialogDescription` on several dialogs** — Dashboard mortality dialog, Batches mortality dialog missing accessibility descriptions.
13. **Records page Performance tab is a placeholder** — just shows static text, no actual FCR, mortality, or cost-per-bird calculations.
14. **Records Compare tab** — only compares basic batch fields, doesn't pull mortality, feed, egg, or financial data.

### D. Data Consistency
15. **Mortality recorded in 3 places** (Dashboard, Batches, BatchDetail) with duplicated logic — should be a shared utility.
16. **Farm ID lookup duplicated** in every page — each page does its own `farms.select('id').eq('user_id', user.id)` query. Should be centralized.
17. **`batch.current_week` / `current_day` / `phase`** stored in DB but computed client-side via `getBatchAge()` — stored values are never updated, creating drift.

### E. Offline / Sync
18. **Only Dashboard uses Dexie cache** — Feed, Health, Eggs, Finance, Stock all fail silently when offline.
19. **`setupOnlineListener`** is defined but never called anywhere.

---

## Implementation Plan

### Step 1: Centralize Farm Context
Create a `useFarm` hook (or add to AuthContext) that fetches `farmId`, `farmName`, and `currency` once after login, making them available everywhere. Removes 10+ duplicate farm queries.

### Step 2: Shared Mortality Utility
Extract mortality recording logic into a single function in `lib/batch-utils.ts` used by Dashboard, Batches, and BatchDetail. Add `DialogDescription` to all mortality dialogs.

### Step 3: Fix Dashboard with Real Data
- Query `expenses` (last 7 days) and `revenue` (current month) for stat cards
- Query `batch_tasks` + `health_tasks` due today for "Tasks Today"
- Use `user_preferences.currency` for formatting
- Build real weekly chart data from `expenses` and `egg_records`
- Show activity feed on mobile (remove `hidden lg:block`, use horizontal scroll or collapsible)

### Step 4: Fix Index Route + Farm Setup Guard
- `Index.tsx`: redirect to `/farm-setup` when `farmReady === false`
- `AppLayout`: redirect to `/farm-setup` if farm not set up

### Step 5: Fix Mobile Navigation
Replace "More" with a bottom sheet or expanded nav that includes Eggs, Finance, Stock, Records, and Settings — all currently unreachable on mobile.

### Step 6: Cross-Module Financial Integration
- Health: create expense entry when medication is recorded (medication cost × duration)
- Feed: when formulation is saved, optionally deduct from stock items and create expense

### Step 7: Records Page — Real Performance Data
- Performance tab: query `mortality_records`, `feed_schedules`, `egg_records`, `expenses` per batch
- Calculate FCR (total feed kg / total weight gain), mortality %, cost-per-bird, egg production rate
- Compare tab: include mortality %, total feed consumed, total eggs, total expenses for each batch

### Step 8: Batch Lifecycle Cleanup
- When batch is completed: mark pending feed schedules as skipped, mark pending vaccinations as missed
- Ensure completed batches still show in Records but are excluded from active batch selectors across Feed/Health/Eggs

### Step 9: Call `setupOnlineListener`
Call it in `App.tsx` or `AppLayout` on mount. Add toast notification when sync completes.

### Step 10: Remove Stale DB Fields
Stop relying on `batches.current_week`, `current_day`, `phase` from DB — always compute from `getBatchAge()`. Or add a cron/trigger to update them daily.

---

## Files Changed
- `src/contexts/AuthContext.tsx` — Add `farmId`, `farmName`, `currency` to context
- `src/pages/Index.tsx` — Fix redirect logic
- `src/components/AppLayout.tsx` — Add farm setup guard
- `src/components/MobileNav.tsx` — Full nav with all pages
- `src/pages/Dashboard.tsx` — Real stat queries, real charts, mobile activity feed
- `src/pages/Health.tsx` — Add expense on medication
- `src/pages/Records.tsx` — Performance metrics + enhanced compare
- `src/pages/Batches.tsx` — Use shared mortality function
- `src/pages/BatchDetail.tsx` — Use shared mortality, lifecycle cleanup
- `src/lib/batch-utils.ts` — Add shared `recordMortality()` function
- `src/App.tsx` — Call `setupOnlineListener`
- Dialog accessibility fixes across multiple files

No database migrations needed.

