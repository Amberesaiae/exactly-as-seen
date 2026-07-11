import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
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
      const farm = farms && farms.length > 0 ? [...farms].sort((a, b) => {
        if (a.setup_complete !== b.setup_complete) return a.setup_complete ? -1 : 1;
        return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      })[0] : null;
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

    // If purchase, create a stock lot with Quality and Expiry (Spec Essential)
    if (type === 'purchase') {
      const { error: lotError } = await supabase.from('stock_lots').insert({
        farm_id: farmId,
        stock_item_id: itemId,
        qty_on_hand: qty,
        unit_price_pesewas: price ? Math.round(price * 100) : 0,
        quality_grade: qualityGrade || 'A',
        expiry_date: expiryDate || null,
        received_at: new Date().toISOString()
      });
      if (lotError) {
        toast.error('Failed to create stock lot: ' + lotError.message);
        setSubmitting(false);
        return;
      }
    }

    // If usage, perform FIFO allocation via RPC with Batch attribution
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

    const { error: itemError } = await supabase.from('stock_items').update({
      current_quantity: newQty,
      updated_at: new Date().toISOString(),
    }).eq('id', itemId);

    if (itemError) { toast.error(itemError.message); setSubmitting(false); return; }

    if (type === 'purchase' && price) {
      let expenseCategory = 'other_expenses';
      const cat = item.category.toLowerCase();
      if (cat.includes('feed') || cat.includes('ingredient') || cat.includes('supplement')) {
        expenseCategory = 'feed_and_nutrition';
      } else if (cat.includes('medication') || cat.includes('vaccine') || cat.includes('medicine')) {
        expenseCategory = 'health_and_medicine';
      } else if (cat.includes('equipment') || cat.includes('tool')) {
        expenseCategory = 'equipment_and_tools';
      }

      const totalPesewas = Math.round(qty * price * 100);
      await supabase.from('expenses').upsert({
        farm_id: farmId,
        batch_id: batchId || null,
        category: expenseCategory,
        description: `Purchase: ${qty} ${item.unit} of ${item.name}`,
        amount_pesewas: totalPesewas,
        date: new Date().toISOString(),
        source: 'auto:stock',
        source_ref: tx.id
      }, { onConflict: 'source,source_ref', ignoreDuplicates: true });
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'stock_transaction',
      description: `${type.toUpperCase()}: ${qty} ${item.unit} of ${item.name}`,
    });

    setStockItems(prev => prev.map(i => i.id === itemId ? { ...i, current_quantity: newQty } : i));
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
