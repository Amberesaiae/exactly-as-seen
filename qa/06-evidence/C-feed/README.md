# Evidence: C-today-ops-feed

## Static (2026-07-17)

| Artifact | Note |
|----------|------|
| Writer inventory | `qa/02-systems/C-today-ops-feed/AUDIT.md` §2 |
| K1 kill | `src/hooks/feed/useFeedData.ts` — rpcErr toast+return |
| K2 kill | same — offline `queueRpc('confirm_day_feed')` |
| Book now Health | `src/hooks/useHealthData.ts` — expense only |
| Grep clean | no `queueWrite('feed_logs'`; no `from('feed_logs').insert` in `src/` |

## Live acid (triple proof)

Per usecase under this dir: `UXX-YYYYMMDD.md` with UI / network / DB.

Status: **not yet run** — greys remain open until live matrix.
