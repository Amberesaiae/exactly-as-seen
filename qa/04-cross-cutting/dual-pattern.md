# Cross-cutting: dual pattern (intensive / flexible)

**Status:** **CURATED** (2026-07-17)

## Rule

- **Consumption** (day feed, water cost, care consume, formulation stock-out): intensive auto; flexible log + optional Book now  
- **Purchase / sale:** always ledger  

## Re-proved matrix

| Module | Intensive | Flexible | Purchase always | Book now | Pack |
|--------|-----------|----------|-----------------|----------|------|
| Day feed | PASS stock+expense | PASS log | N/A | PASS `:book` | C-feed |
| Water | PASS rate+expense | PASS log | N/A | PASS `:book` | C-water |
| Care complete | PASS RPC expense | PASS no auto | N/A | PASS KEEP | D |
| Ready-made buy | expense | expense | **always** | N/A | E |
| Stock purchase | expense | expense | **always** | N/A | F |
| Egg/bird sale | revenue | revenue | **always** | N/A | G/H |

## Greys residual

- Semi-intensive foraging modifiers UI depth  
- Full allocation windows formulation vs day feed (E×C)  

Evidence: system packs + `qa/06-evidence/cross-cutting/LIVE-2026-07-17.md`
