import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { selectPrimaryFarm, toPesewas, fromPesewas } from '@/lib/canonical';
import { isOffline, queueWrite } from '@/lib/sync';
import type { Database } from '@/integrations/supabase/types';

type Expense = Database['public']['Tables']['expenses']['Row'];
type Revenue = Database['public']['Tables']['revenue']['Row'];
type Batch = Database['public']['Tables']['batches']['Row'];

export type Period = 'month' | 'quarter' | 'year' | 'all';

export function useFinanceData() {
  const { user } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farms } = await supabase.from('farms').select('id, setup_complete, updated_at').eq('user_id', user.id);
      const farm = selectPrimaryFarm(farms);
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);

      const { data: b } = await supabase.from('batches').select('*').eq('farm_id', farm.id);
      setBatches(b ?? []);

      const { data: exp } = await supabase.from('expenses').select('*').eq('farm_id', farm.id).order('date', { ascending: false });
      setExpenses(exp ?? []);

      const { data: rev } = await supabase.from('revenue').select('*').eq('farm_id', farm.id).order('date', { ascending: false });
      setRevenue(rev ?? []);

      setLoading(false);
    };
    load();
  }, [user]);

  // Parse DATE columns as local calendar days (avoid UTC-midnight shifting out of period)
  const dateKey = (d: string) => d.slice(0, 10);
  const periodStartKey = useMemo(() => {
    if (period === 'all') return null;
    const now = new Date();
    let start: Date;
    if (period === 'month') start = startOfMonth(now);
    else if (period === 'quarter') start = startOfQuarter(now);
    else start = startOfYear(now);
    return format(start, 'yyyy-MM-dd');
  }, [period]);

  const filteredExpenses = useMemo(() => {
    if (!periodStartKey) return expenses;
    return expenses.filter(e => dateKey(e.date) >= periodStartKey);
  }, [expenses, periodStartKey]);

  const filteredRevenue = useMemo(() => {
    if (!periodStartKey) return revenue;
    return revenue.filter(r => dateKey(r.date) >= periodStartKey);
  }, [revenue, periodStartKey]);

  const stats = useMemo(() => {
    const totalExp = filteredExpenses.reduce((s, e) => s + Number(e.amount_pesewas ?? 0) / 100, 0);
    const totalRev = filteredRevenue.reduce((s, r) => s + Number(r.amount_pesewas ?? 0) / 100, 0);
    const net = totalRev - totalExp;
    const margin = totalRev > 0 ? (net / totalRev) * 100 : 0;
    return { totalExp, totalRev, net, margin };
  }, [filteredExpenses, filteredRevenue]);

  const expenseCategoryTotals = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + Number(e.amount_pesewas ?? 0) / 100;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const revenueCategoryTotals = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredRevenue.forEach(r => {
      categories[r.category] = (categories[r.category] || 0) + Number(r.amount_pesewas ?? 0) / 100;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRevenue]);

  const chartData = useMemo(() => {
    const days: Record<string, { date: string, exp: number, rev: number }> = {};
    const lookback = period === 'month' ? 30 : period === 'quarter' ? 90 : period === 'year' ? 365 : 30;
    
    for (let i = lookback; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM d');
      days[d] = { date: d, exp: 0, rev: 0 };
    }

    filteredExpenses.forEach(e => {
      const d = format(new Date(e.date), 'MMM d');
      if (days[d]) days[d].exp += Number(e.amount_pesewas ?? 0) / 100;
    });
    filteredRevenue.forEach(r => {
      const d = format(new Date(r.date), 'MMM d');
      if (days[d]) days[d].rev += Number(r.amount_pesewas ?? 0) / 100;
    });

    return Object.values(days);
  }, [filteredExpenses, filteredRevenue, period]);

  const batchAnalysis = useMemo(() => {
    return batches.map(b => {
      const bExp = expenses.filter(e => e.batch_id === b.id).reduce((s, e) => s + Number(e.amount_pesewas ?? 0) / 100, 0);
      const bRev = revenue.filter(r => r.batch_id === b.id).reduce((s, r) => s + Number(r.amount_pesewas ?? 0) / 100, 0);
      const profit = bRev - bExp;
      const birdCost = b.initial_quantity > 0 ? bExp / b.initial_quantity : 0;
      return {
        id: b.id,
        name: b.name,
        species: b.species,
        status: b.status,
        expenses: bExp,
        revenue: bRev,
        profit,
        birdCost,
      };
    }).sort((a, b) => (a.status === 'active' ? -1 : 1));
  }, [batches, expenses, revenue]);

  const addExpense = async (data: Partial<Expense> & { amount?: number }) => {
    if (!farmId) return;
    setSubmitting(true);
    const major = Number(data.amount ?? fromPesewas(data.amount_pesewas));
    const insertData = {
      amount_pesewas: toPesewas(major),
      category: data.category,
      description: data.description,
      batch_id: data.batch_id,
      date: data.date,
      farm_id: farmId,
      payment_method: data.payment_method ?? 'cash',
      payment_status: data.payment_status ?? 'paid',
      source: 'manual',
      source_ref: null,
    };

    if (isOffline()) {
      const tempId = crypto.randomUUID();
      await queueWrite('expenses', 'insert', tempId, insertData as unknown as Record<string, unknown>);
      const entry = { ...insertData, id: tempId, created_at: new Date().toISOString() } as unknown as Expense;
      setExpenses(prev => [entry, ...prev]);
      setSubmitting(false);
      toast.success('Expense recorded (offline — will sync)');
      return;
    }

    const { data: entry, error } = await supabase.from('expenses').insert(
      insertData as Database['public']['Tables']['expenses']['Insert']
    ).select().single();

    if (error) { toast.error(error.message); setSubmitting(false); return; }

    const { error: actErr } = await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: data.batch_id || null,
      event_type: 'expense',
      description: `Added expense: ${data.category} — ${major.toFixed(2)} (${data.description})`,
    });
    if (actErr) console.debug('Activity log failed:', actErr);

    setExpenses(prev => [entry, ...prev]);
    setSubmitting(false);
    toast.success('Expense recorded');
  };

  const addRevenue = async (data: Partial<Revenue> & { amount?: number }) => {
    if (!farmId) return;
    setSubmitting(true);
    const major = Number(data.amount ?? fromPesewas(data.amount_pesewas));
    const insertData = {
      amount_pesewas: toPesewas(major),
      category: data.category,
      description: data.description,
      batch_id: data.batch_id,
      buyer: data.buyer,
      date: data.date,
      farm_id: farmId,
      payment_method: data.payment_method ?? 'cash',
      payment_status: data.payment_status ?? 'paid',
      source: 'manual',
      source_ref: null,
    };

    if (isOffline()) {
      const tempId = crypto.randomUUID();
      await queueWrite('revenue', 'insert', tempId, insertData as unknown as Record<string, unknown>);
      const entry = { ...insertData, id: tempId, created_at: new Date().toISOString() } as unknown as Revenue;
      setRevenue(prev => [entry, ...prev]);
      setSubmitting(false);
      toast.success('Revenue recorded (offline — will sync)');
      return;
    }

    const { data: entry, error } = await supabase.from('revenue').insert(
      insertData as Database['public']['Tables']['revenue']['Insert']
    ).select().single();

    if (error) { toast.error(error.message); setSubmitting(false); return; }

    const { error: actErr2 } = await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: data.batch_id || null,
      event_type: 'revenue',
      description: `Added revenue: ${data.category} — ${major.toFixed(2)} (${data.description})`,
    });
    if (actErr2) console.debug('Activity log failed:', actErr2);

    setRevenue(prev => [entry, ...prev]);
    setSubmitting(false);
    toast.success('Revenue recorded');
  };

  return {
    loading,
    period,
    setPeriod,
    stats,
    expenseCategoryTotals,
    revenueCategoryTotals,
    chartData,
    batchAnalysis,
    expenses: filteredExpenses,
    revenue: filteredRevenue,
    batches,
    submitting,
    costPrivacyEnabled,
    addExpense,
    addRevenue,
  };
}
