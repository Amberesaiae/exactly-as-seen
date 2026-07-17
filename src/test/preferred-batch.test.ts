import { describe, it, expect, beforeEach } from 'vitest';
import {
  setPreferredBatchId,
  getPreferredBatchId,
  resolvePreferredBatchId,
} from '@/lib/preferred-batch';

describe('preferred-batch', () => {
  beforeEach(() => {
    setPreferredBatchId(null);
  });

  it('stores and reads preferred batch id', () => {
    setPreferredBatchId('batch-abc');
    expect(getPreferredBatchId()).toBe('batch-abc');
  });

  it('resolves only when still in active list', () => {
    setPreferredBatchId('b1');
    expect(resolvePreferredBatchId(['b2', 'b1'])).toBe('b1');
    expect(resolvePreferredBatchId(['b2', 'b3'])).toBeNull();
  });

  it('clears when set to null', () => {
    setPreferredBatchId('b1');
    setPreferredBatchId(null);
    expect(getPreferredBatchId()).toBeNull();
  });
});
