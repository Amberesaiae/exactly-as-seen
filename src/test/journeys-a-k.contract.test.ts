/**
 * Journey A–K contract tests (Q2 offline half).
 * Asserts product surface exists: routes, writers, dual helpers.
 * Live browser E2E is e2e/journeys.spec.ts + CI.
 * @see docs/CANONICAL_JOURNEYS.md
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../..');

function read(pathFromRoot: string): string {
  return readFileSync(join(root, pathFromRoot), 'utf8');
}

function exists(pathFromRoot: string): boolean {
  return existsSync(join(root, pathFromRoot));
}

describe('Journeys A–K contract', () => {
  it('A Onboard: register + farm setup pages exist', () => {
    expect(exists('src/pages/Register.tsx')).toBe(true);
    expect(exists('src/pages/FarmSetup.tsx')).toBe(true);
    expect(exists('src/pages/Welcome.tsx')).toBe(true);
  });

  it('B Start flock: BatchCreate + create_batch RPC migration', () => {
    expect(exists('src/pages/BatchCreate.tsx')).toBe(true);
    expect(exists('src/hooks/batch/useBatchCreateLogic.ts')).toBe(true);
    const mig = read('supabase/migrations/20260713040000_remaining_intent_writers.sql');
    expect(mig).toContain('create_batch');
  });

  it('C Today ops: dashboard + ensure daily tasks + feed/water', () => {
    expect(exists('src/pages/Dashboard.tsx')).toBe(true);
    expect(exists('src/lib/ensure-daily-tasks.ts')).toBe(true);
    expect(exists('src/pages/Feed.tsx')).toBe(true);
    expect(exists('src/pages/Health.tsx')).toBe(true);
    const ensure = read('src/lib/ensure-daily-tasks.ts');
    expect(ensure).toContain('markBatchTaskComplete');
    expect(ensure).toContain('feed_log');
    expect(ensure).toContain('water_log');
  });

  it('D Complete care: complete_health_task writer', () => {
    const mig = read('supabase/migrations/20260713030000_intent_writers_and_seed_gaps.sql');
    expect(mig).toContain('complete_health_task');
    expect(read('src/hooks/health/useMedicationLogic.ts')).toContain('complete_health_task');
  });

  it('E Plan/buy feed: formulation + ready-made', () => {
    expect(exists('src/pages/FeedFormulation.tsx')).toBe(true);
    expect(exists('src/components/feed/ReadyMadeFeed.tsx')).toBe(true);
    expect(exists('src/components/feed/CustomFormulation.tsx')).toBe(true);
  });

  it('F Stock: purchase RPC + FIFO', () => {
    expect(exists('src/pages/Stock.tsx')).toBe(true);
    expect(read('src/hooks/useStockData.ts')).toContain('stock_purchase');
  });

  it('G Eggs: collection + sale RPC', () => {
    expect(exists('src/pages/Eggs.tsx')).toBe(true);
    expect(read('src/hooks/useEggData.ts')).toContain('record_egg_sale');
  });

  it('H Mortality / bird sale', () => {
    expect(read('src/lib/batch-utils.ts')).toContain('record_mortality');
    expect(exists('src/components/BirdSaleDialog.tsx')).toBe(true);
  });

  it('I Close flock: terminate_batch', () => {
    expect(read('src/components/batch/TerminationDialog.tsx')).toContain('terminate_batch');
  });

  it('J Background jobs: edge functions present', () => {
    expect(exists('supabase/functions/generate-daily-tasks/index.ts')).toBe(true);
    expect(exists('supabase/functions/advance-batch-weeks/index.ts')).toBe(true);
    expect(exists('supabase/functions/check-withdrawal-periods/index.ts')).toBe(true);
  });

  it('K Money hub: Finance + Records + dual ledger policy', () => {
    expect(exists('src/pages/Finance.tsx')).toBe(true);
    expect(exists('src/pages/Records.tsx')).toBe(true);
    expect(read('src/lib/ledger-policy.ts')).toContain('shouldExpenseConsumption');
    expect(read('src/lib/ledger-policy.ts')).toContain('shouldSkipDayFeedExpense');
  });
});
