# E1 — Extract shared MortalityDialog component

## Context

The mortality modal state (4 state variables) + handler + JSX dialog is duplicated identically in file:src/pages/Dashboard.tsx (lines 48–53, 158–187, 394–420) and file:src/pages/Batches.tsx (lines 29–33, 50–79, 180–205). The business logic (`recordMortality`) is already shared via file:src/lib/batch-utils.ts. What remains is the modal state management and JSX.

file:src/pages/BatchDetail.tsx uses an **inline form** in the Mortality tab (not a dialog) — it stays as-is. Only Dashboard and Batches get the shared dialog.

## Scope

### New file: file:src/components/MortalityDialog.tsx

A focused dialog component that accepts:

- `batch` — the batch being recorded against (or `null` to close)
- `farmId` — the farm ID
- `onClose` — called when the dialog should close
- `onSuccess(newPop: number)` — called with the updated population after a successful record

Internally manages: `count`, `cause`, `notes`, `submitting` state. Calls `recordMortality` from `batch-utils.ts`. Shows toast on success/failure. Resets its own state on close.

### file:src/pages/Dashboard.tsx

- Remove the 4 mortality state variables (lines 48–53)
- Remove `handleRecordMortality` function (lines 158–187)
- Remove the `<Dialog>` block (lines 394–420)
- Replace with `<MortalityDialog batch={mortalityBatch} farmId={farmId} onClose={() => setMortalityBatch(null)} onSuccess={newPop => setBatches(prev => prev.map(b => b.id === mortalityBatch!.id ? { ...b, current_population: newPop } : b))} />`
- Keep only `mortalityBatch` state (the trigger) — all other modal state moves into the component

### file:src/pages/Batches.tsx

- Same pattern: remove 4 state variables (lines 29–33), remove handler (lines 50–79), remove dialog (lines 180–205)
- Replace with `<MortalityDialog>` using the same props pattern

## Acceptance Criteria

1. `src/components/MortalityDialog.tsx` exists and is the single source of the mortality dialog JSX
2. `Dashboard.tsx` has no `mortalityCount`, `mortalityCause`, `mortalityNotes`, `mortalitySubmitting` state variables
3. `Batches.tsx` has no `mortalityCount`, `mortalityCause`, `mortalityNotes`, `mortalitySubmitting` state variables
4. Recording mortality from Dashboard works identically to before — batch population updates in the list
5. Recording mortality from Batches works identically to before — batch population updates in the list
6. `BatchDetail.tsx` is untouched — its inline mortality form in the Mortality tab remains