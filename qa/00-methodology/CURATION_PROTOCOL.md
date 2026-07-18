# Curation protocol

Deep QA is not only detect. It is **curate**: improve, simplify, or consciously accept residual.

---

## During audit (allowed)

| Action | When |
|--------|------|
| Minimal product fix | Clear bug blocking acid proof |
| Kill dual writer | Matches WRITER_MAP KILL |
| Docs correction | Spec wrong vs runtime |
| Open improvement ticket | Larger than pack scope |
| Accept residual | Explicit, dated, owned |

## Not during audit

- New features unrelated to pack  
- Drive-by refactors across modules  
- Score inflation in PATH_TO_100  

---

## Curation log entry (required for CURATED)

Add a row to [`../05-findings/CURATION_LOG.md`](../05-findings/CURATION_LOG.md):

| Field | Content |
|-------|---------|
| Date | ISO |
| System pack | e.g. `02-systems/C-today-ops-feed` |
| Finding ID | F-### or none |
| Decision | FIX / DEFER / ACCEPT |
| What changed | PR/commit or “none” |
| Residual | what remains |
| Owner | who owns residual |

---

## Improvement types

1. **Integrity** — sole writer, fail-closed  
2. **Correctness** — dual pattern, gates, amounts  
3. **Safety** — conflicts, withdrawal  
4. **Clarity** — farmer-facing copy when it causes wrong ops  
5. **Observability** — errors surfaced  

Prefer 1–3 over 4–5 when time-constrained.

---

## Re-open rules

A `CLOSED` pack reopens if:

- new dual writer appears in that domain  
- migration changes RPC contracts  
- live incident in that domain  
- deferred residual becomes P0  
