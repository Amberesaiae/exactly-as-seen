# E5 — Decompose Stock.tsx (~749 lines) into hooks + focused components

## Context

file:src/pages/Stock.tsx is ~749 lines managing: stock item loading, KPI cards, low/out-of-stock alerts, category tabs with item cards, add item dialog, purchase dialog, usage dialog, purchase chart, transaction list — all in one component.

## Scope

### New hook: file:src/hooks/useStockData.ts

Extracts all data fetching and derived data:

- Fetches stock items and recent transactions for the farm
- Returns: `items`, `transactions`, `loading`
- Derived: `lowStockItems`, `outOfStockItems`, `categoryCounts`, `totalInventoryValue`, `recentSpend`, `purchaseChartData`

### New components (in file:src/components/stock/)

| Component | Responsibility | Lines extracted from |
| --- | --- | --- |
| `StockKPIs.tsx` | Summary cards (total value, low stock count, recent spend) | Stock.tsx lines ~298–380 |
| `StockAlerts.tsx` | Low/out-of-stock alert banners | Stock.tsx lines ~380–420 |
| `CategoryTabs.tsx` | Category tab list with item cards per category | Stock.tsx lines ~420–530 |
| `TransactionList.tsx` | Recent transactions list + purchase chart | Stock.tsx lines ~530–579 |
| `AddItemDialog.tsx` | Add new stock item form | Stock.tsx lines ~580–649 |
| `PurchaseDialog.tsx` | Record purchase form | Stock.tsx lines ~649–699 |
| `UsageDialog.tsx` | Record usage form | Stock.tsx lines ~699–749 |

### file:src/pages/Stock.tsx — slimmed page

After extraction:

- Imports `useStockData`, renders `<StockKPIs>`, `<StockAlerts>`, `<CategoryTabs>`, `<TransactionList>`, and the three dialogs
- Target: under 100 lines

## Acceptance Criteria

1. `src/hooks/useStockData.ts` exists and exports `useStockData`
2. `src/components/stock/` directory contains the 7 components listed above
3. `Stock.tsx` is under 100 lines
4. All category tabs, item cards, and transaction list render identically to before
5. All three dialogs (add item, purchase, usage) work identically to before
6. Low/out-of-stock alerts display identically to before