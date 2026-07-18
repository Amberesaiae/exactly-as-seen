#2 - Phase 2 — Core Broiler Domain
What & Why
Implement the full broiler end-to-end loop from spec §10 Phase 2: create batch → feed (Ready-Made / Concentrate / LP) → medicate (with safety enforcement) → consume stock → record finance → terminate. Dovetail Synergy (FEED_FORMULATION_CONFIRMED → expense + stock, HEALTH_TASK_COMPLETED → expense + stock + withdrawal entry) wires through the outbox. The unified C1–C8 medication conflict matrix and 9-container dosing are enforced before any write completes.

Done looks like
A broiler batch can be fed via all three methods. LP runs via highs-js in-process; safety preprocessor strips banned-for-phase ingredients; FEED_FORMULATION_CONFIRMED fires, stock is allocated FIFO+quality (CONVENTIONS §2.15), and an expense is recorded automatically.
All 52 medications are seeded; the C1–C8 matrix rejects creation for BLOCK conflicts (returns the documented error code per 03_WATER_HEALTH.md §10) and surfaces WARN for C3.
Health-task completion records dose using the medication's dose_per_gallon × (water_volume_l / 3.785) formula (CONVENTIONS §2.13) — never the legacy ×1.5 rule. Injection vaccines (Fowl Pox wing-web, Duck Viral Hep subcutaneous) skip container/dose UI per CONVENTIONS §2.12.
Withdrawal periods enter via WITHDRAWAL_ENTERED, the batch FSM blocks meat/egg sales while active, and checkWithdrawalPeriods job clears them every 4 hours.
Stock module supports all 5 categories, lots with quality grades, FIFO+quality allocation, transfers, and STOCK_PURCHASED → expense synergy.
Finance module supports all 9 expense categories and 5 revenue types; cost privacy toggle (per user preference) masks values across Dashboard/Finance/BatchDetail/Records.
Frontend Feed, Water-Health, Stock, and Finance pages — currently the four largest monoliths (758, 873, 751, 758 lines) — are rebuilt as composed component trees driven by the new endpoints, preserving the existing LampFarms visual language exactly. No file over ~250 lines.
Test coverage: 100% of C1–C8 scenarios; FIFO+quality allocation across overlapping lots; dosing across all 9 containers; idempotency on every write.
Out of scope
Layer, duck, turkey species (Phase 3).
Egg production tracking (Phase 3).
Records analytics page, Settings UI polish (Phase 4).
Push notifications, SMS (out per CONVENTIONS §7).
Steps
Schema + seeds — extend Drizzle for medications, medication_conflicts, containers, vaccination_protocols, health_tasks, medication_administrations, feed_formulations, formulation_ingredients, ingredients, nutritional_requirements, inventory_items, stock_lots, stock_allocations, stock_transfers, suppliers, expenses, revenues. Seed L1 safety JSON (medications, conflict matrix, withdrawal periods, vaccination protocols, containers) and L2 ingredient/nutrition tables.
Water-Health module — endpoints from spec §5; conflict-matrix guard middleware; withdrawal FSM hooks; generateDailyBatchTasks pg-boss worker; injection-method UI metadata; dose calculation per CONVENTIONS §2.13.
Feed module — Ready-Made, Concentrate, and LP (highs-js) endpoints from spec §5; safety preprocessor (§6); fallback behaviour (§8); publish FEED_FORMULATION_CONFIRMED.
Stock module — endpoints from spec §5; FIFO+quality allocator (§5.3 + CONVENTIONS §2.15); damaged-grade exclusion; transfer audit; consume STOCK_ALLOCATED / publish STOCK_PURCHASED.
Finance module — expense + revenue endpoints (§5); auto-ledger consumers for FEED_FORMULATION_CONFIRMED, HEALTH_TASK_COMPLETED, STOCK_PURCHASED, EGG_SALE_RECORDED (last one stubs until Phase 3); P&L SQL CTE (§5.4); cost-privacy enforcement (§5.3).
Frontend Feed page — 3-method picker (Ready-Made / Concentrate / Custom LP) + result preview + confirm-to-batch action; replace Feed.tsx and the 453-line CustomFormulation.tsx with composed components.
Frontend Water-Health page — replace Health.tsx: BatchPicker, alerts (C1–C8 surface), VaccinationSchedule, MedicationLog with delivery-method-aware dialog, WaterRecords, WithdrawalTracker, EggDiscardBanner.
Frontend Stock page — replace Stock.tsx: KPIs, ItemsTable, ItemDialog, TransactionDialog (with quality grade), LowStockAlerts, lot history.
Frontend Finance page — replace Finance.tsx: KPIs, ExpenseForm, ExpensesTable, RevenueForm, RevenueTable, CategoryBreakdownChart, MonthlyTrendChart; wire cost-privacy toggle from user preferences.
Frontend BatchDetail tabs — add Feed, Health, Performance, Expenses tabs powered by the new endpoints.
Verification — typecheck; full broiler walkthrough (create → feed via each method → medicate (BLOCK rejection + WARN allow + happy path) → withdrawal enter/clear → terminate → P&L appears); automated tests cover all C1–C8 cases and FIFO+quality.
Constraints
Every conflict-matrix check happens server-side before persistence; the UI mirrors the result, never bypasses it.
LP solver runs in-process via highs-js; no external Python/HiGHS service.
Withdrawal-active batches reject sale endpoints with 422 WITHDRAWAL_ACTIVE.
Cost privacy is a per-user pref, masked at the API response layer (§5.3) — never trust the client to mask.
Relevant files
specs/03_WATER_HEALTH.md
specs/04_FEED_CALCULATOR.md
specs/06_STOCK_MANAGEMENT.md
specs/07_FINANCE.md
specs/10_CORE_FLOWS.md
specs/11_PROTOCOL_BROILER.md
artifacts/lampfarms/src/pages/Feed.tsx
artifacts/lampfarms/src/pages/FeedFormulation.tsx
artifacts/lampfarms/src/pages/Health.tsx
artifacts/lampfarms/src/pages/Stock.tsx
artifacts/lampfarms/src/pages/Finance.tsx
artifacts/lampfarms/src/pages/BatchDetail.tsx
artifacts/lampfarms/src/components/feed/
artifacts/lampfarms/src/lib/feed-data.ts
artifacts/lampfarms/src/lib/feed-optimizer.ts
artifacts/lampfarms/src/lib/health-data.ts
Dependencies

Phase 1 — Foundation (auth, batch, events, sync)
Main
