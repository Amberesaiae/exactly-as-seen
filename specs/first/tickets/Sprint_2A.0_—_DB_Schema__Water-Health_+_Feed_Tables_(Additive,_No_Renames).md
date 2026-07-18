# Sprint 2A.0 — DB Schema: Water-Health + Feed Tables (Additive, No Renames)

## Goal

Add all new Drizzle tables required by Water-Health and Feed modules. **No legacy table renames.** The CRUD shim and existing frontend pages must continue to work unchanged throughout this ticket.

## Spec Reference

spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — Sprint 2A §2A.1

## Dependencies

- `Sprint 1.A` must be merged first

## New Files

### file:lib/db/src/schema/water-health.ts

New tables:

**`medications`** — 52+ rows seeded via a separate seed script:

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK |  |
| name | text | e.g. "Amprolium (CORID)" |
| category | text | antibiotic / coccidiostat / vaccine / dewormer / vitamin / electrolyte / other |
| delivery_method | text | drinking_water / injection / feed_additive |
| dose_per_gallon | real | null for injection-only meds |
| dose_per_bird_ml | real | null for water meds |
| withdrawal_meat_days | integer | default 0 |
| withdrawal_egg_days | integer | default 0 |
| conflict_groups | text[] | e.g. ['antibiotic', 'sulfa'] |
| is_live_vaccine | boolean | default false — used for C4/C8 |
| is_fluoroquinolone | boolean | default false — used for C5 |
| is_activated_charcoal | boolean | default false — used for C6 |
| is_calcium | boolean | default false — used for C7 |
| is_tetracycline | boolean | default false — used for C7 |
| notes | text |  |

**`container_types`** — exactly 9 rows seeded per CONVENTIONS §2.3:

| Column | Type |
| --- | --- |
| id | uuid PK |
| name | text |
| volume_l | real |
| sort_order | integer |

**`health_tasks`**** additive extension** — add these columns to the existing `healthTasksTable` in file:lib/db/src/schema/app.ts (do not create a new table):

| New column | Type | Notes |
| --- | --- | --- |
| medication_id | uuid FK → medications | nullable (legacy rows have no FK) |
| container_type_id | uuid FK → container_types | nullable |
| container_count | integer | nullable |
| water_volume_l | real | nullable |
| computed_dose_amount | real | nullable |
| delivery_method | text | nullable |
| bird_count | integer | nullable |
| blocked_reason | text | nullable |
| status | text | 'pending' / 'completed' / 'skipped' — nullable during transition |
| withdrawal_meat_until | date | nullable |
| withdrawal_eggs_until | date | nullable |
| scheduled_at | timestamp with timezone | nullable — concrete timestamp for C4/C6/C7 |

### file:lib/db/src/schema/feed.ts

New tables:

**`ingredients`** — West African catalogue, seeded:

| Column | Type |
| --- | --- |
| id | uuid PK |
| name | text |
| category | text |
| crude_protein_pct | real |
| me_kcal_per_kg | real |
| calcium_pct | real |
| phosphorus_pct | real |
| lysine_pct | real |
| methionine_pct | real |
| price_per_kg_ghs | real |
| max_inclusion_pct | real |
| gossypol_risk | boolean |
| aflatoxin_risk | boolean |

**`nutritional_requirements`** — seeded per species/phase:

| Column | Type |
| --- | --- |
| id | uuid PK |
| species | text |
| phase | text |
| min_cp_pct | real |
| min_me_kcal | real |
| min_calcium_pct | real |
| min_phosphorus_pct | real |
| min_lysine_pct | real |
| min_methionine_pct | real |

**`formulations`** — stores LP results:

| Column | Type |
| --- | --- |
| id | uuid PK |
| farm_id | uuid FK |
| batch_id | uuid FK nullable |
| species | text |
| phase | text |
| mode | text |
| target_kg | real |
| solver_status | text |
| fallback_reason | text |
| meets_requirements | boolean |
| lines | jsonb |
| confirmed_at | timestamp |
| idempotency_key | text |
| created_at | timestamp |

### file:lib/db/src/schema/index.ts

Export all new tables from the schema index.

## Acceptance Criteria

- `pnpm --filter @workspace/db run push` completes without error
- `medications`, `container_types`, `formulations`, `ingredients`, `nutritional_requirements` tables exist
- `health_tasks` has all new columns; existing rows are unaffected (all new columns nullable or with defaults)
- CRUD shim routes for `health_tasks`, `feed_formulations`, `expenses`, `stock_items` still return 200
- `pnpm run typecheck` passes with zero errors
- Seed scripts for `medications` (52+ rows) and `container_types` (9 rows) and `ingredients` run without error