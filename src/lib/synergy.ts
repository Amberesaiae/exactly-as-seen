import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { toPesewas, ledgerDate } from '@/lib/canonical';

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

  const { error } = await supabase.from('expenses').upsert({
    farm_id: farmId,
    batch_id: batchId || null,
    category,
    description,
    amount_pesewas: toPesewas(amount),
    date: date || ledgerDate(),
    source,
    source_ref: sourceRef,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
  }, { onConflict: 'source,source_ref', ignoreDuplicates: true });

  if (error) {
    console.error(`Synergy Error (Auto-Expense): ${error.message}`);
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

  const { error: allocError } = await (supabase as any).rpc('allocate_fifo_by_quality', {
    p_farm_id: farmId,
    p_stock_item_id: matchedStock.id,
    p_qty_needed: qtyToDeduct,
    p_batch_id: batchId,
    p_reason: reason,
    p_source_ref: sourceRef,
  });

  if (allocError) {
    console.error(`Synergy Error (FIFO Allocation): ${allocError.message}`);
    toast.error(`Auto-deduction failed for ${itemName}: ${allocError.message}`);
    return;
  }

  const newQty = Math.max(0, Number(matchedStock.current_quantity) - qtyToDeduct);
  await supabase.from('stock_items')
    .update({ current_quantity: newQty, updated_at: new Date().toISOString() })
    .eq('id', matchedStock.id);
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

  const { error } = await supabase.from('revenue').upsert({
    farm_id: farmId,
    batch_id: batchId,
    category,
    description,
    amount_pesewas: toPesewas(amount),
    buyer: buyer || null,
    date: date || ledgerDate(),
    source,
    source_ref: sourceRef,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
  }, { onConflict: 'source,source_ref', ignoreDuplicates: true });

  if (error) {
    console.error(`Synergy Error (Auto-Revenue): ${error.message}`);
  }
}

/**
 * Bird Sale Synergy: Records revenue and reduces batch population.
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

  const sourceRef = `${batchId}:sale:${quantity}:${Math.round(totalAmount * 100)}:${Date.now()}`;

  await autoCreateRevenue({
    farmId,
    batchId,
    category: 'bird_sales',
    description: `Bird Sale: ${quantity} birds @ ${unitPrice.toFixed(2)}${notes ? ` — ${notes}` : ''}`,
    amount: totalAmount,
    buyer,
    source: 'auto:sale',
    sourceRef,
  });

  const newPop = currentPopulation - quantity;
  const { error: popError, data: updated } = await supabase.from('batches')
    .update({ current_population: newPop })
    .eq('id', batchId)
    .gte('current_population', quantity)
    .select('id')
    .maybeSingle();

  if (popError || !updated) {
    console.error(`Synergy Error (Population Sync): ${popError?.message ?? 'population race'}`);
    return null;
  }

  await supabase.from('activity_log').insert({
    farm_id: farmId,
    batch_id: batchId,
    event_type: 'bird_sale',
    description: `Sold ${quantity} birds for ${totalAmount.toFixed(2)}${buyer ? ` to ${buyer}` : ''}`,
  });

  return { newPop };
}
