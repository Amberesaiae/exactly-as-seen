import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/lib/production-system', () => ({
  shouldAutoLedger: vi.fn().mockReturnValue(true),
}));

vi.mock('date-fns', () => ({
  addDays: vi.fn((date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
  format: vi.fn(() => '2026-07-16'),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

import {
  isVaccinationHealthTask,
  syncScheduleFromHealthTask,
  syncHealthTaskFromSchedule,
  seedPostVaccinationSupplements,
} from '@/lib/care-completion';

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  const step = vi.fn().mockReturnValue(chain);
  const resolvedSelect = vi.fn().mockResolvedValue({ data, error });
  Object.assign(chain, {
    eq: step,
    ilike: step,
    gte: step,
    lte: step,
    in: step,
    select: resolvedSelect,
    insert: vi.fn().mockResolvedValue({ data, error }),
    update: vi.fn().mockReturnValue({ eq: step, select: resolvedSelect }),
    upsert: vi.fn().mockResolvedValue({ data, error }),
    delete: step,
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    single: vi.fn().mockResolvedValue({ data, error }),
  });
  return chain;
}

describe('care-completion (full)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isVaccinationHealthTask', () => {
    it('detects vaccination health tasks', () => {
      expect(isVaccinationHealthTask({ task_type: 'vaccination', product_name: 'Gumboro' })).toBe(true);
    });

    it('rejects non-vaccination tasks', () => {
      expect(isVaccinationHealthTask({ task_type: 'medication', product_name: 'CORID' })).toBe(false);
      expect(isVaccinationHealthTask({ task_type: 'supplement', product_name: 'Vitamins' })).toBe(false);
    });

    it('handles null task_type', () => {
      expect(isVaccinationHealthTask({ task_type: null, product_name: 'X' })).toBe(false);
    });
  });

  describe('syncScheduleFromHealthTask', () => {
    it('updates vaccination_schedule when health_task completes', async () => {
      const chain = makeChain([{ id: 'updated-1' }]);
      mockFrom.mockReturnValue(chain);

      const count = await syncScheduleFromHealthTask({
        batchId: 'batch-1',
        productName: 'Gumboro',
        completedAt: '2026-07-15T10:00:00Z',
      });

      expect(count).toBe(1);
      expect(mockFrom).toHaveBeenCalledWith('vaccination_schedule');
    });

    it('returns 0 for empty productName', async () => {
      const count = await syncScheduleFromHealthTask({
        batchId: 'batch-1',
        productName: '',
      });

      expect(count).toBe(0);
    });

    it('returns 0 for whitespace-only productName', async () => {
      const count = await syncScheduleFromHealthTask({
        batchId: 'batch-1',
        productName: '   ',
      });

      expect(count).toBe(0);
    });
  });

  describe('syncHealthTaskFromSchedule', () => {
    it('updates health_tasks when vaccine administered', async () => {
      const chain = makeChain([{ id: 'updated-1' }]);
      mockFrom.mockReturnValue(chain);

      const count = await syncHealthTaskFromSchedule({
        batchId: 'batch-1',
        vaccineName: 'Gumboro',
        completedAt: '2026-07-15T10:00:00Z',
      });

      expect(count).toBe(1);
      expect(mockFrom).toHaveBeenCalledWith('health_tasks');
    });

    it('returns 0 for empty vaccineName', async () => {
      const count = await syncHealthTaskFromSchedule({
        batchId: 'batch-1',
        vaccineName: '',
      });

      expect(count).toBe(0);
    });
  });

  describe('seedPostVaccinationSupplements', () => {
    it('upserts supplement tasks after vaccination', async () => {
      const chain = makeChain();
      mockFrom.mockReturnValue(chain);

      await seedPostVaccinationSupplements('farm-1', 'batch-1');

      expect(mockFrom).toHaveBeenCalledWith('health_tasks');
    });
  });
});
