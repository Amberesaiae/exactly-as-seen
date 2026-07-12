/**
 * Canonical ledger policy (research dual pattern).
 * Consumption → shouldAutoLedger; purchases & sales → always ledger.
 */
import {
  shouldAutoLedger,
  type ProductionSystem,
} from '@/lib/production-system';

/** Day feed, water cost, health/vaccination consumption, custom formulation stock-out. */
export function shouldExpenseConsumption(system: ProductionSystem): boolean {
  return shouldAutoLedger(system);
}

/** Stock purchase, ready-made feed buy-in. Always books expense. */
export function shouldExpensePurchase(): boolean {
  return true;
}

/** Egg/bird/terminate sales. Always books revenue. */
export function shouldRevenueSale(): boolean {
  return true;
}

/** Stock deduction on consumption follows same dual gate as expense. */
export function shouldDeductStockOnConsumption(system: ProductionSystem): boolean {
  return shouldAutoLedger(system);
}
