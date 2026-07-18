# Sprint 2C — Frontend Rebuilds: Water-Health, Feed, Stock, Finance Pages + BatchDetail Tabs

## Goal

Rebuild all 4 Phase 2 frontend pages as composed component trees against the new Phase 2 API endpoints. No file over ~250 lines. Preserve the existing LampFarms visual language exactly.

## Scope

### Water-Health Page — replace file:artifacts/lampfarms/src/pages/Health.tsx

Components (each ≤250 lines):

- `BatchPicker` — select active batch, show species + week
- `ConflictBanner` — surface C1–C8 BLOCK (red) / WARN (amber) from API response
- `AddTaskDialog` — ad-hoc task creation with date + time input so hour-based conflicts can be evaluated correctly
- `VaccinationSchedule` — list with delivery-method badge; injection tasks show site + ml/bird instead of container/dose
- `MedicationLog` — task cards with Complete/Skip; injection tasks hide container picker
- `WaterRecords` — container picker + dose display (from `computed_dose_amount` — never recalculated client-side)
- `WithdrawalTracker` — countdown to clear date
- `EggDiscardBanner` — shown when `has_active_eggs_withdrawal = true`

### Feed Page — replace file:artifacts/lampfarms/src/pages/Feed.tsx + `FeedFormulation.tsx` + file:artifacts/lampfarms/src/components/feed/

Components:

- `FeedMethodPicker` — 4 method cards
- `IngredientSelector` — multi-select with stock availability from `/api/v1/stock/availability`
- `FormulationResult` — nutrition summary, cost, solver status badge (`optimal` / `fallback`)
- `FallbackBanner` — "Could not auto-optimise — switched to Flexible Mix"
- `ConfirmToFeed` — confirm button → `POST /api/v1/feed/:id/confirm`

Duck batches: no niacin shown anywhere in feed UI.

### Stock Page — replace file:artifacts/lampfarms/src/pages/Stock.tsx

Components:

- `StockKPIs` — total value (masked when privacy on), low-stock count, expiring-soon count
- `ItemsTable` — category tabs, lot count, on-hand quantity
- `LotHistory` — quality grade badges (A/B/C/damaged), expiry date, received date
- `PurchaseDialog` — quality grade selector, expiry date, supplier
- `LowStockAlerts` — items below reorder threshold

### Finance Page — replace file:artifacts/lampfarms/src/pages/Finance.tsx

Components:

- `FinanceKPIs` — expenses, revenue, net profit, ROI (all from server; masked when privacy active)
- `PrivacyToggle` — eye icon calls `POST /api/v1/finance/privacy/unmask`; never masks client-side
- `ExpenseForm` + `ExpensesTable` — auto-entries marked read-only with source badge
- `RevenueForm` + `RevenueTable`
- `CategoryBreakdownChart` — from server CTE response
- `MonthlyTrendChart` — from server CTE response

### BatchDetail Tabs — extend file:artifacts/lampfarms/src/pages/BatchDetail.tsx

Add tabs: Feed (formulation history), Health (task list), Performance (mortality + feed KPIs), Expenses (per-batch P&L).

## Acceptance Criteria

No rebuilt page file exceeds 250 linesWater-Health: injection task card shows site + ml/bird, hides container pickerWater-Health: ad-hoc task creation includes time input for hour-based conflict checksWater-Health: BLOCK conflict shows red banner with conflict codeFeed: duck batch formulation shows no niacin ingredientFeed: fallback banner shown when solver_status = 'fallback'Stock: damaged lot shows badge but cannot be selected for manual allocationFinance: amounts are null (not ****) when privacy active — server controls maskingFinance: auto-entries (source ≠ 'manual') show read-only badge, no edit/delete buttonsPhase 2+ mutating actions are disabled or blocked when offline, with clear reconnect guidancepnpm run typecheck passesAll pages render without console errors against real API endpoints