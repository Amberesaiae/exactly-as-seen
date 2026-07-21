import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queueRpc } from '@/lib/sync';
import { LEDGER_SOURCES } from '@/lib/canonical';
import {
  shouldDeductStockOnConsumption,
  shouldExpenseConsumption,
  shouldOfferBookNow,
  shouldSkipDayFeedExpense,
} from '@/lib/ledger-policy';
import { pickPreferredFeedStock } from '@/lib/stock-match';

/**
 * F-C-F-006: single shared day-feed confirm intent used by both the Feed Lab
 * (useFeedData) and Care (useHealthData) surfaces. One intent → one RPC writer.
 *
 * Server authority (confirm_day_feed):
 * - fail-closed insufficient-stock guard (C-F-U16)
 * - stock-backed feeding never re-expenses (F-E-005); expense only for
 *   direct buy+feed without stock backing
 */
export interface DayFeedOutcome {
  status: 'ok' | 'queued' | 'already_logged' | 'blocked' | 'error';
  qty: number;
}

export async function confirmDayFeedIntent(params: {
  farmId: string;
  batchId: string;
  qty: number;
  species?: string | null;
  productionSystem?: string | null;
  todayStr: string;
}): Promise<DayFeedOutcome> {
  const { farmId, batchId, qty, species, productionSystem, todayStr } = params;

  const system = productionSystem ?? null;
  const deductStock = shouldDeductStockOnConsumption(system);
  const expenseConsumption = shouldExpenseConsumption(system);

  const { data: allStock } = await supabase.from('stock_items').select('*').eq('farm_id', farmId);
  const feedStock = pickPreferredFeedStock(allStock ?? []);
  const feedName = feedStock?.name ?? `${species ?? 'flock'} feed`;
  const sourceRef = `day-feed:${batchId}:${todayStr}`;
  const unitPricePesewas = feedStock ? Number(feedStock.unit_price_pesewas || 0) : 0;
  const unitPrice = unitPricePesewas / 100;
  const bookAmount = unitPrice > 0 ? qty * unitPrice : 0;

  // Double-ledger guard (client preview; server enforces regardless)
  let stockPurchasedSameDay = false;
  if (feedStock) {
    const { data: txs } = await supabase
      .from('stock_transactions')
      .select('id')
      .eq('farm_id', farmId)
      .eq('stock_item_id', feedStock.id)
      .eq('transaction_type', 'purchase')
      .gte('date', todayStr)
      .limit(1);
    stockPurchasedSameDay = (txs?.length ?? 0) > 0;
  }
  const skipExpense = shouldSkipDayFeedExpense({ stockPurchasedSameDay, unitPricePesewas });

  const doLedger = deductStock && !!feedStock;
  const rpcArgs = {
    p_farm_id: farmId,
    p_batch_id: batchId,
    p_quantity_kg: qty,
    p_feed_type: feedName,
    p_date: todayStr,
    p_ledger: doLedger,
    p_stock_item_id: feedStock?.id ?? undefined,
    p_unit_price_pesewas: unitPricePesewas,
    p_skip_expense: skipExpense || !expenseConsumption,
  };

  // Offline: queue full intent RPC — never raw feed_logs
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await queueRpc('confirm_day_feed', rpcArgs, sourceRef);
    toast.warning('Offline — feed queued; will sync when online');
    return { status: 'queued', qty };
  }

  const { data: rpcData, error: rpcErr } = await supabase.rpc('confirm_day_feed', rpcArgs);

  // Fail closed — no client multi-write rescue
  if (rpcErr) {
    toast.error(rpcErr.message || 'Failed to confirm feeding');
    return { status: 'error', qty };
  }

  const result = rpcData as { ok?: boolean; reason?: string; already_logged?: boolean; available_kg?: number } | null;

  if (result && result.ok === false) {
    if (result.reason === 'insufficient_stock') {
      toast.error(
        `Not enough feed in stock: ${Number(result.available_kg ?? 0).toFixed(1)}kg available, ${qty.toFixed(1)}kg needed. Purchase feed first.`
      );
    } else {
      toast.error('Failed to confirm feeding');
    }
    return { status: 'blocked', qty };
  }

  if (result?.already_logged) {
    toast.error('Feed already logged for today');
    return { status: 'already_logged', qty };
  }

  if (deductStock && feedStock) {
    toast.success(`Today's feeding confirmed: ${qty.toFixed(1)}kg deducted from stock`);
  } else if (deductStock && !feedStock) {
    toast.warning(`Feed logged (${qty.toFixed(1)}kg) — no feed stock item found for auto-deduct`);
  } else if (shouldOfferBookNow(system)) {
    toast.message(`Today's feeding logged: ${qty.toFixed(1)}kg (flexible — not auto-ledgered)`, {
      duration: 8000,
      action: bookAmount > 0
        ? {
            label: 'Book now',
            onClick: async () => {
              // Manual book expense only — re-RPC would hit already_logged without expense
              try {
                const { autoCreateExpense } = await import('@/lib/synergy');
                await autoCreateExpense({
                  farmId, batchId, category: 'feed_and_nutrition',
                  description: `Daily Feeding (booked): ${qty}kg ${feedName}`,
                  amount: bookAmount, source: LEDGER_SOURCES.feed, sourceRef: `${sourceRef}:book`,
                });
                toast.success('Feed expense booked');
              } catch (e) {
                console.error('Book now feed error:', e);
                toast.error('Failed to book feed expense');
              }
            },
          }
        : {
            label: 'Open Ledger',
            onClick: () => { window.location.href = '/finance'; },
          },
    });
  } else {
    toast.success(`Today's feeding logged: ${qty.toFixed(1)}kg`);
  }

  return { status: 'ok', qty };
}
