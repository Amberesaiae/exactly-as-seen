# Writer Map — Structural Integrity Kill List

**Purpose:** Single inventory of domain writes. Architecture is only “baked” when every **KEEP** path is sole, and every **KILL** path is gone.  
**Authority:** `docs/CANONICAL_JOURNEYS.md` — one intent → one writer → one side-effect set.  
**Updated:** 2026-07-17 (from live code scan, not docs claims)  
**Deep QA home:** [`qa/`](../qa/) — system packs + acid methodology (this map is inventory input, not a closed audit)

### Verdict codes

| Code | Meaning |
|------|---------|
| **SPINE** | Sole intended writer (RPC). Must be only production path. |
| **KEEP** | Legitimate non-intent write (settings, prefs, manual ledger). |
| **KILL** | Dual/fallback writer — deletes integrity. Remove after spine sole. |
| **FOLD** | Move into spine RPC (not delete behavior, delete client multi-step). |
| **OFFLINE-OK** | Allowed only as `queueRpc` of SPINE args — never raw table for same intent. |
| **OFFLINE-KILL** | Raw `queueWrite` of domain tables that have an intent RPC. |

---

## 0. Executive summary

| Intent | Spine exists? | Sole path today? | Integrity |
|--------|---------------|------------------|-----------|
| A Onboard | Partial (auth + tables) | Mostly direct tables | Acceptable (secondary) |
| B Create flock | `create_batch` | **Yes** (fail-closed) | **OK** |
| C Day feed | `confirm_day_feed` | FE sole after 2026-07-17 K1/K2 kill; RLS insert still open (F-C-F-005) | **Near sole** — re-prove in `qa/02-systems/C-today-ops-feed` |
| C Day water | `log_day_water` | Mostly yes + Book now synergy | **Partial** |
| D Care complete | `complete_health_task` | FE sole after 2026-07-17 K5/K6 kill | **Near sole** — re-prove in `qa/02-systems/D-care-health` |
| D Vaccine admin | Should be same RPC | **No** — schedule update + expense | **Broken** |
| E Ready-made buy | **Missing** | Client multi-write | **Broken** |
| E Custom/concentrate | **Missing** | Multi-insert + synergy | **Broken** |
| F Stock purchase | `stock_purchase` | FE sole after 2026-07-17 K3 kill | **Near sole** — re-prove in `qa/02-systems/F-stock` |
| F Stock usage | FIFO RPC + client | Split | **Partial** |
| G Egg collection | `record_egg_collection` | Mostly sole | **OK-ish** |
| G Egg sale | `record_egg_sale` | FE sole after 2026-07-17 K4 kill | **Near sole** — re-prove in `qa/02-systems/G-eggs` |
| H Mortality | `record_mortality` | Sole | **OK** |
| H Bird sale | `record_bird_sale` | Sole via synergy wrapper | **OK-ish** |
| I Terminate | `terminate_batch` | Sole | **OK** |
| J Jobs | cron SQL + edge | N/A | **OK** |
| K Manual finance | direct insert | Intentional | **KEEP** |
| Offline domain | mixed | **No** | **Broken** |

**Integrity score (write model):** ~4/12 primary intents are sole-path. Rest are dual or missing spine.

---

## 1. Intent writers (money / lifecycle) — full map

### B — Start flock

| Site | Kind | Tables / effects | Verdict |
|------|------|------------------|---------|
| `useBatchCreateLogic.createBatch` → `rpc('create_batch')` | SPINE | batches, houses.occupied, health_tasks, vaccination_schedule, activity_log | **SPINE / KEEP** |
| Offline: `queueRpc('create_batch')` | OFFLINE-OK | same | **KEEP** |
| Any client multi-insert create | — | — | **none left** |

**Done for spine.** Residual: seed quality (TEXT medication_id fixed).

---

### C — Day feed

| Site | Kind | Tables / effects | Verdict |
|------|------|------------------|---------|
| `useFeedData.confirmDayFeed` → `rpc('confirm_day_feed')` | SPINE | feed_logs, stock FIFO/qty, expenses optional | **SPINE** |
| `useHealthData` day feed → same RPC | SPINE | same | **SPINE** (duplicate entry — OK if both call RPC only) |
| `useFeedData` on `rpcErr` → `feed_logs.insert` + `autoDeductStock` + `autoCreateExpense` | dual | partial ledger | **KILLED 2026-07-17** (F-C-F-001) — fail closed toast only |
| Offline feed: was `queueWrite('feed_logs')` only | dual offline | no stock/expense | **KILLED 2026-07-17** (F-C-F-002) — both paths `queueRpc('confirm_day_feed')` |
| Book now: `autoCreateExpense` | optional manual | expenses | **KEEP** (user intent, source_ref `:book`); Health re-RPC removed F-C-F-003 |

**Kill order (done FE):** fallback deleted; offline `queueRpc`. Residual: RLS client INSERT (F-C-F-005); dual FE copies (F-C-F-006); acid greys open in qa pack.

---

### C — Day water

| Site | Kind | Tables / effects | Verdict |
|------|------|------------------|---------|
| `useWaterLogic.logWater` → `rpc('log_day_water')` | SPINE | water_records, expenses if ledger | **SPINE** |
| Offline: `queueRpc('log_day_water')` | OFFLINE-OK | same | **KEEP** |
| Book now: `autoCreateExpense` | optional | expenses | **KEEP** |

**Near sole.** No KILL required except ensure no other water insert paths.

---

### D — Care complete (This Week / meds)

| Site | Kind | Tables / effects | Verdict |
|------|------|------------------|---------|
| `useMedicationLogic.markTaskComplete` → `rpc('complete_health_task')` | SPINE | health_tasks, vaccination_schedule, expenses, withdrawal flags | **SPINE** |
| Offline: `queueRpc('complete_health_task')` | OFFLINE-OK | same | **KEEP** |
| `runPostCompletionSideEffects` → was stock+expense + seed | dual post-RPC | double ledger risk | **KILLED money 2026-07-17** (F-D-002) — seed only remains |
| Book now toast → synergy | optional | expenses/stock | **KEEP** |
| `bulk_complete_health_tasks` RPC | SPINE bulk | health_tasks + schedule + expense | **SPINE** |

**Integrity hole:** intensive stock/expense runs **again** client-side after RPC already auto-ledgered cost → double-ledger risk if both fire.

**Kill order:** remove client stock/expense from `runPostCompletionSideEffects` if RPC already ledgered; fold stock deduct into RPC if product needs it.

---

### D — Vaccine administer (Vaccines tab)

| Site | Kind | Tables / effects | Verdict |
|------|------|------------------|---------|
| `useVaccinationLogic.markVaccineAdministered` → was schedule.update | dual | schedule only | **KILLED 2026-07-17** (F-D-001) |
| now → `rpc('complete_health_task')` on matching health_task | SPINE | all | **SPINE** |
| + `seedPostVaccinationSupplements` | side | health_tasks | **KEEP** after single RPC |
| Orphan schedule (no health_task) | fail-closed toast | none | **ACCEPT** residual |

**Was second care product; FE sole after K5.**

---

### E — Plan / buy feed

| Site | Kind | Tables / effects | Verdict |
|------|------|------------------|---------|
| `record_ready_made_purchase` (SQL) + `ReadyMadeFeed` | SPINE S1 | formulation + expense always | **SPINE** (2026-07-17) |
| `confirm_formulation_allocation` (SQL) + Custom/Concentrate | SPINE S2 | formulation + ingredients + intensive FIFO/expense | **SPINE** (2026-07-17) |
| ~~multi-write + synergy~~ | dual | partial money | **KILLED** via S1/S2 |
| `useCustomFormulationSolver` → `feed_recipes.insert` | catalog | recipes | **KEEP** |

**S1/S2 landed.** Residual: ready-made stock-in optional; E×C allocation windows.

---

### F — Stock

| Site | Kind | Tables / effects | Verdict |
|------|------|------------------|---------|
| `recordTransaction` purchase → `rpc('stock_purchase')` | SPINE | tx, lots, qty, expense | **SPINE** |
| Same function fallthrough → tx insert + lot + item update + expense insert | dual | partial money | **KILLED 2026-07-17** (F-F-001) |
| Offline purchase → `queueRpc('stock_purchase')` | OFFLINE-OK | | **KEEP** |
| Usage → `rpc('stock_usage')` / offline `queueRpc` | SPINE | tx + FIFO + qty | **SPINE** (K9 FIXED 2026-07-17) |
| `addStockItem` → stock_items insert | catalog | | **KEEP** (master data) |
| `autoDeductStock` (synergy) | helper dual | lots/qty | **KILL** as primary; only inside RPC |

---

### G — Eggs

| Site | Kind | Tables / effects | Verdict |
|------|------|------------------|---------|
| `recordCollection` → `rpc('record_egg_collection')` | SPINE | egg_collections | **SPINE** |
| Offline → `queueRpc` | OFFLINE-OK | | **KEEP** |
| `recordSale` → `rpc('record_egg_sale')` | SPINE | egg_sales, revenue | **SPINE** |
| Fallthrough → `egg_sales.insert` + `autoCreateRevenue` | dual | partial revenue | **KILLED 2026-07-17** (F-G-001) |
| Offline sale → `queueRpc` | OFFLINE-OK | | **KEEP** |

---

### H — Mortality / bird sale

| Site | Kind | Tables / effects | Verdict |
|------|------|------------------|---------|
| `batch-utils.recordMortality` → `rpc('record_mortality')` | SPINE | mortality_records, population | **SPINE** |
| Offline → `queueRpc` | OFFLINE-OK | | **KEEP** |
| `synergy.recordBirdSale` → `rpc('record_bird_sale')` | SPINE | revenue, population, etc. | **SPINE** |
| Offline bird sale → `queueRpc` | OFFLINE-OK | | **KEEP** |

**OK.** Do not re-open.

---

### I — Terminate

| Site | Kind | Tables / effects | Verdict |
|------|------|------------------|---------|
| `TerminationDialog` → `rpc('terminate_batch')` | SPINE | batch status, house free, revenue optional | **SPINE** |
| Offline → `queueRpc` | OFFLINE-OK | | **KEEP** |

**OK.**

---

### K — Manual ledger / settings (not journey core)

| Site | Kind | Verdict |
|------|------|---------|
| `useFinanceData` expenses/revenue insert | manual farmer ledger | **KEEP** |
| Settings farm/houses/prefs/profile | config | **KEEP** |
| Market `config_overrides` | config | **KEEP** |
| Push subscriptions | device | **KEEP** |
| Batch notes / production_system update | metadata | **KEEP** (or soft RPC later) |
| `ensure-daily-tasks` batch_tasks upsert | ops safety net | **KEEP** until cron 100% trusted; then optional |
| `activity_log` inserts | audit noise | **KEEP** (or fold into RPCs only) |

---

## 2. Cross-cutting dual systems

### 2.1 Care identity (three tables)

| Table | Role today | Target |
|-------|------------|--------|
| `batch_tasks` | Daily feed/water checklist | Keep as **ops checklist** only |
| `health_tasks` | Protocol + meds + supplements | **Sole care plan + completion** |
| `vaccination_schedule` | Parallel vax rows | **Derived or write-only via complete RPC** — no FE primary update |

| Writer | Verdict |
|--------|---------|
| `complete_health_task` updates both health + schedule | **SPINE** |
| FE `vaccination_schedule.update` | **KILL** |
| `syncHealthTaskFromSchedule` / schedule sync helpers as primary | **KILL** after FE uses RPC only |
| `seedPostVaccinationSupplements` client upsert | **FOLD into RPC** preferred |

### 2.2 synergy.ts

| Export | Verdict |
|--------|---------|
| `autoCreateExpense` for Book now + manual | **KEEP** (user-triggered, explicit source_ref) |
| `autoCreateExpense` as automatic after RPC | **KILL** |
| `autoCreateRevenue` as automatic after sale | **KILL** once sale RPC sole |
| `autoDeductStock` automatic | **KILL** — only inside RPC |
| `recordBirdSale` wrapping RPC | **KEEP** as thin client wrapper |

### 2.3 sync.ts offline

| Pattern | Verdict |
|---------|---------|
| `queueRpc(intent, args)` | **KEEP / OFFLINE-OK** |
| `queueWrite('feed_logs'\|'expenses'\|'health_tasks'\|…)` for intents that have RPC | **OFFLINE-KILL** |
| `queueWrite` for prefs/settings/houses | **KEEP** |

---

## 3. Kill list (execution order)

Do **not** reorder casually — money and dual care first.

| # | Kill / fold | File(s) | Why | Acceptance |
|---|-------------|---------|-----|------------|
| **K1** | Feed RPC fallback multi-write | `useFeedData.ts` | Partial log without stock | **DONE FE 2026-07-17** — re-prove C-F-U07 live |
| **K2** | Offline feed_logs-only queue | `useFeedData.ts` (Health already OK) | Offline ≠ online | **DONE FE 2026-07-17** — re-prove C-F-U10 live |
| **K3** | Stock purchase fallthrough | `useStockData.ts` | Money partial | **DONE FE 2026-07-17** — re-prove F-U11 live |
| **K4** | Egg sale fallthrough | `useEggData.ts` | Revenue partial | **DONE FE 2026-07-17** — re-prove G-U08 live |
| **K5** | Vaccine admin multi-write | `useVaccinationLogic.ts` | Second care product | **DONE FE 2026-07-17** — re-prove D-U04 live |
| **K6** | Client intensive stock/expense after complete RPC | `care-completion.ts` | Double-ledger risk | **DONE FE 2026-07-17** — re-prove D-U12 live |
| **K7** | Ready-made multi-write | `ReadyMadeFeed.tsx` | Purchase not atomic | **DONE 2026-07-17** S1 |
| **K8** | Custom / concentrate multi-write | Custom + Concentrate | Consumption+money split | **DONE 2026-07-17** S2 |
| **K9** | Stock usage multi-step | `useStockData.ts` | Non-atomic usage | **DONE 2026-07-17** `stock_usage` RPC |
| **K10** | OFFLINE-KILL table queues for domain intents | `sync` call sites | Dual offline product | Grep clean: no queueWrite of feed_logs/expenses/… for those intents |

**Already OK (do not touch):** B create, H mortality, I terminate, water primary RPC, manual finance.

---

## 4. Missing spine (must build, not kill)

| ID | Intent | New/extend RPC | Side-effects |
|----|--------|----------------|--------------|
| **S1** | Ready-made feed purchase | `record_ready_made_purchase` | **DONE** formulation + expense always (stock-in DEFER) |
| **S2** | Custom formulation confirm | `confirm_formulation_allocation` | **DONE** stock out FIFO + intensive expense + formulation |
| **S3** | Stock usage | `stock_usage` | **DONE** tx + FIFO + qty (K9) |
| **S4** | Complete care intensive stock | extend `complete_health_task` | optional FIFO by product_name match |
| **S5** | Post-vax supplements | extend `complete_health_task` when vax | insert supplement tasks |

S1–S3 landed 2026-07-17. Residual: optional ready-made stock-in; formulation vs day-feed allocation windows.

---

## 5. File → role cheat sheet

| File | Spine role today | Integrity role |
|------|------------------|----------------|
| `useBatchCreateLogic.ts` | sole create | **Good** |
| `useFeedData.ts` | RPC + **KILL fallback** | **Bad** |
| `useWaterLogic.ts` | sole water | **Good** |
| `useMedicationLogic.ts` | RPC + post dual | **Bad** |
| `useVaccinationLogic.ts` | dual primary | **Bad** |
| `useStockData.ts` | purchase + usage RPC-only (K3/K9) | **Sole** purchase+usage |
| `useEggData.ts` | collection+sale RPC-only after K4 | **Near sole** |
| `batch-utils.ts` | sole mortality | **Good** |
| `TerminationDialog.tsx` | sole terminate | **Good** |
| `synergy.ts` | helpers / dual | **Trim** |
| `care-completion.ts` | sync + seed dual | **Fold/trim** |
| `ReadyMadeFeed.tsx` / formulation comps | S1/S2 RPC | **Near sole** |
| `ensure-daily-tasks.ts` | checklist upsert | **OK temporary** |
| `sync.ts` | outbox | **RPC-only for domain** |

---

## 6. Structural acceptance (when integrity is real)

For each intent A–K money/lifecycle:

1. **Network:** only `rest/v1/rpc/<name>` on success path (no insert to expenses/feed_logs/… from client for that intent).  
2. **DB:** side-effect set under one `source` + `source_ref` (or RPC-owned rows).  
3. **Failure:** RPC error → no partial domain rows from client.  
4. **Offline:** queue payload === online RPC args.  
5. **Code:** grep for KILL sites returns zero.

When 1–5 hold, architecture is in the spine. Until then, UI completeness is cosplay.

---

## 7. Workstream (no dilly-dally)

```
Week shape (suggested):
  PR1: K1+K2 feed sole + offline RPC
  PR2: K3+K4 stock/egg fallthrough kill
  PR3: K5+K6 vaccine + complete post-effects
  PR4: S1 ready-made purchase RPC
  PR5: S2 formulation confirm RPC + K7/K8
  PR6: S3 stock usage + K9
  PR7: OFFLINE-KILL sweep + structural grep CI
```

No new species UI, no doc score rewrites, no PWA polish until K1–K6 closed.

---

## 8. Related

- Journeys: `docs/CANONICAL_JOURNEYS.md`  
- Runtime enums: `docs/CANONICAL_RUNTIME.md`  
- Live evidence: `docs/live-audit-artifacts/thorough/SESSION.md`  
- This file is the **integrity backlog**. Prefer killing rows here over adding modules.

---

*Scan source: `src/hooks`, `src/lib`, `src/components` write sites. Re-run inventory after each PR: update Verdict column only when sole-path proven.*
