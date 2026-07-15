import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockRpc = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

import { queueWrite, queueRpc, flushOutbox, getFailedItems } from '@/lib/sync';

let outboxStore: Array<{ id?: number; table: string; operation: string; record_id: string; data: Record<string, unknown>; created_at: string }> = [];
let nextId = 1;

vi.mock('@/lib/db', () => ({
  db: {
    sync_outbox: {
      add: vi.fn(async (entry: { table: string; operation: string; record_id: string; data: Record<string, unknown>; created_at: string }) => {
        const item = { ...entry, id: nextId++ };
        outboxStore.push(item);
        return item.id;
      }),
      toArray: vi.fn(async () => [...outboxStore]),
      delete: vi.fn(async (id: number) => {
        outboxStore = outboxStore.filter(item => item.id !== id);
      }),
    },
    farms: { bulkPut: vi.fn() },
    batches: { bulkPut: vi.fn(), where: vi.fn().mockReturnValue({ equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }) }) },
    houses: { bulkPut: vi.fn() },
    activity_log: { bulkPut: vi.fn() },
  },
}));

describe('sync.ts', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    outboxStore = [];
    nextId = 1;
  });

  describe('queueWrite', () => {
    it('adds an entry to the outbox', async () => {
      await queueWrite('farms', 'insert', 'farm-1', { name: 'Test Farm' });

      expect(outboxStore).toHaveLength(1);
      expect(outboxStore[0].table).toBe('farms');
      expect(outboxStore[0].operation).toBe('insert');
      expect(outboxStore[0].record_id).toBe('farm-1');
    });
  });

  describe('queueRpc', () => {
    it('queues an RPC with rpc: prefix table', async () => {
      await queueRpc('record_mortality', { p_count: 5 }, 'mortality-1');

      expect(outboxStore).toHaveLength(1);
      expect(outboxStore[0].table).toBe('rpc:record_mortality');
      expect(outboxStore[0].data).toEqual({ p_count: 5 });
    });

    it('generates UUID when no recordId provided', async () => {
      await queueRpc('confirm_day_feed', { p_batch_id: 'b1' });

      expect(outboxStore).toHaveLength(1);
      expect(outboxStore[0].record_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('flushOutbox', () => {
    it('processes RPC entries correctly', async () => {
      await queueRpc('record_mortality', { p_count: 3 }, 'm-1');

      await flushOutbox();

      expect(mockRpc).toHaveBeenCalledWith('record_mortality', { p_count: 3 });
    });

    it('does nothing when outbox is empty', async () => {
      await flushOutbox();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('handles failed items by adding to failedItems list', async () => {
      const origSetTimeout = globalThis.setTimeout;
      globalThis.setTimeout = ((fn: Function) => { fn(); return 0 as unknown as ReturnType<typeof setTimeout>; }) as unknown as typeof setTimeout;

      mockRpc.mockResolvedValue({ error: { message: 'RPC failed', code: 'XX000' } });

      await queueRpc('stock_purchase', { p_qty: 10 }, 'sp-1');
      await flushOutbox();

      globalThis.setTimeout = origSetTimeout;
      mockRpc.mockResolvedValue({ error: null });

      const failed = getFailedItems();
      expect(failed.length).toBeGreaterThanOrEqual(1);
    });
  });
});
