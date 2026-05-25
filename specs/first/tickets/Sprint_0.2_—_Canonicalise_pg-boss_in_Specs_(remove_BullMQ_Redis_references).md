# Sprint 0.2 — Canonicalise pg-boss in Specs (remove BullMQ/Redis references)

## Goal

Update file:specs/00_CONVENTIONS.md, file:specs/01_MASTER_ARCHITECTURE.md, and all phase files to replace BullMQ + Redis with pg-boss as the canonical job queue. The implementation already uses pg-boss correctly; the specs must match.

## Changes Required

### file:specs/00_CONVENTIONS.md §1 Stack table

- Change `Job queue / scheduler` row from `BullMQ (Redis-backed)` to `pg-boss (Postgres-native)`
- Remove `Cache / queue infra: Redis 7` row (Redis is not used)
- Update §2.11 scheduler table — replace `BullMQ repeat jobs` with `pg-boss schedule()`

### file:specs/01_MASTER_ARCHITECTURE.md §7 Background Jobs

- Replace all `Queue`, `Worker` imports from `bullmq` with pg-boss equivalents
- Replace `upsertJobScheduler` with `boss.schedule()`
- Remove Redis connection references

### file:specs/phases/phase2.md, `phase3.md`, `phase4.md`

- Replace any BullMQ-specific language with pg-boss equivalents

### file:specs/02_BATCH_MANAGEMENT.md §7, file:specs/03_WATER_HEALTH.md §8, file:specs/04_FEED_CALCULATOR.md §10, file:specs/05_EGG_PRODUCTION.md §7, file:specs/06_STOCK_MANAGEMENT.md §7, file:specs/07_FINANCE.md §7

- Replace BullMQ worker stubs with pg-boss equivalents in all Background Jobs sections

## Acceptance Criteria

No file in  references BullMQ, ioredis, or RedisAll job scheduling examples use boss.schedule() or boss.work() patterns "Deviation: no Redis" section updated to "pg-boss is the canonical queue"