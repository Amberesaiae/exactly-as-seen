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
    const mig = read('supabase/migrations/20260717000000_fix_create_batch_medication_id_and_vax_seed.sql');
    expect(mig).toContain('create_batch');
    expect(mig).toContain('medication_id'); // TEXT slugs, not UUID cast
  });

  /** Sole create_batch lock (qa pack B-batches). */
  it('B Create flock: sole create_batch RPC — no client batches insert', () => {
    const create = read('src/hooks/batch/useBatchCreateLogic.ts');
    expect(create).toContain("rpc('create_batch'");
    expect(create).toContain("queueRpc('create_batch'");
    expect(create).toContain('setPreferredBatchId');
    expect(create).not.toMatch(/from\(\s*['"]batches['"]\s*\)\s*\.insert/);
    expect(create).toContain('toast.error');
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

  /** K1/K2 sole-writer locks for day feed (qa pack C-today-ops-feed). */
  it('C Day feed: sole RPC writer — no client feed_logs multi-write (K1/K2)', () => {
    const feed = read('src/hooks/feed/useFeedData.ts');
    const health = read('src/hooks/useHealthData.ts');
    expect(feed).toContain("rpc('confirm_day_feed'");
    expect(feed).toContain("queueRpc('confirm_day_feed'");
    expect(feed).not.toMatch(/queueWrite\(\s*['"]feed_logs['"]/);
    expect(feed).not.toMatch(/from\(\s*['"]feed_logs['"]\s*\)\s*\.insert/);
    expect(feed).not.toContain('autoDeductStock');
    expect(health).toContain("rpc('confirm_day_feed'");
    expect(health).toContain("queueRpc('confirm_day_feed'");
    expect(health).not.toMatch(/queueWrite\(\s*['"]feed_logs['"]/);
    // Book now: expense only, not re-RPC intent after log
    expect(health).toContain('autoCreateExpense');
  });

  it('D Complete care: complete_health_task writer', () => {
    const mig = read('supabase/migrations/20260713030000_intent_writers_and_seed_gaps.sql');
    expect(mig).toContain('complete_health_task');
    expect(read('src/hooks/health/useMedicationLogic.ts')).toContain('complete_health_task');
  });

  /** K5/K6 sole-writer locks for care complete (qa pack D-care-health). */
  it('D Care: sole complete_health_task — no vaccine dual write / no post-RPC money (K5/K6)', () => {
    const vax = read('src/hooks/health/useVaccinationLogic.ts');
    const care = read('src/lib/care-completion.ts');
    const med = read('src/hooks/health/useMedicationLogic.ts');
    expect(vax).toContain("rpc('complete_health_task'");
    expect(vax).toContain("queueRpc('complete_health_task'");
    // K5: no primary schedule update as complete path
    expect(vax).not.toMatch(/from\(\s*['"]vaccination_schedule['"]\s*\)\s*\.update/);
    expect(vax).not.toContain('syncHealthTaskFromSchedule');
    // K6: post-effects must not auto-ledger
    expect(care).not.toContain('autoCreateExpense');
    expect(care).not.toContain('autoDeductStock');
    expect(care).toContain('seedPostVaccinationSupplements');
    // Medication complete still RPC + Book now keep
    expect(med).toContain("rpc('complete_health_task'");
    expect(med).toContain('autoCreateExpense'); // Book now only
  });

  it('E Plan/buy feed: formulation + ready-made', () => {
    expect(exists('src/pages/FeedFormulation.tsx')).toBe(true);
    expect(exists('src/components/feed/ReadyMadeFeed.tsx')).toBe(true);
    expect(exists('src/components/feed/CustomFormulation.tsx')).toBe(true);
  });

  /** S1/S2 sole-writer locks for feed lab (qa pack E-feed-lab). */
  it('E Feed lab: S1/S2 spine RPCs — no multi-write money paths (K7/K8)', () => {
    const ready = read('src/components/feed/ReadyMadeFeed.tsx');
    const custom = read('src/components/feed/CustomFormulation.tsx');
    const conc = read('src/components/feed/ConcentrateMix.tsx');
    const mig = read('supabase/migrations/20260717120000_feed_lab_intent_writers.sql');
    expect(mig).toContain('record_ready_made_purchase');
    expect(mig).toContain('confirm_formulation_allocation');
    expect(ready).toContain("rpc('record_ready_made_purchase'");
    expect(ready).toContain("queueRpc('record_ready_made_purchase'");
    expect(ready).not.toContain('autoCreateExpense');
    expect(custom).toContain("rpc('confirm_formulation_allocation'");
    expect(custom).not.toContain('autoDeductStock');
    expect(custom).not.toContain('autoCreateExpense');
    expect(conc).toContain("rpc('confirm_formulation_allocation'");
    expect(conc).not.toContain('autoDeductStock');
    expect(conc).not.toContain('autoCreateExpense');
  });

  it('F Stock: purchase RPC + FIFO', () => {
    expect(exists('src/pages/Stock.tsx')).toBe(true);
    expect(read('src/hooks/useStockData.ts')).toContain('stock_purchase');
  });

  /** K3 sole-writer lock for stock purchase (qa pack F-stock). */
  it('F Stock purchase: sole stock_purchase RPC — no purchase fallthrough multi-write (K3)', () => {
    const stock = read('src/hooks/useStockData.ts');
    expect(stock).toContain("rpc('stock_purchase'");
    expect(stock).toContain("queueRpc('stock_purchase'");
    // Purchase must fail closed — no client expenses insert on purchase path
    // After K3, expenses.insert should not appear (was fallthrough ledger)
    expect(stock).not.toMatch(/from\(\s*['"]expenses['"]\s*\)\s*\.insert/);
    // Purchase path must not insert stock_lots client-side
    const purchaseBlock = stock.slice(stock.indexOf("type === 'purchase'"), stock.indexOf("K9:") || stock.length);
    expect(purchaseBlock).not.toMatch(/from\(\s*['"]stock_lots['"]\s*\)\s*\.insert/);
    expect(purchaseBlock).not.toMatch(/from\(\s*['"]stock_transactions['"]\s*\)\s*\.insert/);
  });

  /** K9 sole-writer lock for stock usage. */
  it('F Stock usage: sole stock_usage RPC (K9)', () => {
    const stock = read('src/hooks/useStockData.ts');
    const mig = read('supabase/migrations/20260717150000_stock_usage_and_house_delete_guard.sql');
    expect(mig).toContain('stock_usage');
    expect(mig).toContain('guard_house_delete');
    expect(stock).toContain("rpc('stock_usage'");
    expect(stock).toContain("queueRpc('stock_usage'");
    // Usage path only — exclude residual adjustment multi-step below K9
    const k9Start = stock.indexOf('K9:');
    const adjStart = stock.indexOf('// adjustment only', k9Start);
    const usageBlock = stock.slice(k9Start, adjStart > k9Start ? adjStart : undefined);
    expect(usageBlock).toContain("type === 'usage'");
    expect(usageBlock).not.toMatch(/from\(\s*['"]stock_transactions['"]\s*\)\s*\.insert/);
    expect(usageBlock).not.toContain('allocate_fifo_by_quality');
  });

  /** S residual: occupied house delete blocked FE + migration. */
  it('S Houses: occupied delete guarded (FE + trigger)', () => {
    const farm = read('src/components/settings/FarmTab.tsx');
    const mig = read('supabase/migrations/20260717150000_stock_usage_and_house_delete_guard.sql');
    expect(mig).toContain('guard_house_delete');
    expect(mig).toContain('houses_guard_delete');
    expect(farm).toContain('Cannot delete house while a flock occupies it');
    expect(farm).toContain('Cannot delete house with an active flock');
    expect(farm).toContain('occupied_by_batch_id');
  });

  it('G Eggs: collection + sale RPC', () => {
    expect(exists('src/pages/Eggs.tsx')).toBe(true);
    expect(read('src/hooks/useEggData.ts')).toContain('record_egg_sale');
  });

  /** K4 sole-writer lock for egg sale (qa pack G-eggs). */
  it('G Egg sale: sole record_egg_sale RPC — no sale fallthrough multi-write (K4)', () => {
    const eggs = read('src/hooks/useEggData.ts');
    expect(eggs).toContain("rpc('record_egg_sale'");
    expect(eggs).toContain("queueRpc('record_egg_sale'");
    expect(eggs).toContain("rpc('record_egg_collection'");
    // No client fallthrough revenue/sale insert
    expect(eggs).not.toContain('autoCreateRevenue');
    expect(eggs).not.toMatch(/from\(\s*['"]egg_sales['"]\s*\)\s*\.insert/);
    expect(eggs).toMatch(/Egg sale failed|Insufficient egg inventory|withdrawal/i);
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
