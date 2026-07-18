# QA — Deep architectural integrity arc

**This folder is not a smoke checklist.**  
It is the home for **slow, acid-cautious, system-by-system** architectural QA: writers, side-effects, grey usecases, curation, and improvement.

Prior live/script audits and `docs/WRITER_MAP.md` are **inputs**, not substitutes.  
If a claim here is not backed by **code map + live proof + open grey list**, it is not closed.

---

## Why this exists

Short audits skim happy paths and miss:

- dual writers under failure
- multi-species edge cases
- flexible vs intensive money
- formulation vs day-feed double ledger
- offline ≠ online semantics
- multi-flock selection / care dual tables
- withdrawal, week gates, house occupation

This arc forces **one system at a time**, **deep**, with room to **curate and improve** during QA—not only after a fake “100%”.

---

## Folder map

| Path | Role |
|------|------|
| [`00-methodology/`](00-methodology/) | Acid caution, e2e proof standard, anti-skim, curation protocol |
| [`01-spine/`](01-spine/) | Single-writer laws, writer inventory pointer, integrity gates |
| [`02-systems/`](02-systems/) | **Per module** deep audit packs (primary work surface) |
| [`03-journeys/`](03-journeys/) | Cross-module farmer intents A–K (orchestration views) |
| [`04-cross-cutting/`](04-cross-cutting/) | Dual pattern, offline, security, multi-species, money |
| [`05-findings/`](05-findings/) | Finding template + living curation log |
| [`06-evidence/`](06-evidence/) | Pointers / copies of proof artifacts |
| [`STATUS_BOARD.md`](STATUS_BOARD.md) | Progress: nothing is green without pack status |

---

## Authority ladder (QA)

1. Runtime + migrations + this folder’s closed packs  
2. `docs/CANONICAL_JOURNEYS.md` + `docs/CANONICAL_RUNTIME.md`  
3. `docs/WRITER_MAP.md` (kill/keep inventory)  
4. Research in `deprecated specs/` (domain only—not Express topology)  
5. Old docs (`PATH_TO_100`, PRODUCTION_E2E scores) — **suspect until re-proved here**

---

## How to work a system (mandatory order)

1. Open the system pack under `02-systems/`.  
2. Fill **inventory** (code map, writers, tables) before any “pass”.  
3. Enumerate **grey usecases** (happy + sad + cross-module).  
4. Run **acid e2e** per usecase (see methodology).  
5. Log findings in `05-findings/` and update pack **Open greys**.  
6. **Curate**: improve product *or* document deliberate residual—both allowed.  
7. Only then move pack status → `CURATED` / `CLOSED`.

**Forbidden:** marking a system CLOSED after a single headed smoke.

---

## Status vocabulary

| Status | Meaning |
|--------|---------|
| `NOT_STARTED` | Pack skeleton only |
| `INVENTORY` | Code map in progress |
| `GREY_MAP` | Usecases listed; proof not done |
| `ACID_IN_PROGRESS` | Deep proof running |
| `CURATED` | Findings reviewed; improvements applied or residual accepted with owner |
| `CLOSED` | Acid gates green; greys empty or explicitly deferred with ticket |

---

## Relationship to live scripts

| Artifact | Use in this arc |
|----------|-----------------|
| `scripts/live-audit-thorough.mjs` | Optional **entry smoke** only |
| `docs/live-audit-artifacts/` | Seed evidence; re-verify under packs |
| Unit/Playwright shells | Never close a system pack |

---

## Start here

1. Read [`00-methodology/ANTI_SKIM.md`](00-methodology/ANTI_SKIM.md)  
2. Read [`00-methodology/ACID_CAUTION.md`](00-methodology/ACID_CAUTION.md)  
3. Open [`STATUS_BOARD.md`](STATUS_BOARD.md)  
4. Pick next `NOT_STARTED` system by board priority  
5. Work only that pack until `CURATED` or blocked  

---

*Created for deep architectural QA. Prefer depth over coverage theater.*
