import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { getExpectedRate } from '@/lib/health-data';
import { getBatchAge } from '@/lib/batch-utils';
import type { Database } from '@/integrations/supabase/types';
import { autoCreateRevenue } from '@/lib/synergy';
import {
  selectPrimaryFarm,
  normalizePaymentMethod,
  toPesewas,
  LEDGER_SOURCES,
  LAYER_EGG_START_WEEK,
  DUCK_EGG_START_WEEK,
} from '@/lib/canonical';

type Batch = Database['public']['Tables']['batches']['Row'];
type EggRecord = Database['public']['Tables']['egg_collections']['Row'];
type EggSale = Database['public']['Tables']['egg_sales']['Row'];

const SIZE_LABELS: Record<string, string> = {
  small: 'Small (< 53g)',
  medium: 'Medium (53–63g)',
  large: 'Large (> 63g)',
};

export function useEggData() {
  const { user } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [records, setRecords] = useState<EggRecord[]>([]);
  const [sales, setSales] = useState<EggSale[]>([]);
  const [eggSubmitting, setEggSubmitting] = useState(false);
  const [saleSubmitting, setSaleSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farms } = await supabase.from('farms').select('id, setup_complete, updated_at').eq('user_id', user.id);
      const farm = selectPrimaryFarm(farms);
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);
      const { data: b } = await supabase.from('batches').select('*').eq('farm_id', farm.id).eq('status', 'active').in('species', ['layer', 'duck', 'turkey']);
      setBatches(b ?? []);
      if (b?.length) setSelectedBatch(b[0].id);

      const { data: s } = await supabase.from('egg_sales').select('*').eq('farm_id', farm.id).order('date', { ascending: false }).limit(30);
      setSales(s ?? []);

      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!selectedBatch) { setRecords([]); return; }
    supabase.from('egg_collections').select('*').eq('batch_id', selectedBatch).order('date', { ascending: false }).limit(30)
      .then(({ data }) => setRecords(data ?? []));
  }, [selectedBatch]);

  const batch = useMemo(() => batches.find(b => b.id === selectedBatch), [batches, selectedBatch]);
  const batchAge = useMemo(() => batch ? getBatchAge(batch.start_date, batch.species) : null, [batch]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = useMemo(() => records.find(r => r.date === todayStr), [records, todayStr]);

  const productionRate = useMemo(() => 
    batch && batch.current_population > 0 && todayRecord
      ? ((todayRecord.total_eggs / batch.current_population) * 100).toFixed(1)
      : null
  , [batch, todayRecord]);

  const expectedRate = useMemo(() => batch ? getExpectedRate(batch.species, batch.current_week) : null, [batch]);

  const avg7Day = useMemo(() => {
    if (!batch || batch.current_population <= 0) return null;
    const last7 = records.filter(r => {
      const d = new Date(r.date);
      return d >= subDays(new Date(), 7);
    });
    if (last7.length === 0) return null;
    const avgEggs = last7.reduce((sum, r) => sum + r.total_eggs, 0) / last7.length;
    return ((avgEggs / batch.current_population) * 100).toFixed(1);
  }, [records, batch]);

  const weekTotal = useMemo(() => {
    return records.filter(r => {
      const d = new Date(r.date);
      return d >= subDays(new Date(), 7);
    }).reduce((sum, r) => sum + r.total_eggs, 0);
  }, [records]);

  const sizeDistribution = useMemo(() => {
    const last7 = records.filter(r => new Date(r.date) >= subDays(new Date(), 7));
    const counts: Record<string, number> = { small: 0, medium: 0, large: 0 };
    last7.forEach(r => { counts[r.size_category] = (counts[r.size_category] || 0) + r.total_eggs; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([size, count]) => ({
      size: SIZE_LABELS[size] || size,
      count,
      pct: total > 0 ? ((count / total) * 100).toFixed(0) : '0',
    }));
  }, [records]);

  const qualityBreakdown = useMemo(() => {
    const last7 = records.filter(r => new Date(r.date) >= subDays(new Date(), 7));
    const totalEggs = last7.reduce((s, r) => s + r.total_eggs, 0);
    const totalGood = last7.reduce((s, r) => s + r.good, 0);
    const totalBroken = last7.reduce((s, r) => s + r.broken, 0);
    const totalDirty = last7.reduce((s, r) => s + r.dirty, 0);
    return { totalEggs, totalGood, totalBroken, totalDirty };
  }, [records]);

  const rateDeviation = useMemo(() => {
    if (!productionRate || !expectedRate) return null;
    const actual = parseFloat(productionRate);
    if (actual < expectedRate.min) {
      return { type: 'below' as const, diff: (expectedRate.min - actual).toFixed(1) };
    }
    if (actual > expectedRate.max) {
      return { type: 'above' as const, diff: (actual - expectedRate.max).toFixed(1) };
    }
    return null;
  }, [productionRate, expectedRate]);

  const chartData = useMemo(() => {
    if (!records.length || !batch) return [];
    return [...records].reverse().map(r => {
      const rate = batch.current_population > 0 ? ((r.total_eggs / batch.current_population) * 100) : 0;
      const exp = getExpectedRate(batch.species, batch.current_week);
      return {
        date: format(new Date(r.date), 'MMM d'),
        eggs: r.total_eggs,
        good: r.good,
        broken: r.broken + r.dirty,
        rate: parseFloat(rate.toFixed(1)),
        expectedMin: exp?.min ?? null,
        expectedMax: exp?.max ?? null,
      };
    });
  }, [records, batch]);

  const salesSummary = useMemo(() => {
    const last30 = sales.filter(s => new Date(s.date) >= subDays(new Date(), 30));
    const totalQty = last30.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = last30.reduce((sum, s) => sum + Number(s.total_amount), 0);
    return { totalQty, totalRevenue, count: last30.length };
  }, [sales]);

  const recordCollection = async (total: number, broken: number, dirty: number, sizeCategory: string, notes: string) => {
    if (!farmId || !selectedBatch) return;
    if (total <= 0) { toast.error('Enter a valid egg count'); return; }
    setEggSubmitting(true);

    if (!batch) {
      toast.error('Selected batch not found');
      setEggSubmitting(false);
      return;
    }

    // Product gate: layer ≥ LAYER_EGG_START_WEEK, duck-layer ≥ DUCK_EGG_START_WEEK
    const week = batch.current_week;
    if (batch.species === 'layer' && week < LAYER_EGG_START_WEEK) {
      toast.error(`Egg collection is not permitted for layers before week ${LAYER_EGG_START_WEEK} (Current week: ${week})`);
      setEggSubmitting(false);
      return;
    }
    if (batch.species === 'duck' && batch.duck_type === 'layer' && week < DUCK_EGG_START_WEEK) {
      toast.error(`Egg collection is not permitted for duck layers before week ${DUCK_EGG_START_WEEK} (Current week: ${week})`);
      setEggSubmitting(false);
      return;
    }

    // Duplicate check for batch + date
    const { data: existing, error: existError } = await supabase
      .from('egg_collections')
      .select('id')
      .eq('batch_id', selectedBatch)
      .eq('date', todayStr)
      .maybeSingle();

    if (existing) {
      toast.error('An egg collection has already been recorded for this batch today.');
      setEggSubmitting(false);
      return;
    }

    const good = Math.max(0, total - broken - dirty);

    const { data, error } = await supabase.from('egg_collections').insert({
      batch_id: selectedBatch,
      farm_id: farmId,
      total_eggs: total,
      broken,
      dirty,
      good,
      size_category: sizeCategory,
      notes: notes || null,
    }).select().single();

    if (error) { toast.error(error.message); setEggSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: selectedBatch,
      event_type: 'egg_collection',
      description: `Collected ${total} eggs (${good} good, ${broken} broken, ${dirty} dirty) — ${SIZE_LABELS[sizeCategory] || sizeCategory}`,
    });

    setRecords(prev => [data, ...prev.slice(0, 29)]);
    setEggSubmitting(false);
    toast.success(`Recorded ${total} eggs (${good} good)`);
  };

  const recordSale = async (params: {
    crates: number,
    looses: number,
    pricePerCrate: number,
    pricePerLoose: number,
    sizeCategory: string,
    buyer: string,
    paymentMethod: string,
    paymentStatus: string,
    notes: string
  }) => {
    const { crates, looses, pricePerCrate, pricePerLoose, sizeCategory, buyer, paymentMethod, paymentStatus, notes } = params;
    if (!farmId) return;
    if (!selectedBatch) { toast.error('Please select a batch first'); return; }
    
    const totalEggs = (crates * 30) + looses;
    if (totalEggs <= 0) { toast.error('Enter a valid quantity'); return; }
    
    setSaleSubmitting(true);

    // 1. Withdrawal period check
    const { canSellEggs } = await import('@/lib/safety-gates');
    if (!canSellEggs(batch)) {
      toast.error('Cannot record egg sale during active medication withdrawal period');
      setSaleSubmitting(false);
      return;
    }

    // 2. Egg inventory verification (graded when available, else total good eggs)
    let onHand = 0;
    const graded = await (supabase as any).rpc('get_graded_egg_inventory', {
      p_batch_id: selectedBatch,
      p_farm_id: farmId,
      p_size: sizeCategory
    });
    if (!graded.error && graded.data != null) {
      onHand = Number(graded.data) || 0;
    } else {
      const fallback = await (supabase as any).rpc('get_egg_inventory', {
        p_batch_id: selectedBatch,
        p_farm_id: farmId,
      });
      onHand = Number(fallback.data) || 0;
    }

    if (onHand < totalEggs) {
      toast.error(`Insufficient ${sizeCategory} eggs. On hand: ${onHand}, requested: ${totalEggs}`);
      setSaleSubmitting(false);
      return;
    }

    const totalAmount = (crates * pricePerCrate) + (looses * pricePerLoose);
    const totalPesewas = toPesewas(totalAmount);
    const normalizedPayment = normalizePaymentMethod(paymentMethod);

    const { data: sale, error } = await supabase.from('egg_sales').insert({
      farm_id: farmId,
      batch_id: selectedBatch,
      quantity: totalEggs,
      crates_sold: crates,
      looses_sold: looses,
      size_category: sizeCategory,
      price_per_crate_pesewas: toPesewas(pricePerCrate),
      price_per_loose_pesewas: toPesewas(pricePerLoose),
      total_revenue_pesewas: totalPesewas,
      buyer: buyer || null,
      payment_method: normalizedPayment,
      notes: notes || null,
    } as any).select().single();

    if (error) { toast.error(error.message); setSaleSubmitting(false); return; }

    // 3. Synergy: Financial Ledger Entry with Metadata
    await autoCreateRevenue({
      farmId,
      batchId: selectedBatch,
      category: 'egg_sales',
      description: `Egg sale: ${crates} crates & ${looses} looses (${sizeCategory})`,
      amount: totalAmount,
      buyer: buyer || undefined,
      paymentMethod: normalizedPayment,
      paymentStatus: (paymentStatus as 'paid' | 'pending' | 'partial') || 'paid',
      source: LEDGER_SOURCES.eggs,
      sourceRef: sale.id,
    });

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: selectedBatch,
      event_type: 'egg_sale',
      description: `Sold ${totalEggs} eggs (${crates} crt, ${looses} loose) for GHS ${totalAmount.toFixed(2)}${buyer ? ` to ${buyer}` : ''}`,
    });

    setSales(prev => [sale as any, ...prev.slice(0, 29)]);
    setSaleSubmitting(false);
    toast.success(`Sale recorded: GHS ${totalAmount.toFixed(2)}`);
  };

  return {
    loading,
    batches,
    selectedBatch,
    setSelectedBatch,
    records,
    sales,
    batch,
    batchAge,
    productionRate,
    expectedRate,
    avg7Day,
    weekTotal,
    sizeDistribution,
    qualityBreakdown,
    rateDeviation,
    chartData,
    salesSummary,
    eggSubmitting,
    saleSubmitting,
    costPrivacyEnabled,
    recordCollection,
    recordSale,
    todayStr,
  };
}
