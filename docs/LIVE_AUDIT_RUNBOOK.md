# Live Audit Runbook — Canonical A–K

**Purpose:** Thorough production trust audit without relying on unit/Playwright shells.  
**Rule:** UI green alone is **FAIL**. Require toast/URL + intended writer + DB side-effects.

**Authority:** `docs/CANONICAL_JOURNEYS.md` + `docs/CANONICAL_RUNTIME.md`

---

## 0. Setup (once per session)

| Item | Value |
|------|--------|
| Frontend | `bun run dev` → `http://127.0.0.1:5173` |
| Backend | Hosted Supabase (`.env.local`) |
| User | Pre-confirmed (`LIVE_AUDIT_EMAIL` / `LIVE_AUDIT_PASS`) |
| Farm | Fresh name `Live Audit YYYY-MM-DD HHMM` |
| Houses | ≥4 free before multi-species B |
| Stock seed | `feed_ingredient` with qty + unit price before intensive C |

```bash
# Terminal A
bun run dev -- --host 127.0.0.1 --port 5173

# Terminal B — automated UI+DB pass (preferred)
export LIVE_AUDIT_EMAIL='…'   # pre-confirmed
export LIVE_AUDIT_PASS='…'
bun scripts/live-audit-thorough.mjs

# Or headed CDP attach
# scripts/start-chrome-cdp.cmd then:
# bun scripts/live-audit-cdp.mjs
```

Artifacts: `docs/live-audit-artifacts/thorough/`  
Latest evidence: `docs/live-audit-artifacts/thorough/SESSION.md`

---

## 1. Pass criteria (copy into session log)

| Intent | UI | Network (ideal) | DB must show |
|--------|-----|-----------------|--------------|
| **A** Login/setup | dashboard | — | farm `setup_complete`, ≥1 house |
| **B** Create flock | batch detail URL | `create_batch` | batch active; house occupied; health_tasks + vaccination_schedule rows |
| **F** Stock purchase | qty up toast | `stock_purchase` | stock_transactions + stock_lots + **expenses** (`auto:stock`) |
| **C** Day feed | confirmed toast | `confirm_day_feed` | feed_logs today; stock↓ if matched; expense if intensive & not skip |
| **C** Day water | logged | `log_day_water` | water_records; expense if rate+intensive |
| **D** Care complete | task done | `complete_health_task` | health_tasks completed; dual vax if vaccine |
| **E** Ready-made buy | saved | (multi today) | formulation + **expense always** |
| **G** Egg gate / sale | block or sale | `record_egg_*` | gate toast OR sales+revenue |
| **H** Mortality | pop −N | `record_mortality` | mortality + population |
| **I** Terminate | closed | `terminate_batch` | status terminated; house free |
| **K** Finance hub | numbers | — | expenses/revenue match session writes |
| **J** Jobs | — | — | cron.job active; batch_tasks for today |

**Verdict key:** PASS · FAIL (ledger lie) · FAIL (gate) · SKIP · PARTIAL

---

## 2. Order (do not scramble)

```
A → B (broiler intensive) → F (seed feed stock) → C feed+water → D care
  → E ready-made → K reconcile → H mort → G eggs gate
  → (optional) B×3 other species → I terminate spare → J cron SQL
```

Flexible Book now = second pass on duck/semi-intensive only.

---

## 3. SQL proof snippets (Supabase SQL editor or CLI)

Replace `:farm_id`.

```sql
-- Farm snapshot
SELECT id, name, setup_complete FROM farms WHERE id = :farm_id;

-- Active batches + houses
SELECT b.id, b.name, b.species, b.status, b.current_population, b.production_system, h.name AS house
FROM batches b LEFT JOIN houses h ON h.id = b.house_id
WHERE b.farm_id = :farm_id ORDER BY b.created_at DESC;

-- Care seed after B
SELECT count(*) FILTER (WHERE completed_at IS NULL) AS open_tasks,
       count(*) AS total_tasks
FROM health_tasks WHERE batch_id = :batch_id;
SELECT vaccine_name, administered FROM vaccination_schedule WHERE batch_id = :batch_id;

-- F purchase always ledgers
SELECT id, quantity, unit_price_pesewas, transaction_type, created_at
FROM stock_transactions WHERE farm_id = :farm_id ORDER BY created_at DESC LIMIT 5;
SELECT id, category, amount_pesewas, source, source_ref, description, date
FROM expenses WHERE farm_id = :farm_id ORDER BY created_at DESC LIMIT 10;

-- C feed / water
SELECT * FROM feed_logs WHERE farm_id = :farm_id AND date = CURRENT_DATE;
SELECT * FROM water_records WHERE farm_id = :farm_id AND date = CURRENT_DATE;
SELECT id, current_quantity, category, unit_price_pesewas FROM stock_items WHERE farm_id = :farm_id;

-- D dual vax
SELECT id, product_name, task_type, completed_at FROM health_tasks
WHERE batch_id = :batch_id AND task_type ILIKE '%vacc%' ORDER BY scheduled_date;
SELECT vaccine_name, administered, administered_at FROM vaccination_schedule WHERE batch_id = :batch_id;

-- Today tasks
SELECT batch_id, task_type, due_date, completed_at FROM batch_tasks
WHERE farm_id = :farm_id AND due_date = CURRENT_DATE;

-- Sales / mort
SELECT * FROM revenue WHERE farm_id = :farm_id ORDER BY created_at DESC LIMIT 5;
SELECT * FROM mortality_records WHERE farm_id = :farm_id ORDER BY created_at DESC LIMIT 5;

-- J cron
SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobid;
```

CLI (linked project):

```bash
supabase db query --linked "SELECT jobname, active FROM cron.job"
```

---

## 4. Failure taxonomy

| Class | Example | Severity |
|-------|---------|----------|
| Ledger lie | Toast OK, no expense/revenue | **P0** stop |
| Dual-table lie | Care done, Vaccines not | **P0** |
| Silent partial | Stock up, expense missing | **P0** |
| Gate wrong | Eggs pre W19 / sale under withdrawal | **P0** |
| UX only | Flicker, banner | **P2** later |

---

## 5. Session log template

```markdown
# Live thorough session YYYY-MM-DD

**App:** http://127.0.0.1:5173 · **Project:** lampfarms  
**User:** … · **Farm id:** …

| Intent | UI | Writer | DB | Verdict | Notes |
|--------|----|--------|-----|---------|-------|
| A | | | | | |
| B | | | | | |
| F | | | | | |
| C feed | | | | | |
| C water | | | | | |
| D | | | | | |
| E | | | | | |
| K | | | | | |
| H | | | | | |
| G | | | | | |
| I | | | | | |
| J | | | | | |

## FAILs (P0 first)
1. …
```

---

## 6. Related

- Prior headed findings: `docs/live-audit-artifacts/CDP_LIVE_AUDIT_SESSION.md`
- Automated thorough runner: `scripts/live-audit-thorough.mjs`
- Shell smoke only (not trust gate): `e2e/*.spec.ts`
