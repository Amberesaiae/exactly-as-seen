import { describe, it, expect } from 'vitest';
import {
  shouldExpenseConsumption,
  shouldExpensePurchase,
  shouldRevenueSale,
  shouldDeductStockOnConsumption,
  shouldOfferBookNow,
} from '@/lib/ledger-policy';

describe('ledger-policy (dual pattern)', () => {
  it('expenses consumption only for intensive systems', () => {
    expect(shouldExpenseConsumption('intensive')).toBe(true);
    expect(shouldExpenseConsumption('deep_litter')).toBe(true);
    expect(shouldExpenseConsumption('cage')).toBe(true);
    expect(shouldExpenseConsumption('semi_intensive')).toBe(false);
    expect(shouldExpenseConsumption('free_range')).toBe(false);
    expect(shouldExpenseConsumption('pasture')).toBe(false);
  });

  it('always expenses purchases regardless of production system', () => {
    expect(shouldExpensePurchase()).toBe(true);
  });

  it('always records revenue on sales', () => {
    expect(shouldRevenueSale()).toBe(true);
  });

  it('deducts stock on consumption only when intensive', () => {
    expect(shouldDeductStockOnConsumption('deep_litter')).toBe(true);
    expect(shouldDeductStockOnConsumption('semi_intensive')).toBe(false);
  });

  it('offers Book now only on flexible systems', () => {
    expect(shouldOfferBookNow('semi_intensive')).toBe(true);
    expect(shouldOfferBookNow('free_range')).toBe(true);
    expect(shouldOfferBookNow('deep_litter')).toBe(false);
    expect(shouldOfferBookNow('cage')).toBe(false);
  });
});
