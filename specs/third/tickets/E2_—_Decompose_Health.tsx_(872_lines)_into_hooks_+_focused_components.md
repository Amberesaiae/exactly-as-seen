# E2 — Decompose Health.tsx (872 lines) into hooks + focused components

## Context

file:src/pages/Health.tsx is 872 lines managing five distinct concerns in a single component: batch selection, vaccination management, medication/withdrawal tracking, water logging, and health alerts. This violates the no-monolith constraint.

## Scope

### New hook: file:src/hooks/useHealthData.ts

Extracts all data fetching and derived data from Health.tsx:

- Fetches active batches, vaccination schedule, health tasks, water records for the selected batch
- Returns: `batches`, `vaccinations`, `healthTasks`, `waterRecords`, `loading`
- Derived: `pendingVaccines`, `overdueVaccines`, `activeMedications`, `healthAlerts`, `withdrawalPeriods`, `eggDiscardEstimate`, `waterChartData`

### New components (in file:src/components/health/)

| Component | Responsibility | Lines extracted from |
| --- | --- | --- |
| `VaccinationTab.tsx` | Vaccination schedule display, generate schedule button, mark administered | Health.tsx lines ~335–500 (vaccine tab content) |
| `MedicationTab.tsx` | Active medications list, add medication dialog, withdrawal status | Health.tsx lines ~500–650 (medication tab content) |
| `WaterTab.tsx` | Water log form, water chart, recent water records | Health.tsx lines ~650–800 (water tab content) |
| `HealthAlertBanner.tsx` | Species-specific alerts, egg/meat discard warnings | Health.tsx lines ~93–167 (derived alert display) |

### file:src/pages/Health.tsx — slimmed page

After extraction, the page component:

- Imports and uses `useHealthData`
- Renders batch selector
- Renders `<HealthAlertBanner>`
- Renders `<Tabs>` with `<VaccinationTab>`, `<MedicationTab>`, `<WaterTab>` as tab content
- Passes down only the data and callbacks each sub-component needs
- Target: under 150 lines

**What does NOT change:** all Supabase queries, all business logic, all UI output. Pure structural decomposition.

## Acceptance Criteria

1. `src/hooks/useHealthData.ts` exists and exports `useHealthData`
2. `src/components/health/VaccinationTab.tsx`, `MedicationTab.tsx`, `WaterTab.tsx`, `HealthAlertBanner.tsx` exist
3. `Health.tsx` is under 150 lines
4. All three tabs render identically to before
5. Health alerts and withdrawal banners display identically to before
6. No business logic changes — same Supabase queries, same derived calculations