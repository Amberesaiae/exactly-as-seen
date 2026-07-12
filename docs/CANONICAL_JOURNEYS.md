# Canonical Journeys Contract

**Status:** Living product contract for implementation (2026-07-11)  
**Stack:** React 18 + Vite + Supabase (see `docs/CANONICAL_RUNTIME.md`)  
**Domain research:** `deprecated specs/` (protocols + Dovetail intent only)  
**Enum/money/dual helpers:** `src/lib/canonical.ts`, `src/lib/production-system.ts`

This document is the **journey-level source of truth**. Module specs may lag; when journey rules conflict with Express/Python paths in rewritten specs, **this file + CANONICAL_RUNTIME win**.

---

## First principles

1. **One intent → one writer → one set of side-effects.**
2. **Safety before money.** Conflicts (C1–C8) and withdrawal block unsafe actions before ledger writes.
3. **Dual pattern on consumption only.** Purchases and sales always ledger.
4. **Never double-ledger the same kg or dose.** Formulation purchase ≠ day feed consumption for the same physical feed (see § Double ledger).
5. **Farmer efficiency.** Few primary buttons. Flexible mode must not force a scavenger hunt across Finance + Stock.
6. **Idempotent auto-ledger.** Unique `(source, source_ref)` via `LEDGER_SOURCES`.
7. **No daily admin PowerShell.** Docker Desktop + `npx supabase` + `npm run *` as normal user.

---

## Authority ladder

| Rank | Document |
|---|---|
| 1 | This file + `docs/CANONICAL_RUNTIME.md` + migrations |
| 2 | `specs/00_CONVENTIONS.md` domain corrections (except C6/C7 severity → runtime WARN) |
| 3 | Research dual pattern / protocols in `deprecated specs/` |
| 4 | `specs/10_CORE_FLOWS.md` wireframes (ignore Express paths) |

**C6 / C7 severity (canonical):** `WARN` with timing advice (not hard BLOCK). Matches `medication-conflicts.ts` and farmer-lean policy.

---

## Dual pattern matrix

| Action class | Examples | Intensive (`intensive`, `deep_litter`, `cage`) | Flexible (`semi_intensive`, `free_range`, `pasture`) |
|---|---|---|---|
| **Consumption** | Day feed, formulation confirm (when treating as use), health complete, water cost | Auto stock + auto expense | Log / save only; optional one-tap “Book now” |
| **Purchase** | Stock buy, ready-made feed purchase | Always expense | Always expense |
| **Sale** | Eggs, birds, terminate proceeds | Always revenue | Always revenue |

Helper: `shouldAutoLedger(production_system)` for **consumption**.  
Purchases/sales: always ledger regardless of system.

---

## Gate order (every write)

```
Auth → farm ready → batch active (if batch-scoped)
  → species/week eligibility
  → safety (conflict / withdrawal)
  → dual ledger decision
  → single atomic write (or ordered local steps with same source_ref)
```

---

## Primary farmer intents (only these are “main product”)

| ID | Intent | Primary UI | Writer |
|---|---|---|---|
| A | Onboard | Register → Farm setup | Auth + farms/houses |
| B | Start flock | `/batches/new` | batch insert + `generateAutoTasks` |
| C | Today ops | Dashboard / Health / Feed | `feed_logs`, water, `batch_tasks` |
| D | Complete care | Health task | `health_tasks` complete + synergy |
| E | Plan / buy feed | `/feed/formulate` | formulations + purchase ledger |
| F | Buy / use stock | Stock | lots + FIFO RPC + purchase expense |
| G | Eggs | Eggs | collections + sales + revenue |
| H | Mortality / bird sale | Batch detail | mortality + sale synergy |
| I | Close flock | Terminate dialog | terminate + revenue |
| J | Background jobs | Edge / cron | week advance, daily tasks, withdrawal |
| K | See money / hub | Dashboard, Finance, Records | read models |

Secondary: Settings, export, compare — do not block A–K.

---

## Integration side-effects

| Intent | After success | Ledger source |
|---|---|---|
| B Create batch | Seed protocol `health_tasks` only | — |
| C Day feed | Always `feed_logs`; intensive → stock + expense | `auto:feed` |
| C Day water | Always water record; expense only if rate **and** `shouldAutoLedger` | `auto:water` |
| D Care complete | Withdrawal flags; intensive → stock + expense; anti-stress if vax | `auto:health` / `auto:vaccination` |
| E Ready-made **purchase** | Always expense (purchase class) | `auto:feed` |
| E Custom confirm (consumption of stock) | Intensive only stock + expense | `auto:feed` |
| F Stock purchase | Always expense by category map | `auto:stock` |
| G Egg sale | Always revenue; block if egg withdrawal | `auto:eggs` |
| H Bird sale | Always revenue; block if meat withdrawal | `auto:sale` |
| I Terminate | Revenue if sold; release house | `auto:sale` |

---

## Double-ledger rule (formulation vs day feed)

| Event | Books stock? | Books expense? |
|---|---|---|
| Ready-made / commercial **purchase** | Stock **in** (lots) | Yes (purchase) |
| Custom formulation **confirm that allocates existing stock** | Stock **out** (FIFO) | Intensive only (consumption) |
| Day feed log | Stock **out** only if intensive **and** kg not already allocated for that day/plan | Intensive only if stock-out ran |

**Invariant:** Same physical kg must not create two expenses. Prefer:

- Purchase path expenses at buy-in.
- Day feed expenses only when deducting stock that was not already expensed as a formulation allocation for that period.

Until allocation windows exist in DB, **day feed** uses intensive stock-out + expense; **ready-made purchase** always expenses; **custom confirm** intensive stock-out + expense — QA must not run purchase + day feed for the same bags without understanding this. Track full allocation windows as Phase 3 RPC work.

---

## Flow acceptance (must be green before next flow)

For each flow A–K:

1. **Audit** current code vs this contract (gates, writers, dual pattern).
2. **TDD** domain rules in Vitest where pure logic exists.
3. **Fix** gaps (minimal diffs).
4. **Verify** unit tests + manual smoke path when backend is up.
5. **Document** residual risk in plan checkboxes.
6. **Commit** only that flow’s scope.

---

## Farmer lean rules

- Broiler vaccinations: **5** events (not 6).
- Layer eggs from **week 19+**; duck-layer **week 20+**; duck-meat: no eggs UI.
- Containers: **9** types; dose = `dose_per_gallon × (L / 3.785)`.
- Flexible toast must offer **Book now** (optional) or deep-link — never dead-end “do it manually somewhere.”
- Dashboard “Today” should deep-link one checklist (union of health + batch tasks) — Phase after C.

---

## Local complete project (Bun)

| Piece | Command (user-mode) |
|---|---|
| Deps | `bun install` |
| Docker repair (**once**, if broken) | `bun run docker:fix` — approve single UAC |
| Backend | `bun run backend` → Supabase via Docker |
| Env keys | `bun run stack:env` |
| Migrations | `bun run db:reset` |
| Frontend | `bun run frontend` or `bun run dev` |
| Tests | `bun run test` |

See `docs/BACKEND_LOCAL.md`. **Never** require Admin PowerShell for daily dev.

### “Error getting docker binary key”

Log: `cannot find registry key SOFTWARE\Docker Inc.\Docker Desktop`.  
Install was interrupted mid-Components. Run `bun run docker:fix` and click **Yes** on UAC.  
Installer exit `-5` means UAC was cancelled — run again interactively in your terminal.