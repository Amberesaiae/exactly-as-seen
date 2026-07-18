# Deferred: Supabase & Docker apply guide

**Status:** Code is on `main` (PR #1 merged as `990283f`).  
**Not yet applied:** Live Supabase project migrations, Edge Function deploys, self-hosted Docker stack.  
**Audience:** When you bring up Supabase CLI and/or `supabase-self-hosted/` Docker.

This document records **what the app expects from the database and jobs**, so nothing is lost while infra is offline.

---

## 1. What already landed in git (no DB required)

These ship with the frontend and work as soon as you point env at a project **that has been migrated**.

| Area | Files / behavior |
|---|---|
| Canonical contracts | `src/lib/canonical.ts`, `src/lib/production-system.ts`, `docs/CANONICAL_RUNTIME.md` |
| Money writes | Expenses/revenue use `amount_pesewas` only (never dropped `amount`) |
| Finance UI categories | DB CHECK slugs (`feed_and_nutrition`, …, `other_revenue`) |
| Intensive synergy | `deep_litter` / `cage` count as intensive for auto stock/expense |
| Stock quality UI | `A` \| `B` \| `C` \| `damaged` (default `A`) |
| Batch create | Seeds `health_tasks` via `generateAutoTasks`; week/phase from start date |
| Conflicts | C1–C8 in `medication-conflicts.ts` (C6/C7 WARN) |
| Eggs | `egg_collections` table name; graded inventory RPC with fallback |
| Types | `feed_logs`, RPC signatures in `src/integrations/supabase/types.ts` |

**Without applying the new migration**, some of the above will **fail at runtime** against an older DB (missing table/RPC, category CHECK, quality CHECK, etc.). Prefer applying **all migrations in order** before QA.

---

## 2. Migration inventory (apply in timestamp order)

Location: `supabase/migrations/`

| File | Role |
|---|---|
| `20260414063547_…` … `20260414080008_…` | Core schema, RLS, early RPCs/jobs |
| `20260414080004_migration_5B.sql` | **Drops** `expenses.amount`, `revenue.amount`, stock/feed legacy price cols |
| `20260414080005_rpc_and_jobs.sql` | Cron SQL + dashboard/FIFO RPCs (later patched) |
| `20260414080006_auto_ledger_constraints.sql` | Unique `(source, source_ref)` for auto ledger |
| `20260525000000_fourth_sprint.sql` | Stock quality A/B/C/damaged; egg rename; weekly health RPCs |
| `20260526000000_fifth_sprint_finance_canonical.sql` | Finance category + payment CHECKs |
| **`20260711000000_contract_alignment.sql`** | **New — required for current main** |

### What `20260711000000_contract_alignment.sql` adds/changes

1. **`public.feed_logs`**  
   - Columns: `id`, `farm_id`, `batch_id`, `date`, `quantity_kg`, `feed_type`, `notes`, `created_at`  
   - Unique `(batch_id, date)`  
   - RLS: owner via `farms.user_id = auth.uid()`

2. **`assert_farm_owner(p_farm_id)`**  
   - Used by DEFINER RPCs so clients cannot pass another farm’s UUID.

3. **`cron_advance_batch_weeks()` rewrite**  
   - Catch-up from `start_date` (no “Sunday hour 0 only” window).

4. **`cron_generate_daily_tasks()` rewrite**  
   - No local-hour gate; safe to invoke hourly from cron/Edge.

5. **New RPCs**  
   - `get_graded_egg_inventory(batch, farm, size?)`  
   - `get_farm_financial_stats(farm)`

6. **Hardened existing RPCs** (ownership + correct tables)  
   - `allocate_fifo_by_quality`  
   - `get_egg_inventory`  
   - `bulk_complete_health_tasks`  
   - `get_weekly_health_summary`

7. **GRANTs** to `authenticated` for the above.

Full human contract: `docs/CANONICAL_RUNTIME.md`.

---

## 3. When Supabase CLI is ready (hosted project)

```bash
cd /path/to/exactly-as-seen

# Link project (once)
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>

# Push all local migrations (including 20260711…)
supabase db push

# Optional: regenerate types after push
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Env (frontend)

Copy from `.env.example` → `.env.local` (or Vercel env):

| Variable | Required | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon key |
| `VITE_VAPID_PUBLIC_KEY` | No | Push |
| `VITE_DEFAULT_CURRENCY` | No | Default `GHS` |

### Edge Functions (after DB is live)

Wrappers under `supabase/functions/`:

| Function | Calls |
|---|---|
| `advance-batch-weeks` | `cron_advance_batch_weeks` |
| `generate-daily-tasks` | `cron_generate_daily_tasks` |
| `check-withdrawal-periods` | `cron_check_withdrawal_periods` |
| `prune-idempotency-keys` | `cron_prune_idempotency_keys` |
| `push-alerts` | Web Push (needs VAPID secrets) |

```bash
supabase functions deploy advance-batch-weeks
supabase functions deploy generate-daily-tasks
supabase functions deploy check-withdrawal-periods
supabase functions deploy prune-idempotency-keys
# optional
supabase functions deploy push-alerts
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:support@example.com
```

Schedule via Supabase Dashboard → Edge Functions → Cron, or `pg_cron` if enabled (see older `rpc_and_jobs` migration). Preferred semantics after contract alignment:

| Job | Suggested schedule | Notes |
|---|---|---|
| Advance batch weeks | Hourly | Catch-up is idempotent by expected week |
| Generate daily tasks | Hourly | Upserts daily tasks for farm-local “today” |
| Check withdrawals | Every 4h | Clears `has_active_withdrawal` when dates pass |
| Prune idempotency | Daily ~03:00 UTC | Deletes expired keys |

---

## 4. When Docker self-hosted is ready

Repo path: `supabase-self-hosted/` (compose + volumes; see that folder’s `README.md`).

Suggested order:

1. Bring stack up per `supabase-self-hosted/README.md` (Postgres, Auth, REST, etc.).
2. Apply SQL migrations against that Postgres (same files under `supabase/migrations/`):
   - Either mount and run via Supabase CLI against local URL, or  
   - `psql` each file in timestamp order ending with `20260711000000_contract_alignment.sql`.
3. Point app env at local API URL + anon key from generated keys (`generate-keys` scripts in self-hosted).
4. Deploy Edge Functions to local functions runtime if enabled, or call SQL cron functions on a schedule from host cron / compose sidecar.

**Do not** assume `pg_cron` exists in every Docker profile; if the extension is missing, use Edge Function schedules or an external cron hitting the SQL functions.

---

## 5. Manual SQL apply (no CLI)

If you only have the Supabase SQL Editor or a raw Postgres client:

1. Ensure prior migrations through `20260526000000_fifth_sprint_finance_canonical.sql` are already applied (or apply full chain from oldest).
2. Open and run **entire** file:  
   `supabase/migrations/20260711000000_contract_alignment.sql`
3. Confirm:

```sql
-- tables
SELECT to_regclass('public.feed_logs');

-- functions
SELECT proname FROM pg_proc
WHERE proname IN (
  'assert_farm_owner',
  'get_graded_egg_inventory',
  'get_farm_financial_stats',
  'cron_advance_batch_weeks',
  'cron_generate_daily_tasks'
);

-- smoke: should error with Not authenticated when run as anon without JWT
-- (from app with user session, RPC should succeed for own farm)
```

---

## 6. Post-apply verification checklist

- [ ] Create farm + batch with **deep_litter** broiler → health tasks seeded.
- [ ] Complete medication with cost → `expenses` row `category = health_and_medicine`, `amount_pesewas` set, no `amount` column error.
- [ ] Stock purchase with quality **A** → lot created; purchase expense `auto:stock`.
- [ ] Manual finance expense each of the 9 categories succeeds (CHECK).
- [ ] Egg collection + sale → inventory RPC works; revenue `egg_sales`.
- [ ] Dashboard loads without missing `get_farm_financial_stats` / `feed_logs` errors.
- [ ] Call `cron_advance_batch_weeks` twice → week does not overshoot expected week from `start_date`.

---

## 7. Client vs server responsibility (until Docker/Supabase is up)

| Concern | Today | After infra |
|---|---|---|
| Domain rules / UI enums | Client (`canonical.ts`) | Same |
| Ledger integrity | Client synergy + unique indexes (after migrate) | Prefer transactional RPCs later |
| Week advance | Stale if jobs not scheduled | Edge/`pg_cron` |
| Offline writes | Partial Dexie outbox | Still product gap |

Until migrations run, treat **main** as “frontend ready, database contract pending.”

---

## 8. Related docs

| Doc | Purpose |
|---|---|
| `docs/CANONICAL_RUNTIME.md` | Enums, money, production system, conflicts |
| `README.md` | Quick start, env, push notes |
| `specs/00_CONVENTIONS.md` | Domain conventions + updated stack table |
| `supabase-self-hosted/README.md` | Docker compose self-host |
| PR #1 | Full change list: https://github.com/Amberesaiae/exactly-as-seen/pull/1 |

---

## 9. One-line summary for later you

> When Supabase/Docker is up: run migrations through **`20260711000000_contract_alignment.sql`**, deploy Edge cron wrappers, set `VITE_SUPABASE_*`, then walk section 6 checklist. No re-implementation of enums needed — use `src/lib/canonical.ts`.
