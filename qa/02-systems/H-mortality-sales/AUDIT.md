# H — Mortality & bird sale

| Field | Value |
|-------|-------|
| Status | **CURATED** — sole RPCs re-proved; meat withdrawal gate added to bird sale |
| Related journeys | H, D withdrawal, I, K |
| Code roots | `MortalityDialog`, `batch-utils`, `BirdSaleDialog`, `record_bird_sale` |
| Spine | `record_mortality`, `record_bird_sale` |
| Inventory complete | **2026-07-17** |

---

## Inventory

| Site | Verdict |
|------|---------|
| `recordMortality` → RPC | **SPINE** fail-closed |
| Offline queueRpc mortality | **KEEP** |
| `recordBirdSale` → RPC | **SPINE** |
| FE `canSellBirds` gate | **FIXED** wired on dialog |
| RPC meat withdrawal | **FIXED** `20260717130000` hosted |

## Greys

| ID | Status |
|----|--------|
| H-U01 mortality −N | **PASS** (pop 100→97; table `recorded_at`) |
| H-U02 over pop | **PASS** |
| H-U03 bird sale revenue | **PASS** bird_sale 25000 |
| H-U04 meat withdrawal | **PASS** after gate (`reason: meat_withdrawal`) |
| H-U06 offline | **PASS** code |

Evidence: `qa/06-evidence/H-mortality/LIVE-2026-07-17-writer-db.md` + H-U04 retest post-migration.
