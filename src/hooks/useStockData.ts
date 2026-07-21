import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import {
  DEFAULT_STOCK_QUALITY,
  expenseCategoryForStockItem,
  ledgerDate,
  selectPrimaryFarm,
} from '@/lib/canonical';
import { isOffline, queueWrite } from '@/lib/sync';
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
    const totalValue = stockItems.reduce((s, item) => s + (item.current_quantity * Number(item.unit_price_pesewas || 0) / 100), 0);
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
    const insertData = {
      name: data.name,
      category: data.category,
      unit: data.unit,
      current_quantity: data.current_quantity,
      reorder_threshold: data.reorder_threshold,
      unit_price_pesewas: data.unit_price ? Math.round(Number(data.unit_price) * 100) : 0,
      farm_id: farmId,
    };

    if (isOffline()) {
      const tempId = crypto.randomUUID();
      await queueWrite('stock_items', 'insert', tempId, insertData as unknown as Record<string, unknown>);
      const item = { ...insertData, id: tempId, created_at: new Date().toISOString() } as unknown as StockItem;
      setStockItems(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
      setSubmitting(false);
      toast.success('Stock item added (offline — will sync)');
      return;
    }

    const { data: item, error } = await supabase.from('stock_items').insert(insertData).select().single();

    if (error) { toast.error(error.message); setSubmitting(false); return; }

    const { error: actErr } = await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'stock_update',
      description: `Added new stock item: ${data.name} (${data.category})`,
    });
    if (actErr) console.debug('Activity log failed:', actErr);

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

    // W4 / K3: purchase is RPC-only — never client multi-write fallthrough
    if (type === 'purchase') {
      const unitPricePesewas = price != null && price > 0 ? Math.round(price * 100) : 0;
      const purchaseArgs = {
        p_farm_id: farmId,
        p_stock_item_id: itemId,
        p_qty: qty,
        p_unit_price_pesewas: unitPricePesewas,
        p_notes: notes || undefined,
        p_quality_grade: (qualityGrade as typeof DEFAULT_STOCK_QUALITY) || DEFAULT_STOCK_QUALITY,
        p_expiry_date: expiryDate || undefined,
        p_batch_id: batchId || undefined,
        p_expense_category: expenseCategoryForStockItem(item.category),
      };

      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          const { queueRpc } = await import('@/lib/sync');
          await queueRpc('stock_purchase', purchaseArgs, `stock-purchase:${itemId}:${Date.now()}`);
          setStockItems(prev => prev.map(i => i.id === itemId ? {
            ...i,
            current_quantity: newQty,
            ...(unitPricePesewas > 0 ? { unit_price_pesewas: unitPricePesewas } : {}),
          } : i));
          toast.warning('Offline — stock purchase queued; will sync when online');
          return;
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc('stock_purchase', purchaseArgs);

        if (rpcError) {
          toast.error(rpcError.message || 'Stock purchase failed');
          return;
        }
        if (!rpcData?.ok) {
          toast.error(
            (rpcData as { error?: string } | null)?.error || 'Stock purchase failed'
          );
          return;
        }

        const computedNew = Number(rpcData.new_quantity);
        setStockItems(prev => prev.map(i => i.id === itemId ? {
          ...i,
          current_quantity: computedNew,
          ...(unitPricePesewas > 0 ? { unit_price_pesewas: unitPricePesewas } : {}),
        } : i));
        const txStub = {
          id: rpcData.transaction_id,
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
        toast.success(`Recorded purchase: ${qty} ${item.unit}`);
        return;
      } finally {
        setSubmitting(false);
      }
    }

    // K9: usage via atomic stock_usage RPC only
    if (type === 'usage') {
      const usageArgs = {
        p_farm_id: farmId,
        p_stock_item_id: itemId,
        p_qty: qty,
        p_batch_id: batchId || undefined,
        p_notes: notes || undefined,
      };
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          const { queueRpc } = await import('@/lib/sync');
          await queueRpc('stock_usage', usageArgs, `stock-usage:${itemId}:${Date.now()}`);
          setStockItems(prev => prev.map(i => i.id === itemId ? { ...i, current_quantity: newQty } : i));
          toast.warning('Offline — stock usage queued; will sync when online');
          return;
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc('stock_usage', usageArgs);
        if (rpcError) {
          toast.error(rpcError.message || 'Stock usage failed');
          return;
        }
        if (!rpcData?.ok) {
          toast.error('Stock usage failed');
          return;
        }

        const computedNew = Number(rpcData.new_quantity);
        setStockItems(prev => prev.map(i => i.id === itemId ? { ...i, current_quantity: computedNew } : i));
        const txStub = {
          id: rpcData.transaction_id,
          farm_id: farmId,
          stock_item_id: itemId,
          transaction_type: 'usage',
          quantity: qty,
          notes: notes || null,
          date: ledgerDate(),
        } as StockTransaction;
        setTransactions(prev => [txStub, ...prev.slice(0, 49)]);
        toast.success(`Recorded usage: ${qty} ${item.unit}`);
        return;
      } finally {
        setSubmitting(false);
      }
    }

    // adjustment via atomic stock_adjust RPC (RPC-only ledger writes)
    try {
      const adjustArgs = {
        p_farm_id: farmId,
        p_stock_item_id: itemId,
        p_new_quantity: newQty,
        p_notes: notes || undefined,
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const { queueRpc } = await import('@/lib/sync');
        await queueRpc('stock_adjust', adjustArgs, `stock-adjust:${itemId}:${Date.now()}`);
        setStockItems(prev => prev.map(i => i.id === itemId ? { ...i, current_quantity: newQty } : i));
        toast.warning('Offline — adjustment queued; will sync when online');
        return;
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('stock_adjust', adjustArgs);
      if (rpcError) { toast.error(rpcError.message); return; }
      if (!rpcData?.ok) { toast.error('Adjustment failed'); return; }

      const { error: actErr2 } = await supabase.from('activity_log').insert({
        farm_id: farmId,
        event_type: 'stock_transaction',
        description: `ADJUSTMENT: ${qty} ${item.unit} of ${item.name}`,
      });
      if (actErr2) console.debug('Activity log failed:', actErr2);

      setStockItems(prev => prev.map(i => i.id === itemId ? {
        ...i,
        current_quantity: newQty,
      } : i));
      const txStub = {
        id: rpcData.transaction_id,
        farm_id: farmId,
        stock_item_id: itemId,
        transaction_type: 'adjustment',
        quantity: Number(rpcData.delta ?? qty),
        notes: notes || null,
        date: ledgerDate(),
      } as StockTransaction;
      setTransactions(prev => [txStub, ...prev.slice(0, 49)]);
      toast.success(`Recorded ${type}: ${qty} ${item.unit}`);
    } finally {
      setSubmitting(false);
    }
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
