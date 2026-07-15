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
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { autoCreateExpense, autoCreateRevenue, autoDeductStock, recordBirdSale } from '@/lib/synergy';

function chainableResolve(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  const fn = vi.fn().mockReturnValue(chain);
  Object.assign(chain, {
    eq: fn,
    ilike: fn,
    gte: fn,
    lte: fn,
    select: fn,
    insert: fn,
    update: fn,
    upsert: fn,
    delete: fn,
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    single: vi.fn().mockResolvedValue({ data, error }),
  });
  return fn;
}

describe('synergy.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {};
      const step = vi.fn().mockReturnValue(chain);
      Object.assign(chain, {
        eq: step,
        ilike: step,
        gte: step,
        lte: step,
        select: step,
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: step, select: step }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        delete: step,
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'stock-1', current_quantity: 100, unit: 'unit' }, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      return chain;
    });
    mockRpc.mockResolvedValue({ error: null });
  });

  describe('autoCreateExpense', () => {
    it('skips expense when amount is zero', async () => {
      await autoCreateExpense({
        farmId: 'farm-1',
        category: 'feed_and_nutrition',
        description: 'Zero cost',
        amount: 0,
        source: 'auto:feed',
        sourceRef: 'purchase-zero',
      });

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('skips expense when amount is negative', async () => {
      await autoCreateExpense({
        farmId: 'farm-1',
        category: 'feed_and_nutrition',
        description: 'Negative cost',
        amount: -10,
        source: 'auto:feed',
        sourceRef: 'purchase-neg',
      });

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('calls supabase.from with expenses for positive amount', async () => {
      await autoCreateExpense({
        farmId: 'farm-1',
        category: 'feed_and_nutrition',
        description: 'Maize purchase',
        amount: 50.0,
        source: 'auto:feed',
        sourceRef: 'purchase-123',
      });

      expect(mockFrom).toHaveBeenCalledWith('expenses');
    });
  });

  describe('autoCreateRevenue', () => {
    it('skips revenue when amount is zero', async () => {
      await autoCreateRevenue({
        farmId: 'farm-1',
        batchId: 'batch-1',
        category: 'egg_sales',
        description: 'Zero sale',
        amount: 0,
        source: 'auto:eggs',
        sourceRef: 'egg-sale-zero',
      });

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('calls supabase.from with revenue for positive amount', async () => {
      await autoCreateRevenue({
        farmId: 'farm-1',
        batchId: 'batch-1',
        category: 'egg_sales',
        description: 'Egg sale',
        amount: 120.0,
        source: 'auto:eggs',
        sourceRef: 'egg-sale-1',
      });

      expect(mockFrom).toHaveBeenCalledWith('revenue');
    });
  });

  describe('autoDeductStock', () => {
    it('skips when quantity is zero', async () => {
      await autoDeductStock({
        farmId: 'farm-1',
        itemName: 'Oxytetracycline',
        quantity: 0,
        batchId: 'batch-1',
        reason: 'Zero deduction',
        sourceRef: 'task-zero',
      });

      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('calls FIFO RPC for positive quantity', async () => {
      await autoDeductStock({
        farmId: 'farm-1',
        itemName: 'Oxytetracycline',
        quantity: 5,
        batchId: 'batch-1',
        reason: 'Health task deduction',
        sourceRef: 'task-1',
      });

      expect(mockRpc).toHaveBeenCalledWith(
        'allocate_fifo_by_quality',
        expect.objectContaining({
          p_farm_id: 'farm-1',
          p_qty_needed: 5,
        })
      );
    });
  });

  describe('recordBirdSale', () => {
    it('rejects sale exceeding population', async () => {
      const result = await recordBirdSale({
        farmId: 'farm-1',
        batchId: 'batch-1',
        quantity: 200,
        unitPrice: 10,
        totalAmount: 2000,
        currentPopulation: 100,
      });

      expect(result).toBeNull();
    });

    it('allows sale when quantity equals population', async () => {
      const result = await recordBirdSale({
        farmId: 'farm-1',
        batchId: 'batch-1',
        quantity: 100,
        unitPrice: 10,
        totalAmount: 1000,
        currentPopulation: 100,
      });

      expect(result).toEqual({ newPop: 0 });
    });
  });
});
