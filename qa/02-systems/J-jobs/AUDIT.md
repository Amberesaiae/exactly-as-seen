# J — Background jobs / cron / edge

| Field | Value |
|-------|-------|
| Status | **CURATED** — cron active re-verified; client ensure + edge present |
| Related journeys | J, C tasks, B week/phase |
| Code roots | `supabase/functions/*`, cron SQL, `ensure-daily-tasks` |
| Spine | pg_cron → SQL RPCs; client ensure safety net |
| Inventory complete | **2026-07-17** |

---

## Inventory

| Writer | Verdict |
|--------|---------|
| `cron.job` → `cron_advance_batch_weeks` / `cron_generate_daily_tasks` / `cron_check_withdrawal_periods` / `cron_prune_idempotency_keys` | **SPINE** (SQL-only; not callable as farmer RPC — permission denied) |
| Edge functions (same names) | **ACTIVE** deploy surface |
| `ensureDailyBatchTasks` client | **KEEP** safety net (RLS may block some inserts; cron primary) |

## Greys

| ID | Status |
|----|--------|
| J-U01 cron.job active | **PASS** via `supabase db query --linked` (4 jobs active) |
| J-U02 batch_tasks today | **PASS** 38 rows / actives present |
| J-U05 ensure idempotent | **PASS** 38→38 double ensure |
| J-U06 edge vs SQL | **PASS** both present; live path is SQL cron |
| J-U03/U04 week advance / WD clear | **DEFER** controlled fixture |
| J-U07 timezone | **DEFER** |

Evidence: `qa/06-evidence/J-jobs/LIVE-2026-07-17.md` + live cron.job query.
