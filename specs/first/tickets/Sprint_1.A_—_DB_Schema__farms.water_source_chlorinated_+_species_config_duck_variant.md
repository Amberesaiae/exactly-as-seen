# Sprint 1.A — DB Schema: farms.water_source_chlorinated + species_config duck variant

## Goal

Two schema changes that are prerequisites for Sprint 1.B (jobs) and Sprint 2A (Water-Health C8). Must land before any job or Water-Health work begins.

## Spec Reference

spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — Sprint 1 §1.0

## Changes Required

### 1. `farms` table — file:lib/db/src/schema/app.ts

Add one column to `farmsTable`:

```ts
waterSourceChlorinated: boolean("water_source_chlorinated").notNull().default(false)
```

This is an additive change. The CRUD shim and all existing queries continue to work unchanged. The column defaults to `false` so no data migration is needed.

### 2. `species_config` table — file:lib/db/src/schema/system.ts

The current `speciesConfigTable` has `species` as a unique key. Duck requires two rows (meat + layer sub-type). Add a `variant` column:

```ts
variant: text("variant").notNull().default("default")
```

Change the unique constraint from `unique(species)` to `unique(species, variant)`. Duck rows will use `variant = 'meat'` and `variant = 'layer'`. All other species use `variant = 'default'`.

### 3. Run schema push

```
pnpm --filter @workspace/db run push
```

Verify no existing rows are broken.

## Acceptance Criteria

- `farms` table has `water_source_chlorinated boolean not null default false`
- `species_config` table has `variant text not null default 'default'`
- Unique constraint on `species_config` is `(species, variant)`
- `pnpm run typecheck` passes with zero errors
- `pnpm --filter @workspace/db run push` completes without error on a fresh DB
- Existing CRUD shim routes for `farms` and `health_tasks` continue to return 200