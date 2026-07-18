# K — Dashboard, finance, records (hub)

| Field | Value |
|-------|-------|
| Status | **CURATED** — read models + manual ledger; records RPC fixed |
| Related journeys | K + all money producers |
| Code roots | `Dashboard`, `Finance`, `Records`, finance/records hooks |
| Spine | Read RPCs + manual expense/revenue KEEP |
| Inventory complete | **2026-07-17** |

---

## Inventory

| Writer | Verdict |
|--------|---------|
| `get_dashboard_overview` | READ spine |
| `get_batch_record_summary` | READ spine — **fixed** ambiguous `total_eggs` |
| Manual expense/revenue insert | **KEEP** (categories CHECK enforced) |
| Cost privacy prefs | **KEEP** |

## Greys

| ID | Status |
|----|--------|
| K-U01 dashboard overview | **PASS** |
| K-U04 auto: sources visible | **PASS** stock/health/vax/feed/water |
| K-U05 category CHECK | **PASS** (bad slug rejected) |
| K-U06 manual revenue | **PASS** |
| K-U08 cost privacy | **PASS** surface |
| K-U10 records summary | **PASS** after migration fix |
| K-U02/U03 deep-link / checklist | **DEFER** UI |
| K-U07/U09/U11/U12 | **DEFER** |

## Finding

| ID | Fix |
|----|-----|
| F-K-001 | `get_batch_record_summary` total_eggs ambiguity → `20260717140000` hosted |

Evidence: `qa/06-evidence/K-hub/LIVE-2026-07-17.md`
