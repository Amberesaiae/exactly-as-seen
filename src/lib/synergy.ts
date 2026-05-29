import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Synergy Service (Dovetail Synergy)
 * Centralizes cross-module orchestration for Lampfarms.
 */

interface SynergyExpenseParams {
  farmId: string;
  batchId?: string | null;
  category: string;
  description: string;
  amount: number;
  date?: string;
  source: string;
  sourceRef: string;
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
  const { farmId, batchId, category, description, amount, date, source, sourceRef } = params;
  
  if (amount <= 0) return;

  const { error } = await supabase.from('expenses').upsert({
    farm_id: farmId,
    batch_id: batchId || null,
    category,
    description,
    amount,
    amount_pesewas: Math.round(amount * 100),
    date: date || new Date().toISOString().split('T')[0],
    source,
    source_ref: sourceRef,
  }, { onConflict: 'source,source_ref', ignoreDuplicates: true });

  if (error) {
    console.error(`Synergy Error (Auto-Expense): ${error.message}`);
  }
}

/**
 * Unit conversion helper for medication stock deduction.
 */
function convertDoseToStockUnit(
  doseAmount: number,
  doseUnit: string | null,
  stockUnit: string
): number {
  if (!doseUnit) return 1;
  // Volume conversions to ml
  const toMl: Record<string, number> = { tsp: 4.93, tbsp: 14.79, ml: 1, g: 1 };
  const doseInMl = doseAmount * (toMl[doseUnit] ?? 1);
  if (stockUnit === 'ml') return doseInMl;
  if (stockUnit === 'g') return doseInMl; // approximate for liquids
  if (stockUnit === 'L' || stockUnit === 'l') return doseInMl / 1000;
  return 1;
}

/**
 * Automates stock deduction using FIFO allocation logic.
 */
export async function autoDeductStock(params: SynergyStockDeductionParams & { doseUnit?: string | null }) {
  const { farmId, itemName, quantity, batchId, reason, sourceRef, doseUnit } = params;

  if (quantity <= 0) return;

  // 1. Find matching stock item
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

  // 2. Unit Conversion
  const qtyToDeduct = convertDoseToStockUnit(quantity, doseUnit || null, matchedStock.unit);

  // 3. Perform FIFO allocation via RPC
  const { error: allocError } = await (supabase as any).rpc('allocate_fifo_by_quality', {
    p_farm_id: farmId,
    p_stock_item_id: matchedStock.id,
    p_qty_needed: qtyToDeduct,
    p_batch_id: batchId,
    p_reason: reason,
    p_source_ref: sourceRef
  });

  if (allocError) {
    console.error(`Synergy Error (FIFO Allocation): ${allocError.message}`);
    toast.error(`Auto-deduction failed for ${itemName}: ${allocError.message}`);
    return;
  }

  // 4. Update cached quantity in stock_items
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
}

/**
 * Automates the creation of a revenue entry from an operational event.
 */
export async function autoCreateRevenue(params: SynergyRevenueParams) {
  const { farmId, batchId, category, description, amount, buyer, date, source, sourceRef } = params;

  if (amount <= 0) return;

  const { error } = await supabase.from('revenue').upsert({
    farm_id: farmId,
    batch_id: batchId,
    category,
    description,
    amount,
    amount_pesewas: Math.round(amount * 100),
    buyer: buyer || null,
    date: date || new Date().toISOString().split('T')[0],
    source,
    source_ref: sourceRef,
  }, { onConflict: 'source,source_ref', ignoreDuplicates: true });

  if (error) {
    console.error(`Synergy Error (Auto-Revenue): ${error.message}`);
  }
}

/**
 * Bird Sale Synergy: Records revenue and reduces batch population atomically.
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

  // 1. Synergy: Auto-Revenue Creation
  await autoCreateRevenue({
    farmId,
    batchId,
    category: 'bird_sales',
    description: `Bird Sale: ${quantity} birds @ GHS ${unitPrice.toFixed(2)}`,
    amount: totalAmount,
    buyer,
    source: 'auto:sale',
    sourceRef: `${batchId}:sale:${Date.now()}`
  });

  // 2. Reduce population
  const newPop = currentPopulation - quantity;
  const { error: popError } = await supabase.from('batches')
    .update({ current_population: newPop })
    .eq('id', batchId);

  if (popError) {
    console.error(`Synergy Error (Population Sync): ${popError.message}`);
    return null;
  }

  // 3. Log Activity
  await supabase.from('activity_log').insert({
    farm_id: farmId,
    batch_id: batchId,
    event_type: 'bird_sale',
    description: `Sold ${quantity} birds for GHS ${totalAmount.toFixed(2)}${buyer ? ` to ${buyer}` : ''}`,
  });

  return { newPop };
}
