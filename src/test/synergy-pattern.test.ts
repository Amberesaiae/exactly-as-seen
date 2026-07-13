import { describe, it, expect } from 'vitest';
import {
  shouldExpenseConsumption,
  shouldExpensePurchase,
  shouldRevenueSale,
  shouldDeductStockOnConsumption,
  shouldOfferBookNow,
  shouldSkipDayFeedExpense,
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

  it('skips day-feed expense when stock purchased same day (double-ledger guard)', () => {
    expect(shouldSkipDayFeedExpense({ stockPurchasedSameDay: true, unitPricePesewas: 500 })).toBe(true);
    expect(shouldSkipDayFeedExpense({ stockPurchasedSameDay: false, unitPricePesewas: 500 })).toBe(false);
    expect(shouldSkipDayFeedExpense({ stockPurchasedSameDay: false, unitPricePesewas: 0 })).toBe(true);
  });
});

import { resolveAmbientTempC } from '@/lib/ghana-regions';
import { getAllowedBatchActions, phaseFromWeek } from '@/lib/batch-fsm';

describe('resolveAmbientTempC (H2 regional, not hardcode 28)', () => {
  it('prefers measured temp', () => {
    expect(resolveAmbientTempC(31.5, 'Northern')).toBe(31.5);
  });
  it('uses regional climatology when no sensor', () => {
    expect(resolveAmbientTempC(null, 'Northern')).toBe(33);
    expect(resolveAmbientTempC(null, 'Upper East')).toBe(34);
    expect(resolveAmbientTempC(null, 'Western')).toBe(27);
  });
  it('falls back to national default', () => {
    expect(resolveAmbientTempC(null, null)).toBe(28);
    expect(resolveAmbientTempC(null, 'UnknownRegion')).toBe(28);
  });
});

describe('getAllowedBatchActions (FSM UI helpers)', () => {
  it('blocks sale and normal terminate under withdrawal', () => {
    const a = getAllowedBatchActions({
      status: 'active',
      currentWeek: 6,
      cycleLengthWeeks: 8,
      hasActiveWithdrawal: true,
      species: 'broiler',
      duckType: null,
    });
    expect(a.canSellBirds).toBe(false);
    expect(a.canTerminateNormal).toBe(false);
    expect(a.canEmergencyTerminate).toBe(true);
    expect(a.phase).toBe('finisher');
  });
  it('phaseFromWeek matches boundaries', () => {
    expect(phaseFromWeek({ species: 'broiler', duckType: null, currentWeek: 1 })).toBe('brooding');
    expect(phaseFromWeek({ species: 'broiler', duckType: null, currentWeek: 4 })).toBe('grower');
    expect(phaseFromWeek({ species: 'broiler', duckType: null, currentWeek: 8 })).toBe('ready_to_sell');
  });
});
