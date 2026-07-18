# BC-3 — Feed Calculator: highs-js LP Solver (M3)

## Overview

Replace the greedy heuristic in file:src/lib/feed-optimizer.ts with a true `highs-js` WASM LP solver. Add `highs-js` to `package.json`. Implement the Safety Preprocessor with 5 rules. Implement the fallback chain.

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/`[M3 spec id]`

## Scope

### `package.json` change

Add `"highs-js": "^1.5.1"` to `dependencies`.

### New lib files

file:src/lib/feed-lp.ts — `solveFeedLP(input, timeoutMs)` implementing the full LP with `highs-js`. Includes `buildCplexLp()` that generates the CPLEX-LP text format string. Uses `Promise.race` for timeout. Uses singleton WASM loader pattern.

file:src/lib/feed-safety.ts — `preprocess(args)` implementing R-FC-1 through R-FC-5. Returns `{ forced_lines, blocked, warnings }`.

### `feed-optimizer.ts` replacement

The existing file is replaced entirely by `feed-lp.ts` + `feed-safety.ts`. The greedy heuristic is removed.

### `FeedFormulation.tsx` updates

- Load `nutritional_requirements` from Supabase for the current batch's species/phase
- Load `ingredients` from Supabase (replaces hardcoded `INGREDIENTS` from `feed-data.ts`)
- Call `preprocess()` before calling `solveFeedLP()`
- Display `solver_status` badge (optimal/fallback/manual)
- Display fallback banner when `fallback_used = true`
- Display nutritional compliance indicators per constraint
- Show auto-added toxin binder as non-removable line

### Finance auto-ledger — feed confirmation

When farmer confirms a formulation, insert an expense entry with `category: 'feed_and_nutrition'`, `amount_pesewas: total_cost_pesewas`, `source: 'auto:feed'`, `source_ref: formulation_id`.

## Acceptance Criteria

- `highs-js` in `package.json`
- Valid broiler-finisher problem → `status: 'optimal'`, `meets_requirements: true`
- Infeasible problem → `status: 'fallback'`, `fallback_reason: 'LP_INFEASIBLE'`
- Mocked timeout → `status: 'fallback'`, `fallback_reason: 'LP_TIMEOUT'`
- Layer + cotton seed cake → blocked before LP runs
- Broiler + fish meal → capped at 10% of target_kg
- Toxin binder auto-added at 0.5%; non-removable in UI
- Duck formulation contains NO niacin line
- Nutritional requirements loaded from DB, not hardcoded
- Mass balance: `Σ(lines.quantity_kg) = target_kg` within ±0.5 kg

## Dependencies

BC-1 (schema + seed — `ingredients`, `nutritional_requirements` tables)