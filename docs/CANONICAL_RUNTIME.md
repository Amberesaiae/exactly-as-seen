# Canonical Runtime Contracts

**Status:** Living document (updated with contract-alignment sprint)  
**Stack reality:** React 18 + Vite + Supabase (Postgres + RLS + Edge Functions + RPCs).  
**Not in use:** Express, Drizzle, pg-boss, `artifacts/api-server` (legacy rewritten-spec layout only).

This document is the **runtime source of truth** for enums, money, production systems, and cross-module synergy. Domain research in `deprecated specs/` remains useful for protocols; it is **not** a backend blueprint.

Code must import slugs from `src/lib/canonical.ts` (and `src/lib/production-system.ts`). Do not invent alternate category strings in UI or hooks.

---

## 1. Money

| Rule | Value |
|---|---|
| Storage | `amount_pesewas` / `*_pesewas` as `bigint`/`integer` (integer minor units) |
| Display | Divide by 100 → major units (GHS/NGN/CFA) |
| Dropped columns | `expenses.amount`, `revenue.amount`, stock/feed `unit_price`/`total_cost` (migration 5B) |
| Write path | Always set `*_pesewas`; never write dropped `amount` columns |
| Helpers | `toPesewas()`, `fromPesewas()` in `canonical.ts` |

---

## 2. Finance categories (DB CHECK)

### Expenses (9)

`feed_and_nutrition` · `health_and_medicine` · `labor_and_workers` · `utilities_and_services` · `equipment_and_tools` · `transport_and_delivery` · `housing_and_facilities` · `chicks_and_birds` · `other_expenses`

### Revenue (5)

`egg_sales` · `bird_sales` · `meat_sales` · `manure_sales` · `other_revenue`

### Payment

- Methods: `cash` · `mobile_money` · `bank_transfer` · `credit`  
- Status: `paid` · `pending` · `partial`  
- Alias: UI must not send `momo` — use `normalizePaymentMethod()`

### Idempotent auto-ledger

Unique index on `(source, source_ref)` where `source_ref IS NOT NULL`.  
Synergy sources: `auto:feed`, `auto:health`, `auto:water`, `auto:vaccination`, `auto:eggs`, `auto:sale`, `auto:batch`, `auto:stock` (`LEDGER_SOURCES`).

---

## 3. Production system

| Stored value | Intensive (auto stock/expense)? | Foraging? |
|---|---|---|
| `intensive` | Yes | No |
| `deep_litter` | Yes | No |
| `cage` | Yes | No |
| `semi_intensive` | No | Yes (species rules) |
| `free_range` | No | Yes |
| `pasture` | No | Yes |

Use `isIntensiveSystem()` / `isSemiIntensiveSystem()` — never `=== 'intensive'` alone.

Foraging modifiers (duck week 6+, turkey week 8+) live in `getForagingModifier()` in `health-data.ts`.

---

## 4. Stock quality

`stock_lots.quality_grade` ∈ `A` · `B` · `C` · `damaged`  
Default for new lots: **`A`**.  
FIFO auto-allocation excludes `damaged`.

---

## 5. Eggs

| Concern | Canonical |
|---|---|
| Table | `egg_collections` (renamed from `egg_records`) |
| Inventory RPCs | `get_graded_egg_inventory(batch, farm, size?)` then fallback `get_egg_inventory` |
| Sales | `egg_sales` + synergy revenue `egg_sales` category |

---

## 6. Daily feed log

Table: **`feed_logs`** (`batch_id`, `farm_id`, `date`, `quantity_kg`, …)  
Unique `(batch_id, date)`. Used by Health operational tasks and Dashboard.

---

## 7. Batch lifecycle

| Field | Rule |
|---|---|
| Create | Seed `health_tasks` via `generateAutoTasks()` |
| Week | Prefer catch-up from `start_date` (`cron_advance_batch_weeks`) |
| Age in UI | `getBatchAge(start_date, species)` for prescriptions; keep DB week synced via job |
| Phase | Create uses `getBatchAge().phase`; SQL `recompute_batch_phase` on advance |

XState `batch-fsm` is **test/reference** until wired to UI; do not assume it drives production.

---

## 8. Security (RPCs)

All `SECURITY DEFINER` RPCs used by the client must call `assert_farm_owner(p_farm_id)` so RLS cannot be bypassed by guessing UUIDs.

Owned by migration `20260711000000_contract_alignment.sql`.

---

## 9. Medication conflicts (C1–C8)

| Code | Severity (runtime) |
|---|---|
| C1 Coccidiostat + Sulfa | BLOCK |
| C2 Two antibiotics overlap | BLOCK |
| C3 Dewormer + Coccidiostat same day | WARN |
| C4 Live vaccine ± antibiotic 72h | BLOCK |
| C5 Enrofloxacin + other antibiotic | BLOCK |
| C6 Charcoal + oral same day | WARN (lean timing) |
| C7 Calcium + Tetracycline same day | WARN (lean timing) |
| C8 Live vaccine + chlorinated water | BLOCK |

Implementation: `src/lib/medication-conflicts.ts`.

---

## 10. Specs vs code

| Document set | Use for |
|---|---|
| `docs/CANONICAL_RUNTIME.md` + `src/lib/canonical.ts` | Runtime enums, money, synergy |
| `specs/00_CONVENTIONS.md` | Domain corrections (week 19 eggs, 9 containers, etc.) |
| `deprecated specs/` | Research protocols, dosing, West Africa context — refine into data, not Python services |
| `specs/01_MASTER_ARCHITECTURE.md` | Partial; topology still describes Express — **defer to this file for stack** |

---

## 11. Apply migration

```bash
# Supabase CLI
supabase db push
# or paste supabase/migrations/20260711000000_contract_alignment.sql in SQL editor
```
