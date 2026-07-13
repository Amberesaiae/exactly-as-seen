import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import {
  DEFAULT_STOCK_QUALITY,
  expenseCategoryForStockItem,
  toPesewas,
  ledgerDate,
  LEDGER_SOURCES,
  selectPrimaryFarm,
} from '@/lib/canonical';
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];
type StockTransaction = Database['public']['Tables']['stock_transactions']['Row'];

export function useStockData() {
  const { user } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farms } = await supabase.from('farms').select('id, setup_complete, updated_at').eq('user_id', user.id);
      const farm = selectPrimaryFarm(farms);
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);

      const [itemsRes, txsRes, batchesRes] = await Promise.all([
        supabase.from('stock_items').select('*').eq('farm_id', farm.id).order('name'),
        supabase.from('stock_transactions').select('*').eq('farm_id', farm.id).order('date', { ascending: false }).limit(50),
        supabase.from('batches').select('id, name').eq('farm_id', farm.id).eq('status', 'active')
      ]);

      setStockItems(itemsRes.data ?? []);
      setTransactions(txsRes.data ?? []);
      setBatches(batchesRes.data ?? []);

      setLoading(false);
    };
    load();
  }, [user]);

  const stats = useMemo(() => {
    const totalValue = stockItems.reduce((s, item) => s + (item.current_quantity * Number((item as any).unit_price_pesewas || 0) / 100), 0);
    const lowStockCount = stockItems.filter(item => item.current_quantity <= item.reorder_threshold).length;
    const categories = Array.from(new Set(stockItems.map(i => i.category)));
    return { totalValue, lowStockCount, categories };
  }, [stockItems]);

  const lowStockItems = useMemo(() => {
    return stockItems.filter(item => item.current_quantity <= item.reorder_threshold);
  }, [stockItems]);

  const addStockItem = async (data: any) => {
    if (!farmId) return;
    setSubmitting(true);
    const { data: item, error } = await supabase.from('stock_items').insert({
      name: data.name,
      category: data.category,
      unit: data.unit,
      current_quantity: data.current_quantity,
      reorder_threshold: data.reorder_threshold,
      unit_price_pesewas: data.unit_price ? Math.round(Number(data.unit_price) * 100) : 0,
      farm_id: farmId,
    } as any).select().single();

    if (error) { toast.error(error.message); setSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'stock_update',
      description: `Added new stock item: ${data.name} (${data.category})`,
    });

    setStockItems(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
    setSubmitting(false);
    toast.success('Stock item added');
  };

  const recordTransaction = async (params: {
    itemId: string;
    type: 'purchase' | 'usage' | 'adjustment';
    qty: number;
    price?: number;
    notes?: string;
    qualityGrade?: string;
    expiryDate?: string;
    batchId?: string | null;
  }) => {
    const { itemId, type, qty, price, notes, qualityGrade, expiryDate, batchId } = params;
    if (!farmId) return;
    setSubmitting(true);
    
    const item = stockItems.find(i => i.id === itemId);
    if (!item) { setSubmitting(false); return; }

    const newQty = type === 'purchase' ? item.current_quantity + qty : item.current_quantity - qty;
    if (newQty < 0) { toast.error('Insufficient stock'); setSubmitting(false); return; }

    // W4: atomic purchase path (tx + lot + qty + expense)
    if (type === 'purchase') {
      const unitPricePesewas = price != null && price > 0 ? Math.round(price * 100) : 0;
      const purchaseArgs = {
        p_farm_id: farmId,
        p_stock_item_id: itemId,
        p_qty: qty,
        p_unit_price_pesewas: unitPricePesewas,
        p_notes: notes || null,
        p_quality_grade: (qualityGrade as typeof DEFAULT_STOCK_QUALITY) || DEFAULT_STOCK_QUALITY,
        p_expiry_date: expiryDate || null,
        p_batch_id: batchId || null,
        p_expense_category: expenseCategoryForStockItem(item.category),
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const { queueRpc } = await import('@/lib/sync');
        await queueRpc('stock_purchase', purchaseArgs, `stock-purchase:${itemId}:${Date.now()}`);
        setStockItems(prev => prev.map(i => i.id === itemId ? {
          ...i,
          current_quantity: newQty,
          ...(unitPricePesewas > 0 ? { unit_price_pesewas: unitPricePesewas } : {}),
        } : i));
        setSubmitting(false);
        toast.warning('Offline — stock purchase queued; will sync when online');
        return;
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('stock_purchase' as any, purchaseArgs);

      if (!rpcError && rpcData && (rpcData as any).ok) {
        const computedNew = Number((rpcData as any).new_quantity);
        setStockItems(prev => prev.map(i => i.id === itemId ? {
          ...i,
          current_quantity: computedNew,
          ...(unitPricePesewas > 0 ? { unit_price_pesewas: unitPricePesewas } : {}),
        } : i));
        const txStub = {
          id: (rpcData as any).transaction_id,
          farm_id: farmId,
          stock_item_id: itemId,
          transaction_type: 'purchase',
          quantity: qty,
          unit_price_pesewas: unitPricePesewas || null,
          total_cost_pesewas: unitPricePesewas ? Math.round(qty * unitPricePesewas) : null,
          notes: notes || null,
          date: ledgerDate(),
        } as StockTransaction;
        setTransactions(prev => [txStub, ...prev.slice(0, 49)]);
        setSubmitting(false);
        toast.success(`Recorded purchase: ${qty} ${item.unit}`);
        return;
      }

      if (rpcError) {
        console.warn('stock_purchase RPC failed, client fallback:', rpcError.message);
      }
    }

    const { data: tx, error: txError } = await supabase.from('stock_transactions').insert({
      farm_id: farmId,
      stock_item_id: itemId,
      transaction_type: type,
      quantity: qty,
      unit_price_pesewas: price ? Math.round(price * 100) : null,
      total_cost_pesewas: price ? Math.round(qty * price * 100) : null,
      notes: notes || null,
    }).select().single();

    if (txError) { toast.error(txError.message); setSubmitting(false); return; }

    if (type === 'purchase') {
      const { error: lotError } = await supabase.from('stock_lots').insert({
        farm_id: farmId,
        stock_item_id: itemId,
        qty_on_hand: qty,
        unit_price_pesewas: price ? Math.round(price * 100) : 0,
        quality_grade: (qualityGrade as typeof DEFAULT_STOCK_QUALITY) || DEFAULT_STOCK_QUALITY,
        expiry_date: expiryDate || null,
        received_at: new Date().toISOString()
      });
      if (lotError) {
        toast.error('Failed to create stock lot: ' + lotError.message);
        setSubmitting(false);
        return;
      }
    }

    if (type === 'usage') {
      const { error: allocError } = await (supabase as any).rpc('allocate_fifo_by_quality', {
        p_farm_id: farmId,
        p_stock_item_id: itemId,
        p_qty_needed: qty,
        p_batch_id: batchId || null,
        p_reason: notes || 'Stock usage',
        p_source_ref: tx.id
      });
      if (allocError) {
        toast.error('FIFO stock allocation failed: ' + allocError.message);
        setSubmitting(false);
        return;
      }
    }

    const itemPatch: Record<string, unknown> = {
      current_quantity: newQty,
      updated_at: new Date().toISOString(),
    };
    if (type === 'purchase' && price != null && price > 0) {
      itemPatch.unit_price_pesewas = Math.round(price * 100);
    }
    const { error: itemError } = await supabase.from('stock_items').update(itemPatch as any).eq('id', itemId);

    if (itemError) { toast.error(itemError.message); setSubmitting(false); return; }

    if (type === 'purchase' && price != null && price > 0) {
      const totalPesewas = toPesewas(qty * price);
      const { error: expError } = await supabase.from('expenses').insert({
        farm_id: farmId,
        batch_id: batchId || null,
        category: expenseCategoryForStockItem(item.category),
        description: `Purchase: ${qty} ${item.unit} of ${item.name}`,
        amount_pesewas: totalPesewas,
        date: ledgerDate(),
        source: LEDGER_SOURCES.stock,
        source_ref: tx.id,
        payment_method: 'cash',
        payment_status: 'paid',
      });
      if (expError) {
        const isDup = expError.code === '23505' || /duplicate|unique/i.test(expError.message);
        if (!isDup) {
          toast.error(`Stock updated but expense failed: ${expError.message}`);
          console.error('Stock purchase expense:', expError);
        }
      }
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'stock_transaction',
      description: `${type.toUpperCase()}: ${qty} ${item.unit} of ${item.name}`,
    });

    setStockItems(prev => prev.map(i => i.id === itemId ? {
      ...i,
      current_quantity: newQty,
      ...(type === 'purchase' && price != null && price > 0
        ? { unit_price_pesewas: Math.round(price * 100) }
        : {}),
    } : i));
    setTransactions(prev => [tx, ...prev.slice(0, 49)]);
    setSubmitting(false);
    toast.success(`Recorded ${type}: ${qty} ${item.unit}`);
  };

  return {
    loading,
    stockItems,
    transactions,
    stats,
    lowStockItems,
    submitting,
    costPrivacyEnabled,
    addStockItem,
    recordTransaction,
    batches,
  };
}
