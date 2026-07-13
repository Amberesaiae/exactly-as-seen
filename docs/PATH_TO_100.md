# Path to 100% Completeness

**Branch:** `feat/canonical-journeys`  
**Updated:** 2026-07-13 (wave 3 — residual gates closed)

## Two different “100%s”

| Bar | Meaning | Status |
|-----|---------|--------|
| **Production 100%** | Journeys A–K, dual pattern, full **seedable** protocols for 4 species, fail-closed money UX, safety gates, no fake markets, daily tasks without cron-only dependency | **100% code DoD** |
| **Research 100%** | Full deprecated-spec OS: 41-ingredient DB, offline product, atomic RPCs every intent, event bus service layer, other species | **~50%** residual |

---

## Production 100% checklist

### P0

- [x] Dual intensive/flexible helpers
- [x] Purchases always ledger + surface errors
- [x] Feed stock match `feed_ingredient`
- [x] Dual vax complete sync
- [x] Today checklist (due only; no medication relabel)
- [x] Flexible Book now **feed / water / health**
- [x] Care Complete **cost modal** (enables Book now when cost &gt; 0)
- [x] Protocol courses seed (full meat/rear tables + layer monthly stubs)
- [x] Egg week constants 19/20 + Collect CTA disabled early
- [x] Pure safety-gates: sell birds/eggs, terminate normal vs emergency
- [x] No hardcoded MarketTrends
- [x] Daily `batch_tasks` ensured on dashboard load
- [x] Vitest green (70+ tests incl. safety-gates)
- [x] Migrations linked (`db:push` up to date)
- [x] Branch commits on `feat/canonical-journeys`

### P2 Research residual (not Production 100%)

- [ ] Postgres atomic RPCs per intent
- [ ] 41 ingredients full nutritional seed
- [ ] Offline Dexie outbox product path
- [ ] Hosted cron schedule UI verification (edge code present)
- [ ] Quail / guinea / geese
- [ ] Formulation vs day-feed allocation windows

---

## Scoreboard

| Metric | Score |
|--------|-------|
| **Production 100% DoD (code)** | **100%** |
| **Research full OS** | **~50%** |
| **Demo / multi-species UX** | **~90%** |

### What Production 100% means

All **code-side** DoD items for primary farmer journeys on hosted Supabase are implemented and unit-tested. Live headed re-smoke after hard refresh remains a **ops smoke** step (not a missing feature).

### What it does **not** mean

- Not research-complete (P2 residual).
- Existing flocks created before course seed still have old task sets — create a **new** flock to see full courses.
- Remote push depends on network/auth at push time.

---

*Related: `PROTOCOL_PARITY_MATRIX.md`, `PRODUCTION_E2E_AUDIT.md`*
