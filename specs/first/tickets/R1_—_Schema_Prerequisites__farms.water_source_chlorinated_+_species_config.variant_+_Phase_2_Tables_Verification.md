# R1 — Schema Prerequisites: farms.water_source_chlorinated + species_config.variant + Phase 2 Tables Verification

## Goal

Two schema columns are missing that block Water-Health C8 and species config seeds. Additionally, the Phase 2 module tables (`medications`, `container_types`, `formulations`, `ingredients`, `nutritional_requirements`, `stockItems`, `stockLots`, `stockAllocations`, `suppliers`, `expenseEntries`, `revenueEntries`, `unmaskEvents`) need to be confirmed as pushed to the DB and exported from `@workspace/db`.

## Spec Reference

spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — Sprint 1 §1.0 and Sprint 2A §2A.1

## Changes Required

### 1. `farms` table — file:lib/db/src/schema/app.ts

Add `waterSourceChlorinated: boolean("water_source_chlorinated").notNull().default(false)` to `farmsTable`. This is the prerequisite for Water-Health C8. The service at file:artifacts/api-server/src/modules/water-health/service.ts already reads `farm.waterSourceChlorinated` — the column just doesn't exist in the schema yet.

### 2. `species_config` table — file:lib/db/src/schema/system.ts

Add `variant: text("variant").notNull().default("default")` and change the unique constraint from `unique(species)` to `unique(species, variant)`. Duck requires two rows: `(duck, meat)` and `(duck, layer)`.

### 3. Verify Phase 2 table exports — file:lib/db/src/schema/index.ts

Confirm that `medications`, `container_types`, `formulations`, `ingredients`, `nutritional_requirements`, `stockItems`, `stockLots`, `stockAllocations`, `suppliers`, `expenseEntries`, `revenueEntries`, `unmaskEvents` are all defined in schema files and exported from the index. The module services import these directly from `@workspace/db` — if any are missing the server will fail to start.

### 4. Run schema push

```
pnpm --filter @workspace/db run push
```

## Acceptance Criteria

- `farms.water_source_chlorinated` column exists with default `false`
- `species_config.variant` column exists; unique constraint is `(species, variant)`
- All Phase 2 tables exist in the DB and are exported from `@workspace/db`
- `pnpm run typecheck` passes with zero errors
- `pnpm --filter @workspace/db run push` completes without error
- Water-Health service starts without import errors