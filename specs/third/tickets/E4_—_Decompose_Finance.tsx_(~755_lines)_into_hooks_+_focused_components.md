# E4 — Decompose Finance.tsx (~755 lines) into hooks + focused components

## Context

file:src/pages/Finance.tsx is ~755 lines managing: expense/revenue loading, period filtering, financial KPIs, category breakdowns, daily trend charts, per-batch cost analysis, add expense dialog, add revenue dialog — all in one component.

## Scope

### New hook: file:src/hooks/useFinanceData.ts

Extracts all data fetching and derived data:

- Fetches expenses, revenues, batches for the farm
- Accepts `periodFilter` as input
- Returns: `expenses`, `revenues`, `batches`, `loading`
- Derived: `totals`, `profit`, `margins`, `weeklySummary`, `categoryBreakdowns`, `dailyTrendData`, `perBatchCostAnalysis`

### New components (in file:src/components/finance/)

| Component | Responsibility | Lines extracted from |
| --- | --- | --- |
| `FinanceSummaryCards.tsx` | KPI cards (total expenses, revenue, profit, margin) | Finance.tsx lines ~269–350 |
| `OverviewTab.tsx` | Trend charts, category breakdown charts | Finance.tsx lines ~350–500 |
| `ExpensesTab.tsx` | Expenses list with category/date filters | Finance.tsx lines ~500–580 |
| `RevenueTab.tsx` | Revenue list | Finance.tsx lines ~580–649 |
| `BatchCostTab.tsx` | Per-batch cost analysis table | Finance.tsx lines ~649–702 (approx) |
| `AddExpenseDialog.tsx` | Add expense form dialog | Finance.tsx lines ~650–702 |
| `AddRevenueDialog.tsx` | Add revenue form dialog | Finance.tsx lines ~703–755 |

### file:src/pages/Finance.tsx — slimmed page

After extraction:

- Imports `useFinanceData`, renders period filter, `<FinanceSummaryCards>`, `<Tabs>` with tab components, `<AddExpenseDialog>`, `<AddRevenueDialog>`
- Target: under 120 lines

## Acceptance Criteria

1. `src/hooks/useFinanceData.ts` exists and exports `useFinanceData`
2. `src/components/finance/` directory contains the 7 components listed above
3. `Finance.tsx` is under 120 lines
4. All tabs render identically to before
5. Add expense and add revenue dialogs work identically to before
6. Cost privacy masking (`mask()`) works identically to before across all sub-components