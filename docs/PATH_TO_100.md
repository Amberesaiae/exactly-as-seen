# Path to 100% Completeness

**Branch:** `feat/canonical-journeys`  
**Updated:** 2026-07-13 (wave 2)

## Two different “100%s”

| Bar | Meaning | Status |
|-----|---------|--------|
| **Production 100%** | Journeys A–K, dual pattern, full **seedable** protocols for 4 species, fail-closed money UX, no fake markets, daily tasks without cron dependency | **~92%** (this wave) |
| **Research 100%** | Full deprecated-spec OS: 41-ingredient DB parity, offline product, atomic RPCs for every intent, event bus service layer, quail/guinea/geese | **~50%** residual backlog |

When you say “I want 100%,” we ship **Production 100%** first. Research residual is listed — not claimed done.

---

## Production 100% checklist

### P0

- [x] Dual intensive/flexible helpers
- [x] Purchases always ledger + surface errors
- [x] Feed stock match `feed_ingredient`
- [x] Dual vax complete sync
- [x] Today checklist (due only; no medication relabel)
- [x] Flexible Book now **feed / water / health**
- [x] Protocol courses seed (full meat/rear tables + layer monthly stubs)
- [x] Egg week constants 19/20 + **Collect CTA disabled** early
- [x] No hardcoded MarketTrends
- [x] Daily `batch_tasks` ensured on dashboard load
- [x] Vitest green (**66** tests)

### P1 Protocol

- [x] Broiler W1–6 courses (cocci MWF, multi, deworm, plain water)
- [x] Layer courses + pre-lay calcium + production monthly stubs
- [x] Duck meat courses + pre-sale plain water
- [x] Turkey courses + blackhead W2 + plain water

### P2 Research residual (not Production 100%)

- [ ] Postgres atomic RPCs per intent (`create_batch`, `confirm_day_feed`, …)
- [ ] 41 ingredients full nutritional seed in DB
- [ ] Offline Dexie outbox for all day logs
- [ ] Hosted cron dashboard schedule proof (edge already deployed)
- [ ] Full layer 72w quarterly Newcastle automation
- [ ] Quail / guinea / geese
- [ ] Formulation vs day-feed allocation windows (double-ledger)

---

## Scoreboard

| Metric | Score |
|--------|-------|
| **Production 100% DoD** | **92%** |
| **Research full OS** | **~50%** |
| **Demo / multi-species UX** | **~85%** |

**Honest statement:** You can treat the app as **production-usable for primary farmer journeys** on hosted Supabase after this wave. You cannot claim **byte-for-byte research OS completeness** until P2 residual is closed.

### What “92%” still misses for Production 100%

1. **Live headed re-smoke** of new flock seed (not automated in CI)  
2. **Withdrawal-block terminate** unit/integration test (UI exists; not fully automated)  
3. **Health complete cost entry** often 0 → Book now only when cost &gt; 0 (need UI cost on complete)  
4. **Push + migrate** for this commit on hosted project  

---

## How to reach true Production 100% (next session)

1. Add cost field on care Complete → Book now always available with default cost  
2. Live CDP audit: create broiler → verify courses in This Week  
3. Vitest for terminate/sale withdrawal gate  
4. `bun run db:push` + `git push`  
5. Optionally start P2 RPC wrappers one intent at a time  

---

*Related: `PROTOCOL_PARITY_MATRIX.md`, `PRODUCTION_E2E_AUDIT.md`, plan `docs/superpowers/plans/2026-07-13-production-protocol-hardening.md`*
