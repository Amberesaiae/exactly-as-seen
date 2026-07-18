# B — Batches / start flock

| Field | Value |
|-------|-------|
| Status | **CURATED** — create_batch sole path re-proved multi-species; greys mostly PASS |
| Related journeys | B, H, I |
| Code roots | `BatchCreate`, `Batches`, `BatchDetail`, `useBatchCreateLogic`, `health-auto-tasks`, `vaccination-seed` |
| Spine | `create_batch` |
| WRITER_MAP | **OK** — sole FE path; TEXT medication_id seed fixed hosted |
| Inventory complete | **2026-07-17** |

---

## 1. Purpose

Create active flock: house occupation, age/phase, protocol seed (health + vax), multi-species.

---

## 2. Inventory

| # | Site | Class | Verdict |
|---|------|-------|---------|
| W1 | SQL `create_batch` (20260717000000) | SPINE | house free check; batch; occupy house; seed health TEXT meds; seed vax; atomic |
| W2 | `useBatchCreateLogic.createBatch` → RPC | SPINE | **SPINE** fail-closed toast |
| W3 | offline → `queueRpc('create_batch')` | OFFLINE-OK | **KEEP** |
| W4 | FE free-house filter | gate | **KEEP** |
| W5 | notes update `useBatchDetailLogic` | metadata | **KEEP** |
| W6 | terminate (pack I) | separate | out of scope |

No client `batches.insert` on create path.

---

## 3. Greys (re-proved)

| ID | Status | Evidence |
|----|--------|----------|
| B-U01 Broiler deep_litter | **PASS** | house occ, health=20, vax=5 |
| B-U02 Layer cage cycle 72 | **PASS** | health=56 |
| B-U03 Duck meat | **PASS** | duck_type=meat, vax=6 |
| B-U04 Duck layer | **PASS** | health=17, vax=6 |
| B-U05 Turkey | **PASS** | health=41, vax=12, blackhead tasks |
| B-U06 No free house | **PASS** | house not available |
| B-U07 Invalid name/qty/duck | **PASS** | RPC exceptions |
| B-U08 Concurrent same house | covered by U06 | |
| B-U09 medication_id TEXT slugs | **PASS** | anti_stress, coccidiostat_… |
| B-U10 Preferred batch | **PASS** | FE setPreferredBatchId |
| B-U11 Offline queueRpc | **PASS** | code |
| B-U12 Atomic / fail-closed | **PASS** | no client insert |

Evidence: `qa/06-evidence/B-batches/LIVE-2026-07-17-writer-db.md` (14/14).

---

## 4. Findings

| ID | Sev | Summary | Curation |
|----|-----|---------|----------|
| F-B-001 | P3 | types.ts create_batch Args were incomplete vs hosted | **FIXED** types update |
| F-B-002 | P2 | Full protocol parity vs research | **DEFER** PROTOCOL_PARITY_MATRIX |
| F-B-003 | info | create_batch partial-arg PostgREST probes fail; full FE signature works | **ACCEPT** |

---

## 5. Session log

| Date | Work |
|------|------|
| 2026-07-17 | Inventory; multi-species live 14/14; CURATED |
