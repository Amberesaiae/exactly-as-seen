# R6 — Frontend Rebuild: Stock + Finance Pages + BatchDetail Tabs

## Goal

Replace file:artifacts/lampfarms/src/pages/Stock.tsx (751 lines) and file:artifacts/lampfarms/src/pages/Finance.tsx (758 lines) with composed component trees calling the real Phase 2 endpoints. Add Feed, Health, Performance, and Expenses tabs to file:artifacts/lampfarms/src/pages/BatchDetail.tsx.

## Spec Reference

spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — Sprint 2C §2C.3–2C.5

## Dependencies

- R4 (auto-ledger wired), R5 (Water-Health + Feed pages done — BatchDetail tabs depend on those components)

## Stock Page

Replace `Stock.tsx` with components calling `GET /api/v1/stock/items`, `GET /api/v1/stock/lots`, `POST /api/v1/stock/purchases`, `GET /api/v1/stock/low-stock`:

| Component | Responsibility |
| --- | --- |
| `StockKPIs` | Total value, low-stock count, expiring-soon count |
| `ItemsTable` | Filterable by category; shows lot count + on-hand quantity |
| `LotHistory` | Per-item lot list with quality grade badges (A/B/C/damaged) |
| `PurchaseDialog` | New purchase — quality grade, expiry date, supplier |
| `LowStockAlerts` | Items below reorder threshold from `GET /low-stock` |

## Finance Page

Replace `Finance.tsx` with components calling `GET /api/v1/finance/expenses`, `POST /api/v1/finance/expenses`, `GET /api/v1/finance/revenue`, `POST /api/v1/finance/revenue`, `GET /api/v1/finance/pnl/farm`, `POST /api/v1/finance/privacy/unmask`:

| Component | Responsibility |
| --- | --- |
| `FinanceKPIs` | Total expenses, revenue, net profit, ROI — values are `null` when masked |
| `ExpensesTable` | 9 categories; auto-entries (source ≠ 'manual') shown as read-only |
| `RevenueTable` | 5 revenue types |
| `CategoryBreakdownChart` | From `pnl/farm` response `byCategory` |
| `PrivacyToggle` | Calls `POST /finance/privacy/unmask`; never masks client-side |

**Key rules:**

- Financial values are displayed as-is from the server — `null` means masked
- `useAppStore.costPrivacyEnabled` is removed from the masking path — the store value may remain for UI state (toggle appearance) but must not gate display of financial values
- Auto-ledger entries (source ≠ 'manual') are shown with a lock icon and no edit/delete controls

## BatchDetail Tabs

Add 4 tabs to file:artifacts/lampfarms/src/pages/BatchDetail.tsx:

| Tab | Data source |
| --- | --- |
| Feed | `GET /api/v1/feed/batches/:id/history` |
| Health | `GET /api/v1/health/batches/:id/tasks` (summary view) |
| Performance | Derived from batch + mortality records |
| Expenses | `GET /api/v1/finance/expenses?batchId=:id` |

## Acceptance Criteria

- Stock page shows real lot data with quality grades; purchase dialog creates a lot
- Finance page shows server-returned values; `null` values display as masked placeholders
- Auto-ledger entries are read-only in the UI
- `PrivacyToggle` calls the unmask endpoint — no client-side masking logic
- BatchDetail has 4 new tabs with real data
- No file over ~250 lines
- `pnpm run typecheck` passes