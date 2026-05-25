# E3 — Decompose Eggs.tsx (811 lines) into hooks + focused components

## Context

file:src/pages/Eggs.tsx is 811 lines managing: batch selection, egg collection recording, egg sale recording, production charts, grading distributions, and sales summaries — all in one component.

## Scope

### New hook: file:src/hooks/useEggData.ts

Extracts all data fetching and derived data:

- Fetches active batches, recent egg records, recent egg sales for the selected batch
- Returns: `batches`, `eggRecords`, `eggSales`, `loading`
- Derived: `productionRate`, `sevenDayAverage`, `sizeDistribution`, `qualityBreakdown`, `chartData`, `salesSummary`, `rateDeviationAlert`

### New components (in file:src/components/eggs/)

| Component | Responsibility | Lines extracted from |
| --- | --- | --- |
| `ProductionTab.tsx` | Production charts, 7-day trend, record list | Eggs.tsx lines ~279–500 (production tab) |
| `GradingTab.tsx` | Size/quality distribution charts and breakdowns | Eggs.tsx lines ~500–600 (grading tab) |
| `SalesTab.tsx` | Sales summary, sales list | Eggs.tsx lines ~600–687 (sales tab) |
| `CollectionDialog.tsx` | Egg collection form dialog | Eggs.tsx lines ~688–749 |
| `SaleDialog.tsx` | Egg sale form dialog | Eggs.tsx lines ~750–807 |

### file:src/pages/Eggs.tsx — slimmed page

After extraction:

- Imports `useEggData`, renders batch selector, renders `<Tabs>` with the three tab components
- Renders `<CollectionDialog>` and `<SaleDialog>` with open/close state
- Target: under 120 lines

## Acceptance Criteria

1. `src/hooks/useEggData.ts` exists and exports `useEggData`
2. `src/components/eggs/` directory contains the 5 components listed above
3. `Eggs.tsx` is under 120 lines
4. All three tabs render identically to before
5. Collection and sale dialogs work identically to before
6. Rate deviation alerts display identically to before