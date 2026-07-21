import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { toPesewas, ledgerDate } from '@/lib/canonical';
import { isOffline, queueRpc } from '@/lib/sync';

/**
 * Synergy Service (Dovetail Synergy)
 * Money is stored only as amount_pesewas (migration 5B dropped amount).
 */

interface SynergyExpenseParams {
  farmId: string;
  batchId?: string | null;
  category: string;
  description: string;
  /** Major currency units (GHS/NGN); converted to pesewas on write. */
  amount: number;
  date?: string;
  source: string;
  sourceRef: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

interface SynergyStockDeductionParams {
  farmId: string;
  itemName: string;
  quantity: number;
  batchId: string;
  reason: string;
  sourceRef: string;
}

/**
 * Automates the creation of an expense from an operational event.
 */
export async function autoCreateExpense(params: SynergyExpenseParams) {
  const {
    farmId, batchId, category, description, amount, date, source, sourceRef,
    paymentMethod = 'cash', paymentStatus = 'paid',
  } = params;

  if (amount <= 0) return;

  // RPC-only ledger write (F-C-F-005): idempotent on (source, source_ref)
  const rpcArgs = {
    p_farm_id: farmId,
    p_batch_id: batchId || null,
    p_category: category,
    p_description: description,
    p_amount_pesewas: toPesewas(amount),
    p_date: date || ledgerDate(),
    p_source: source,
    p_source_ref: sourceRef,
    p_payment_method: paymentMethod,
    p_payment_status: paymentStatus,
  };

  if (isOffline()) {
    await queueRpc('record_manual_expense', rpcArgs, `${source}:${sourceRef}`);
    toast.success('Expense recorded (offline — will sync)');
    return;
  }

  const { error } = await supabase.rpc('record_manual_expense', rpcArgs);

  if (error) {
    // Duplicate auto-ledger is expected (idempotent unique source+source_ref)
    const isDup = error.code === '23505' || /duplicate|unique/i.test(error.message);
    if (!isDup) {
      console.error(`Synergy Error (Auto-Expense): ${error.message}`);
      toast.error(`Ledger expense failed: ${error.message}`);
    }
  }
}

function convertDoseToStockUnit(
  doseAmount: number,
  doseUnit: string | null,
  stockUnit: string
): number {
  if (!doseUnit) return doseAmount;
  const toMl: Record<string, number> = { tsp: 4.93, tbsp: 14.79, ml: 1, g: 1 };
  const doseInMl = doseAmount * (toMl[doseUnit] ?? 1);
  if (stockUnit === 'ml') return doseInMl;
  if (stockUnit === 'g') return doseInMl;
  if (stockUnit === 'L' || stockUnit === 'l') return doseInMl / 1000;
  if (stockUnit === 'kg') return doseAmount;
  return doseAmount;
}

/**
 * Automates stock deduction using FIFO allocation logic.
 */
export async function autoDeductStock(params: SynergyStockDeductionParams & { doseUnit?: string | null }) {
  const { farmId, itemName, quantity, batchId, reason, sourceRef, doseUnit } = params;

  if (quantity <= 0) return;

  const { data: matchedStock } = await supabase
    .from('stock_items')
    .select('*')
    .eq('farm_id', farmId)
    .ilike('name', itemName)
    .maybeSingle();

  if (!matchedStock) {
    console.warn(`Synergy Warning (Auto-Stock): No stock item found matching "${itemName}"`);
    return;
  }

  const qtyToDeduct = convertDoseToStockUnit(quantity, doseUnit || null, matchedStock.unit);

  const allocateArgs = {
    p_farm_id: farmId,
    p_stock_item_id: matchedStock.id,
    p_qty_needed: qtyToDeduct,
    p_batch_id: batchId,
    p_reason: reason,
    p_source_ref: sourceRef,
  };

  if (isOffline()) {
    await queueRpc('allocate_fifo_by_quality', allocateArgs);
    toast.success(`Auto-deduction queued for ${itemName} (offline — will sync)`);
    return;
  }

  const { error: allocError } = await supabase.rpc('allocate_fifo_by_quality', allocateArgs);

  if (allocError) {
    console.error(`Synergy Error (FIFO Allocation): ${allocError.message}`);
    toast.error(`Auto-deduction failed for ${itemName}: ${allocError.message}`);
    return;
  }

  const newQty = Math.max(0, Number(matchedStock.current_quantity) - qtyToDeduct);
  const { error: stockUpdateErr } = await supabase.from('stock_items')
    .update({ current_quantity: newQty, updated_at: new Date().toISOString() })
    .eq('id', matchedStock.id);

  if (stockUpdateErr) {
    console.error(`Synergy Error (Stock Update): ${stockUpdateErr.message}`);
    toast.error(`Stock quantity update failed for ${itemName}: ${stockUpdateErr.message}`);
  }
}

interface SynergyRevenueParams {
  farmId: string;
  batchId: string;
  category: string;
  description: string;
  amount: number;
  buyer?: string;
  date?: string;
  source: string;
  sourceRef: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

/**
 * Automates the creation of a revenue entry from an operational event.
 */
export async function autoCreateRevenue(params: SynergyRevenueParams) {
  const {
    farmId, batchId, category, description, amount, buyer, date, source, sourceRef,
    paymentMethod = 'cash', paymentStatus = 'paid',
  } = params;

  if (amount <= 0) return;

  // RPC-only ledger write (F-C-F-005): idempotent on (source, source_ref)
  const rpcArgs = {
    p_farm_id: farmId,
    p_batch_id: batchId,
    p_category: category,
    p_description: description,
    p_amount_pesewas: toPesewas(amount),
    p_buyer: buyer || null,
    p_date: date || ledgerDate(),
    p_source: source,
    p_source_ref: sourceRef,
    p_payment_method: paymentMethod,
    p_payment_status: paymentStatus,
  };

  if (isOffline()) {
    await queueRpc('record_manual_revenue', rpcArgs, `${source}:${sourceRef}`);
    toast.success('Revenue recorded (offline — will sync)');
    return;
  }

  const { error } = await supabase.rpc('record_manual_revenue', rpcArgs);

  if (error) {
    const isDup = error.code === '23505' || /duplicate|unique/i.test(error.message);
    if (!isDup) {
      console.error(`Synergy Error (Auto-Revenue): ${error.message}`);
      toast.error(`Failed to record revenue: ${error.message}`);
    }
  }
}

/**
 * Bird Sale Synergy: Atomic RPC — records revenue, reduces batch population, and logs activity.
 */
export async function recordBirdSale(params: {
  farmId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  buyer?: string;
  notes?: string;
  currentPopulation: number;
}) {
  const { farmId, batchId, quantity, unitPrice, totalAmount, buyer, notes, currentPopulation } = params;

  if (quantity > currentPopulation) {
    toast.error(`Insufficient birds. Current: ${currentPopulation}, requested: ${quantity}`);
    return null;
  }

  const pricePesewas = Math.round(totalAmount * 100);

  const birdSaleArgs = {
    p_farm_id: farmId,
    p_batch_id: batchId,
    p_quantity: quantity,
    p_price_pesewas: pricePesewas,
    p_buyer: buyer || '',
    p_date: new Date().toISOString().slice(0, 10),
    p_notes: notes || '',
  };

  if (isOffline()) {
    await queueRpc('record_bird_sale', birdSaleArgs);
    toast.success('Bird sale recorded (offline — will sync)');
    return { newPop: currentPopulation - quantity };
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc('record_bird_sale', birdSaleArgs);

  if (rpcError) {
    console.error(`Synergy Error (record_bird_sale): ${rpcError.message}`);
    return null;
  }

  if (rpcResult && !rpcResult.ok) {
    if (rpcResult.reason === 'insufficient_population') {
      toast.error(`Insufficient birds. Current: ${currentPopulation}, requested: ${quantity}`);
    } else if (rpcResult.reason === 'meat_withdrawal') {
      toast.error('Cannot sell birds during active meat withdrawal period');
    } else {
      console.error(`Synergy Error (record_bird_sale): ${rpcResult.reason}`);
      toast.error('Bird sale failed');
    }
    return null;
  }

  return { newPop: rpcResult?.new_population ?? currentPopulation - quantity };
}
