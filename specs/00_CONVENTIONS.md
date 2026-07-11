# LampFarms — Spec Rewrite Conventions

**This document is the source of truth for all rewritten specs. Every spec in `specs/` must follow these conventions exactly. Do not deviate without updating this document first.**

---

## 1. Stack (Canonical)

The original specs were written for a Python stack that does not match the codebase. **All rewritten specs use the TypeScript stack below.**

| Concern | Canonical Choice | Replaces (from old specs) |
|---|---|---|
| Language | TypeScript (browser + Supabase Edge Deno) | Python 3.11 / Express 5 (deprecated) |
| App server | **None — Supabase** (PostgREST + RLS + RPCs + Edge Functions) | FastAPI / Express |
| ORM | Supabase client + SQL migrations | SQLAlchemy / Drizzle |
| Migrations | `supabase/migrations/*.sql` | Alembic / drizzle-kit |
| Validation | Zod (client) + Postgres CHECK | Pydantic |
| Job queue / scheduler | Edge Functions + `pg_cron` / SQL cron functions | APScheduler / pg-boss |
| Outbox | Dexie `sync_outbox` (client; partial) | pg-boss outbox |
| FSM | XState v5 (reference/tests; lifecycle also SQL) | python-statemachine |
| LP solver | `highs-js` (WASM) | Pyomo + HiGHS |
| Frontend | React 18 + Vite + react-router-dom + TanStack Query | React 19 / TanStack Router (old docs) |
| Local DB | Dexie.js v4 | (same) |
| Service Worker | Workbox `injectManifest` | (same) |
| Database | PostgreSQL (Supabase) | (same) |
| **Runtime enums / money** | **`src/lib/canonical.ts` + `docs/CANONICAL_RUNTIME.md`** | scattered |

### Module layout

Backend lives in `artifacts/api-server/src/`:

```
artifacts/api-server/src/
├── index.ts                  # Express bootstrap
├── config/                   # Env + runtime config
├── db/                       # Drizzle schema + migrations + seed
│   ├── schema/
│   ├── migrations/
│   └── seed/
├── modules/                  # One folder per bounded context
│   ├── batch/
│   ├── water-health/
│   ├── feed/
│   ├── egg-production/
│   ├── stock/
│   ├── finance/
│   ├── records/
│   ├── auth/
│   └── settings/
├── events/                   # In-memory bus + outbox relay
├── jobs/                     # pg-boss queues + workers
└── shared/                   # Cross-cutting (logger, errors, ids)
```

Frontend (PWA) lives in a separate artifact (e.g. `artifacts/web/`) and consumes the API. Specs that reference UI must use this convention.

### Avoid

- ❌ `console.log` on the server. Use `req.log` in handlers and the singleton `logger` elsewhere.
- ❌ Pyomo / Python / FastAPI references unless explicitly comparing to the old approach.
- ❌ Direct port routing in code (e.g. `localhost:8080`). Use the proxy at `/api/...`.
- ❌ Custom Vite proxies — the platform proxy already handles cross-service routing.

---

## 2. Mandatory Corrections (Apply Everywhere)

These are the issues found during validation. Every spec that touches these topics must follow the corrected values.

### 2.1 Layer egg production starts at **Week 19+** (not Week 17)

Previously inconsistent: Master Architecture and Batch spec said Week 17; Layer protocol and Water-Health said Week 19. **Canonical = Week 19.**

Apply in: Master Architecture, Batch Management, Layer Protocol, Egg Production, Records, Water-Health, Core Flows.

### 2.2 Conflict matrix is unified

The spec previously had two non-overlapping conflict matrices. The unified matrix below replaces both. **All 8 conflicts must be implemented and tested.**

| Code | Conflict | Severity | Action | Reason |
|---|---|---|---|---|
| C1 | Coccidiostat (Amprolium) + Sulfa antibiotics | BLOCK | Reject task creation | Nephrotoxicity (kidney damage) |
| C2 | Two systemic antibiotics simultaneously | BLOCK | Reject task creation | Resistance + toxicity |
| C3 | Dewormer + Coccidiostat (same day) | WARN | Allow with warning | Reduced efficacy of both |
| C4 | Live vaccine + Antibiotic within **72 hours** | BLOCK | Reject task within window | Antibiotic kills vaccine organisms |
| C5 | Enrofloxacin + any other antibiotic | BLOCK | Reject task creation | Fluoroquinolone resistance development |
| C6 | Activated charcoal + any oral medication (within 4 h) | BLOCK | Reject task within window | Charcoal absorbs medication, neutralizes it |
| C7 | Calcium supplement + Tetracyclines | BLOCK | Reject task within 4 h window | Calcium chelates tetracycline, reduces absorption |
| C8 | Live vaccine + Chlorinated water | BLOCK | Reject vaccine task on chlorinated water source | Chlorine kills vaccine virus |

The vaccine + antibiotic guard is **72 hours (3 days)**, not 48 hours.

Apply in: Water-Health (primary), Master Architecture, Batch (FSM guards), Core Flows.

### 2.3 Container types: there are exactly **9** (not 10)

Original spec said "10 container types" in one place and listed 9 in another. **Canonical = 9.** All references to "10 container types" must change to 9.

Canonical list:

| ID | Name | Volume (L) | Volume (gal) |
|---|---|---|---|
| `bell_drinker_small` | Small Bell Drinker | 1 | 0.26 |
| `bell_drinker_1gal` | Bell Drinker 1 gal | 3 | 0.79 |
| `bell_drinker_6l` | Bell Drinker 6L | 6 | 1.59 |
| `local_drinker_10l` | Local Drinker 10L | 10 | 2.64 |
| `jumbo_bell_14l` | Jumbo Bell 14L | 14 | 3.70 |
| `bucket_5gal` | 5 Gallon Bucket | 20 | 5.28 |
| `jerry_can_25l` | Jerry Can 25L | 25 | 6.60 |
| `drum_50l` | 50L Drum | 50 | 13.21 |
| `nipple_tank_100l` | Nipple Tank 100L | 100 | 26.42 |

Apply in: Water-Health, Master Architecture, Batch.

### 2.4 Layer lifecycle is **72–78 weeks** (canonical 78)

Old specs disagreed (68 vs 72 vs 78). Canonical: **lifecycle 72–78 weeks; default termination at 78**. Egg production tracking continues until termination, not at a fixed week.

### 2.5 Turkey lifecycle is **configurable 12–20 weeks (default 16)**

Not a fixed 16 weeks. The batch wizard exposes the cycle length; FSM phase thresholds scale.

### 2.6 Duck has **two sub-types** chosen at batch creation

| `duck_type` | Cycle | Egg production |
|---|---|---|
| `meat` | 8–10 weeks | No |
| `layer` | 72+ weeks | Yes (Week 20+) |

The Batch Creation Wizard adds Step 1b for duck sub-type. FSM, water tables, feed phases, and egg tracking all branch on `duck_type`.

### 2.7 Duck egg production starts **Week 20+** (canonical)

Old specs said both Week 20 and Week 21. Canonical: **Week 20**.

### 2.8 Broiler vaccinations: **5 events**, not 2

The Step 3 wizard wireframe and any summary text must say "5 vaccinations scheduled". The five are:

- Day 7: Gumboro Intermediate
- Day 14: HB1 (Newcastle + IB)
- Day 21: Gumboro Intermediate Plus
- Day 28: Lasota (Newcastle)
- Day 35: Gumboro Intermediate Plus

### 2.9 Duck niacin moves from Feed Calculator → Water-Health

Niacin is a water additive, not a feed ingredient. The Feed Calculator Safety Preprocessor no longer adds it. Water-Health auto-generates a niacin task for duck batches from Day 1: **1.5 tsp per 1 gallon (3.785 L)**, daily through Week 4, then weekly.

### 2.10 Metronidazole exists in the medication database

Required for Turkey Blackhead prevention (the #1 turkey killer). Add to medication database with standard turkey antiprotozoal dosing.

### 2.11 Scheduler timezone is **`Africa/Accra` (GMT+0)** by default

Per-farm override allowed via `farm.timezone`. All pg-boss scheduled jobs use the farm's timezone, not UTC.

| Job | Cron | Timezone |
|---|---|---|
| `generateDailyBatchTasks` | `0 6 * * *` | farm.timezone |
| `advanceBatchWeeks` | `0 0 * * 0` (Sunday 00:00) | farm.timezone |
| `checkWithdrawalPeriods` | `0 */4 * * *` | UTC (data-only) |
| `outboxRelay` | continuous (5 s poll) | n/a |

### 2.12 Delivery method is a first-class field on health tasks

```ts
delivery_method: 'drinking_water' | 'injection_subcutaneous' | 'injection_wing_web' | 'in_feed' | 'topical'
```

Injection vaccines (Duck Viral Hepatitis = subcutaneous, Fowl Pox = wing web) skip the container/dose UI and show: site, dose-per-bird in ml, "manual administration" notice.

### 2.13 Dosing rule

The dose for a given task is **always derived from the medication record's `dose_per_gallon`**, not from a generic formula. Calculation:

```ts
dose_amount_in_unit = dose_per_gallon * (water_volume_l / 3.785)
```

Where `dose_per_gallon` and `unit` (`tsp` | `tbsp` | `ml` | `g`) are stored on the medication record. The formula `(water_volume_l / 3.785) × 1.5` from the old spec is removed — it produced wrong values for several real medications.

### 2.14 Concurrency on week advancement uses optimistic DB locking

```sql
UPDATE batches
SET current_week = $newWeek, updated_at = NOW()
WHERE id = $batchId AND current_week = $expectedCurrentWeek
RETURNING *;
```

Zero rows returned → `409 Conflict` (raced). Manual advance and scheduler both use this pattern.

### 2.15 FIFO + Quality allocation algorithm (Stock)

Allocation sorts by:

1. **Quality grade** ascending — lots flagged as expiring within 30 days first (use them up).
2. **Expiry date** ascending within the same grade.
3. **`received_at`** ascending (FIFO) as final tiebreaker.

Lots flagged `quality_grade = 'damaged'` are excluded from auto-allocation entirely — manual override only.

---

## 3. Universal Spec Structure

Every rewritten spec must follow this template (sections may be omitted only if truly N/A):

```markdown
# {System Name}

**Status:** Spec v2 (rewritten {date})
**Module path:** `artifacts/api-server/src/modules/{module}`
**Owner:** {team or person, "TBD" allowed}

## 1. Purpose & Scope
## 2. Domain Model (entities + key fields, with TypeScript types)
## 3. Drizzle Schema (tables, columns, indices, constraints)
## 4. State Machine (if any) — XState v5 definition
## 5. Public API (REST endpoints with Zod schemas)
## 6. Events Published / Consumed
## 7. Background Jobs (pg-boss workers, schedules)
## 8. Business Rules & Invariants (numbered)
## 9. Error Codes
## 10. Observability (metrics, log fields)
## 11. Test Plan (must cover every business rule)
## 12. Open Questions
```

UI-heavy specs (Main Dashboard, Core Flows) substitute Sections 3–7 with wireframes + interaction flows but keep 1–2 and 8–12.

Species protocol specs use a simpler structure (lifecycle, water table, medication schedule, vaccinations, withdrawal, traditional remedies, costs, app display).

---

## 4. Cross-Cutting Conventions

### 4.1 IDs

All entity IDs are **UUIDv7** strings. Generated client-side for offline-first writes. Stored as `text` (not `uuid`) in Postgres for sort-friendliness; index appropriately.

### 4.2 Money

All amounts in **integer minor units** (Ghanaian peswas — 1 GHS = 100 pesewas). Field name suffix `_pesewas`, never floats. Display layer formats.

### 4.3 Currency

Default `GHS`. Per-farm setting `farm.currency` allows `NGN` (Nigerian Naira) for Nigerian farms. All cost displays must respect farm currency.

### 4.4 Time

- All `*_at` columns: `timestamptz`, stored UTC.
- Display: respect `farm.timezone`.
- "Day X of batch" calculations use farm timezone, not UTC, to match farmer's lived day.

### 4.5 Idempotency

Every POST/PATCH/DELETE accepts an `Idempotency-Key` header. Backend dedupes via the `idempotency_keys` table (key, request hash, response, expires_at). Required for all offline-sync writes.

### 4.6 Sync (offline-first)

Server is source of truth. Client (Dexie) holds:

- Local mirror of farm-scoped data.
- `outbox` table for pending writes (with idempotency_key, retry_count, status).
- `sync_meta` (last_synced_at, server_version per entity).
- `conflicts` (server vs local divergence to resolve in UI).

Endpoints expose `GET /sync/delta?since={cursor}` and entity-specific writes that accept idempotency keys.

### 4.7 Errors

Backend returns JSON:

```json
{ "error": { "code": "WITHDRAWAL_ACTIVE", "message": "...", "details": {} } }
```

Codes are SCREAMING_SNAKE_CASE, stable across versions, documented per spec.

### 4.8 Logging

Every request logs at least: `request_id`, `farm_id`, `user_id`, `route`, `status`, `duration_ms`. Domain events log: `event_type`, `aggregate_id`, `correlation_id`.

### 4.9 Authorization

All farm-scoped entities check `farm_id` against the authenticated user's farm membership. **Every** query must include `farm_id` in the WHERE clause. Cross-farm reads are not allowed.

---

## 5. Domain Glossary (use these terms exactly)

| Term | Meaning |
|---|---|
| Farm | Top-level tenant; one user → one or more farms |
| House | A physical structure on a farm holding one batch at a time |
| Batch | A cohort of birds reared together with one start date and lifecycle |
| Phase | Lifecycle stage within a batch (brooding, starter, grower, finisher, withdrawal, ready_to_sell, terminated) |
| Species | broiler \| layer \| duck \| turkey \| other |
| Duck type | meat \| layer (sub-classification of duck batches) |
| Health task | A scheduled or ad-hoc medication, vaccination, or treatment event |
| Feed formulation | A computed mix of ingredients matching nutritional requirements for a phase |
| Withdrawal period | Days during which meat/eggs from medicated birds cannot be sold |
| Container | A physical drinker the farmer uses (one of 9 canonical types) |
| Outbox | Local pending-write queue (client) or transactional event table (server) |

---

## 6. Naming

- Tables: `snake_case` plural (`batches`, `health_tasks`).
- Columns: `snake_case`.
- TypeScript types: `PascalCase` matching the Drizzle inferred type (e.g. `Batch`, `BatchInsert`).
- Event types: `SCREAMING_SNAKE_CASE` (`BATCH_CREATED`, `HEALTH_TASK_COMPLETED`).
- Endpoints: REST, plural (`POST /batches`, `GET /batches/:id/health-tasks`).
- Files: `kebab-case.ts`.

---

## 7. Out of Scope (do not add to any spec)

- Hardware integrations (sensors, IoT)
- SMS / WhatsApp notifications (separate spec, future)
- Multi-currency reporting beyond per-farm currency
- Veterinarian portal / multi-role beyond `owner` + `worker`
- Marketplace / buyer-side features

---

## 8. References

The original specs (kept for traceability) are in `attached_assets/`. Validation findings are in `LampFarms_Spec_Validation_Report.md`. This conventions doc supersedes both where they conflict.
