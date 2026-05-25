# A2 — Egg Transactions + Feed Fallback Mass Balance

## Scope

Fix two backend correctness issues: egg events published outside transaction boundaries, and the feed fallback that can silently under-fill the target mass.

### Included

- Wrap `createCollection` in file:artifacts/api-server/src/modules/egg-production/service.ts in `db.transaction`, use `publish(tx, ...)` instead of `publish(db, ...)`
- Wrap `createDiscard` in file:artifacts/api-server/src/modules/egg-production/service.ts in `db.transaction`, use `publish(tx, ...)`
- Fix `flexibleMixFallback` in file:artifacts/api-server/src/modules/feed/fallback.ts to redistribute remaining mass when any ingredient hits its `available_kg` cap

### Explicitly out

- Changes to the egg or feed frontend pages
- Changes to the egg sale flow (already uses `db.transaction` correctly)

## Why these are one ticket

Both are small, isolated backend correctness fixes with no shared dependencies. Grouping them avoids creating two trivially small tickets.

## Egg transaction fix

**`createCollection`**** (line 133–178):** The `db.insert(eggCollections)` succeeds, then `publish(db, ...)` is called outside any transaction. If `publish` fails, the collection is recorded but `EGG_COLLECTION_RECORDED` is never emitted — Finance auto-ledger never fires.

Required pattern:

```
db.transaction(async (tx) => {
  const [row] = await tx.insert(eggCollections).values(...).returning()
  await publish(tx, { eventType: 'EGG_COLLECTION_RECORDED', ... })
  return row
})
```

**`createDiscard`**** (line 355–387):** No transaction at all — bare `db.insert` then bare `publish(db, ...)`. Same risk.

## Feed fallback fix

**`flexibleMixFallback`**** (line 20–30):** Distributes `remaining / freeLots.length` evenly but caps each lot at `lot.available_kg`. If one ingredient hits its cap early, the remaining mass is not redistributed. The returned formulation can sum to less than `target_kg`.

Required: after the first pass, compute `actualTotal = sum(freeLines.quantity_kg)`. If `actualTotal < remaining`, redistribute the deficit across lots that have not yet hit their cap. Repeat until convergence or no uncapped lots remain.

## Acceptance criteria

- If `publish(tx, ...)` throws inside `createCollection`, the `eggCollections` insert is rolled back — no orphaned collection record exists
- If `publish(tx, ...)` throws inside `createDiscard`, the `eggDiscards` insert is rolled back
- `flexibleMixFallback` returns lines that sum to `target_kg` (within 0.01 kg tolerance) when total ingredient availability is sufficient
- When total ingredient availability is less than `target_kg`, the fallback returns all available mass and includes a `INSUFFICIENT_INGREDIENTS` warning

## Dependencies

None — can start immediately.

## Plan reference

spec:3a092065-e868-4799-849c-f707a0553261/ecd0ec8f-4fe6-44c2-afee-fa2592de59b8 — Egg Production data flow, Feed Calculator data flow, issues 4, 5, 19.