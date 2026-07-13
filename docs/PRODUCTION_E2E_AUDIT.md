# Production E2E System Audit — Research Specs vs Runtime

**Date:** 2026-07-13  
**Branch:** `feat/canonical-journeys`  
**Mindset:** Production-ready. No credit for UI that only looks finished.  
**Method:** Code + schema + edge + live headed session evidence, scored against research domain in `deprecated specs/` and contracts in `docs/CANONICAL_*.md`.

---

## 0. Authority (what is truth)

| Rank | Source | Role |
|------|--------|------|
| 1 | `docs/CANONICAL_JOURNEYS.md` + `docs/CANONICAL_RUNTIME.md` + migrations | Runtime product contract |
| 2 | `src/lib/canonical.ts`, `ledger-policy.ts`, `production-system.ts`, `care-completion.ts` | Executable rules |
| 3 | `specs/00_CONVENTIONS.md` (C6/C7 = WARN) | Domain severity corrections |
| 4 | **`deprecated specs/Lampfarms specs/`** | Canonical **research**: dual pattern, protocols, dosing, FIFO, events, farmer journeys |
| 5 | `specs/0x_*.md` module rewrites | Wireframes + domain; **ignore Express/Python topology** |

**Research keeps:** dual intensive/flexible, species protocols, C1–C8 conflicts, FIFO A/B/C/damaged, pesewas, withdrawal, 5 broiler vax, egg week gates, container dosing, foraging modifiers.  
**Research drops as topology:** FastAPI, Express, Redis/BullMQ, admin portal, quality grades excellent/good.

**Verdict up front:** The app is a **working prototype of a production farm OS**, not a production-complete implementation of the research. Several modules are UI-complete with **client-orchestrated multi-write paths**, **dual task sources**, and **hardcoded demo surfaces**. That is why live multi-species smoke can pass while the product still “doesn’t feel complete.”

---

## 1. Architecture debt (root of incompleteness)

Research / third-track plan expects:

```
Farmer intent → single writer (service/RPC) → ordered side-effects
  (stock + expense + activity + withdrawal) under one source_ref
```

Runtime today:

```
React hook → N sequential supabase.from() calls → optional synergy helper
  (errors often partial / silent; no DB transaction across tables)
```

| Research target (`docs/RESEARCH_RUNTIME_MAPPING.md`) | Current writer | Atomic? |
|-----------------------------------------------------|----------------|---------|
| `create_batch` RPC | `useBatchCreateLogic` multi-insert | No |
| `confirm_day_feed` | `fulfillOperationalTask` | No |
| `log_day_water` | `useWaterLogic` | No |
| `complete_health_task` | `useMedicationLogic` | No (vax sync added client-side) |
| `stock_purchase` | `useStockData` | No |
| `record_egg_sale` / mortality / terminate | hooks + dialogs | Partial |
| Event bus / outbox for offline | Dexie schema + partial `sync.ts` | **Not product-wired** |

**Impact:** Cross-system guarantees (purchase always books; care always updates both vax tables; withdrawal always blocks sale) are **best-effort**, not transactional. Live audit already showed expense missing after stock purchase before insert/error surfacing.

---

## 2. Task system glitch (what you saw)

This is not a one-off animation bug. It is **three task systems fighting**.

### 2.1 Sources of “tasks”

| Source | Where | What it contains |
|--------|-------|------------------|
| **A. Virtual ops** | `useHealthBatchStatus` / `useDashboardLogic` | Client-invented feed/water for today (IDs like `water:uuid:date`) |
| **B. DB `batch_tasks`** | Cron `cron_generate_daily_tasks` → Health “Daily Farm Operations” | Real rows only if edge/cron runs |
| **C. `health_tasks`** | Seeded on batch create + meds | Vaccinations, meds, supplements for entire cycle |

### 2.2 Concrete UI failures (observed live)

1. **Dashboard PENDING CARE inflated / wrong type**  
   `useDashboardLogic` loads incomplete `health_tasks` (limit 10) and **relabels every row** `task_type: 'medication'`. Future Gumboro/Lasota rows appear as “medication” in Today’s House Tasks. That is why multi-flock dashboard looked noisy/glitchy.

2. **Virtual vs DB daily tasks diverge**  
   Feed/Water CTAs on Feed/Health use **virtual** tasks. Health “This Week → Daily Farm Operations” uses **`batch_tasks`**, empty unless `generate-daily-tasks` cron has run. Farmer sees “log feed” in one place, nothing in another.

3. **Week filter inconsistency**  
   This Week cards filter `health_tasks` by calendar week. Dashboard shows **any** incomplete health task. Completing “this week” does not clear future-week rows from dashboard pending count.

4. **Dual vaccination counters** (partially fixed in code; must re-smoke)  
   Completing from This Week vs Vaccines used different tables → summary `0/5 done` while task said Completed.

5. **Health max-update-depth** (fixed in hooks; was causing tab flicker when switching flocks).

6. **Cross-batch bleed risk**  
   Before batch-scoped reload hardening, Layer could show Broiler water “✓ Logged” — classic shared state / effect race.

### 2.3 Production requirement

**One checklist contract:**

- Today ops = feed + water (per active batch) + due care (scheduled_date ≤ today, incomplete)  
- One completion API per intent  
- Dashboard deep-links that checklist; no invent-and-relabel  
- `batch_tasks` either become the sole daily source (cron guaranteed) **or** are deleted from UI in favor of pure virtuals — not both

---

## 3. System-by-system scorecard

Legend: **P** production-grade · **A** acceptable prototype · **G** gap / non-production · **X** missing or unsafe

### A — Onboard / Auth

| Requirement (research) | Status | Evidence |
|------------------------|--------|----------|
| Register → farm → house | **A** | Works hosted; email-confirm blocks public register |
| setup_complete only with houses | **A** | FarmSetup |
| Soft prefs | **A** | user_preferences |
| Offline registration | **G** | Marketing claims offline; register needs network |
| Cost privacy + PIN | **A** | PIN hash path exists; session unmask residual from second-track tickets |

**P0 residual:** Hosted email confirmation UX or documented automation path only.

---

### B — Start flock (all species)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| 4 species + duck type | **A** | Wizard live |
| House occupation gate | **A** | Live: no free house blocks create |
| Seed care plan | **A** | `generateAutoTasks` + `vaccination_schedule` seed |
| Single schedule source of truth | **G** | Still dual tables (health_tasks + vaccination_schedule) |
| Species protocol fidelity | **A/G** | Templates in `health-data.ts` match research counts roughly; not 1:1 with full deprecated protocol docs (broiler 5 OK; turkey/layer fuller in research) |
| FSM on create | **X** | `batch-fsm.ts` unit-tested only; UI does not use XState |

---

### C — Today ops (feed / water)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Prescriptive intake + foraging | **A** | Shared helpers |
| Always write feed_logs / water_records | **A** | Live green broiler |
| Intensive stock+expense | **G** | Category match fixed for `feed_ingredient`; allocation window double-ledger still open |
| Flexible “Book now” | **X** | Toast says manual; **no Book now CTA** (explicit CANONICAL_JOURNEYS farmer-lean rule) |
| One kg number farm-wide | **A** | After P0 unify |
| Water rate expense | **A** | intensive + rate |

---

### D — Care complete

| Requirement | Status | Evidence |
|-------------|--------|----------|
| C1–C8 on add med | **A** | `medication-conflicts.ts` + tests |
| Complete → withdrawal flags | **A** | markTaskComplete |
| Complete → intensive stock/expense | **A/G** | only if product_name stock match + cost |
| Vax dual tables unified | **A** | `care-completion.ts` (re-smoke required) |
| Bulk complete side-effects | **G** | RPC marks completed only; no stock/expense/anti-stress per task; schedule sync only |
| 52 medications from DB | **A** | Seed migration 7; Meds UI loads DB |
| FE MEDICATION_TEMPLATES vs DB | **G** | Parallel catalogue risk |

---

### E — Plan / buy feed

| Requirement | Status | Evidence |
|-------------|--------|----------|
| 3 methods + highs-js LP | **A** | `feed-optimizer.ts` + formulation UI |
| 41 ingredients research | **G** | Migration seeds ~25; research claims 41 |
| Safety preprocessor (gossypol, aflatoxin, cassava) | **A** | feed-safety tests exist |
| Ready-made purchase always expense | **A** | code path |
| Formulation confirm dual consumption | **A/G** | intensive only; double-ledger with day feed unresolved |
| Stock category for solver | **A** | stock-match fix |

---

### F — Stock

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Lots + quality A/B/C/damaged | **A** | purchase creates lots |
| FIFO RPC | **A** | `allocate_fifo_by_quality` |
| Purchase always expense | **A** | insert + error toast (re-smoke) |
| Usage batch attribution | **A** | params present |
| Demo/hardcoded empty farm | **OK** | empty until farmer adds |

---

### G — Eggs

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Layer week 19+ / duck-layer 20+ | **A** | Live gate toast |
| Graded inventory | **A** | UI paths |
| Sale always revenue | **A** | synergy |
| Withdrawal block sale | **A** | `hasActiveWithdrawal` on dialog |
| Collect CTA before eligible | **G** | opens then fails — should disable/explain first |
| Duck meat no eggs | **A** | nav gated by layer presence |

---

### H — Mortality / bird sale

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Mortality updates population | **A** | Live turkey |
| Bird sale + revenue | **A/G** | dialog exists; full withdrawal block path needs deep audit |
| Meat withdrawal block | **G** | verify end-to-end |

---

### I — Terminate

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Dialog + house release | **A** | TerminationDialog |
| Revenue if sold | **A/G** | path exists |
| FSM TERMINATE rules | **X** | FSM not driving UI |
| Emergency terminate under withdrawal | **X** | research FSM; not wired |

---

### J — Background jobs

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Edge: advance weeks, daily tasks, withdrawal, push, prune | **A** | functions present |
| Hosted cron schedules | **G** | Must verify Supabase dashboard schedules; empty `batch_tasks` implies daily job not firing or not linked |
| Week advance updates phase | **G** | edge → RPC; not live-proven this farm |

---

### K — Dashboard / Finance / Records

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Real flock aggregates | **A** | 4 flocks / 399 birds live |
| Today checklist correct | **X** | see §2 |
| Finance categories 9/5 | **A** | schema CHECK |
| Cost privacy mask | **A** | Show/Hide costs |
| Market trends from settings | **X** | **Hardcoded** `MarketTrends.tsx` 85/52/185 — Settings `MarketPricesTab` is separate and unused by dashboard |
| Records CTE / compare | **A/G** | RPC exists; depth vs research analytics TBD |
| Offline cache | **G** | Dexie tables; product flows do not systematically write outbox |

---

## 4. Cross-system matrix (must stay fluid)

| Intent | Side-effects required | Actual | Gap |
|--------|----------------------|--------|-----|
| B create | health_tasks + vaccination_schedule + house occupy | Yes | dual tables remain |
| C feed intensive | feed_logs + stock FIFO + expense | feed_logs; stock if match; expense if unit price | double-ledger window |
| C feed flexible | feed_logs only + **Book now** | feed_logs + dead-end toast | **Book now missing** |
| C water intensive | water_records + expense if rate | Yes | — |
| D complete | withdrawal + dual vax + intensive stock/expense + anti-stress | client multi-step | bulk incomplete |
| E ready-made buy | stock in + **always** expense | code yes | re-smoke |
| F stock buy | lot + qty + **always** expense | fixed insert | re-smoke |
| G/H/I sales | revenue always; block if withdrawal | partial | terminate/sale deep audit |
| J jobs | batch_tasks + week + withdrawal clear | functions exist | cron reliability |

---

## 5. Hardcoded UI / dual sources of truth / seed issues

### 5.1 Hardcoded presentation (must not ship as “live data”)

| Location | Issue |
|----------|--------|
| `src/components/dashboard/MarketTrends.tsx` | Static prices and fake % change |
| `todayTemp` fallback `28.0` always | Regional weather is stub (`farmRegion ? 28 : 28`) |
| Install PWA banner copy | OK as marketing; dismiss often blocks clicks (live audit) |

### 5.2 Dual catalogues (research violation: one truth)

| Domain | Source A | Source B | Risk |
|--------|----------|----------|------|
| Vaccinations | `VACCINATION_TEMPLATES` in FE | `vaccination_schedule` rows + health_tasks | Drift on edit |
| Medications | DB `medications` (52 seed) | `MEDICATION_TEMPLATES` in FE | Parallel lists |
| Daily tasks | Virtual client | `batch_tasks` cron | Empty vs full UI |
| Market prices | Settings overrides | Hardcoded MarketTrends | Farmer edits ignored |
| Batch lifecycle | Columns on `batches` | `batch-fsm.ts` unused | FSM tests give false confidence |

### 5.3 Seed / research count gaps

| Research claim | Runtime |
|----------------|---------|
| 52 medications | Migration 7 seeds 52 — **OK if hosted applied** |
| 9 containers | Migration 7 — verify hosted |
| 41 ingredients | ~25 seeded — **gap** |
| Full species protocol narratives | FE templates condensed — **gap vs deprecated 03-SPECIES-PROTOCOLS** |
| Offline-first day logging | Dexie present; writers mostly online-only — **gap** |

### 5.4 Type-escape density

~37 `as any` in production `src` (excluding tests). Not forbidden, but signals incomplete types / RPC typing — production hardening should eliminate escape hatches on money and stock paths.

---

## 6. Test / verification reality

| Layer | Status |
|-------|--------|
| Vitest pure domain | Partial: ledger-policy, conflicts, LP safety, onboarding A, care-completion, stock-match |
| Integration (hosted) | Manual headed CDP only |
| E2E CI per flow A–K | **Missing** as gate |
| Edge cron verified on lampfarms | **Not proven** this session |
| Transactional RPC tests | **Missing** |

**Production gate:** Do not claim complete without (1) one atomic writer per intent or proven multi-step compensating transactions, (2) one task checklist, (3) zero hardcoded market widgets, (4) flexible Book now, (5) hosted cron green, (6) re-smoke dual vax + purchase expense.

---

## 7. Severity backlog (execution order)

### P0 — Correctness / trust (do first)

1. **Unify Today task model**  
   - Dashboard: only due today (ops + care with `scheduled_date <= today`)  
   - Stop forcing `task_type: 'medication'` on all health_tasks  
   - Single completion path; remove or hide empty `batch_tasks` UI until cron guaranteed  

2. **Atomic writers (or fail-closed)** for money paths  
   - stock purchase, day feed, care complete, egg sale  
   - Prefer Postgres RPC; until then: check every error, compensate, never toast success if expense failed  

3. **Flexible Book now** on feed/water/health consumption toasts  

4. **Double-ledger policy** for formulation vs day feed (allocation window or explicit “already expensed” flag)

### P1 — Product completeness vs research

5. Wire **MarketTrends** → `config_overrides` / market prices settings (or remove widget)  
6. Guarantee **hosted cron** for daily tasks + week advance + withdrawal (document schedule)  
7. Fold vaccination into **one table** long-term (research target); until then keep `care-completion` as mandatory single helper for all entry points including bulk  
8. Bulk complete → call shared complete helper (side-effects) or ban bulk for vax  
9. Egg collect: disable CTA before week gate with explanation  
10. Wire batch FSM to terminate / phase display or delete unused FSM from “production” claim  

### P2 — Hardening

11. Expand ingredient seed toward research 41 or document deliberate subset  
12. Offline: either ship real outbox for day logs or stop marketing offline-first  
13. Reduce `as any` on financial writes  
14. E2E suite: one Playwright flow per species × critical intents (not script-only fake pass)  
15. Species protocol diff: `deprecated specs/.../03-SPECIES-PROTOCOLS/*` vs `VACCINATION_TEMPLATES` line-by-line  

### P3 — UX polish (after correctness)

16. PWA install banner not covering primary CTAs  
17. Settings house list vs header counts consistency  
18. Harvest early CTA copy  

---

## 8. What is already solid (do not rewrite blindly)

- Dual pattern helpers (`shouldAutoLedger`, purchase/sale always) as pure functions + tests  
- Hosted Supabase path (no daily Docker)  
- Pesewas money columns  
- Conflict matrix C1–C8 unit tests  
- FIFO RPC exists  
- Multi-species batch create with duck type  
- Egg week eligibility enforcement  
- Cost privacy mask  
- Security advisor hardening migration + intentional DEFINER RPC grants  

---

## 9. How we audit from here (no more vague “smoke”)

For **each** system module (Batch, Water-Health, Feed, Stock, Eggs, Finance, Records, Dashboard, Settings, Jobs):

1. **Contract extract** — 10–20 must-rules from deprecated research + CANONICAL_JOURNEYS  
2. **Writer map** — file, tables touched, source_ref, failure modes  
3. **Cross-system edges** — who else must update  
4. **Hardcode hunt** — static arrays, fake prices, parallel templates  
5. **Live headed proof** — screenshot + toast + DB-visible side-effect (expense row, schedule row)  
6. **Status board update** — only **P** when all P0s for that module closed  

### Module order (recommended)

```
Task model (cross-cutting) → D complete + bulk → C Book now + double-ledger
→ F/E money paths → H/I sales+terminate → G eggs polish
→ K dashboard/finance truth → J cron proof → B single schedule schema
→ Offline honesty → Protocols parity
```

---

## 10. Honest completeness estimate

| Area | Completeness (research intent) |
|------|--------------------------------|
| UI surface area | ~75% screens exist |
| Domain rules encoded somewhere | ~55% |
| Single-writer production paths | ~25% |
| Cross-system guarantees | ~35% |
| Offline product | ~15% |
| Jobs/ops on hosted | ~40% (code yes, schedule unproven) |
| **Overall production readiness** | **~35–40%** |

That is consistent with: live multi-species demo works, but task UI glitches, money side-effects flake, and research depth is not yet one coherent system.

---

## Related artifacts

- Live headed session: `docs/live-audit-artifacts/CDP_LIVE_AUDIT_SESSION.md`  
- Flow board: `docs/FLOW_AUDIT_STATUS.md`  
- Journeys: `docs/CANONICAL_JOURNEYS.md`  
- Research map: `docs/RESEARCH_RUNTIME_MAPPING.md`  
- Research tree: `deprecated specs/Lampfarms specs/`  

---

*This document is the working backlog for production hardening. Prefer closing P0 task-model + atomic money writers before more species UI polish.*
