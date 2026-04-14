import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Loader2,
  Receipt, ShoppingCart, BarChart3, PieChartIcon, Eye, EyeOff,
  AlertTriangle, ArrowUpRight, ArrowDownRight, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  subDays, subMonths, isWithinInterval,
} from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ReferenceLine,
} from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type Expense = Database['public']['Tables']['expenses']['Row'];
type Revenue = Database['public']['Tables']['revenue']['Row'];
type Batch = Database['public']['Tables']['batches']['Row'];

const EXPENSE_CATEGORIES = ['feed', 'health', 'labor', 'utilities', 'equipment', 'transport', 'housing', 'chicks', 'other'];
const EXPENSE_LABELS: Record<string, string> = {
  feed: 'Feed', health: 'Health', labor: 'Labor', utilities: 'Utilities',
  equipment: 'Equipment', transport: 'Transport', housing: 'Housing', chicks: 'Chicks/DOCs', other: 'Other',
};
const CATEGORY_COLORS: Record<string, string> = {
  feed: '#16a34a', health: '#0ea5e9', labor: '#f59e0b', utilities: '#8b5cf6',
  equipment: '#ef4444', transport: '#ec4899', housing: '#14b8a6', chicks: '#f97316', other: '#6b7280',
};

const REVENUE_CATEGORIES = ['bird_sales', 'egg_sales', 'manure', 'other'];
const REVENUE_LABELS: Record<string, string> = {
  bird_sales: 'Bird Sales', egg_sales: 'Egg Sales', manure: 'Manure', other: 'Other',
};

type PeriodFilter = '7d' | '30d' | 'month' | 'all';

export default function Finance() {
  const { user } = useAuth();
  const { costPrivacyEnabled, toggleCostPrivacy } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('30d');

  // Expense modal
  const [showExpense, setShowExpense] = useState(false);
  const [expCategory, setExpCategory] = useState('feed');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expBatchId, setExpBatchId] = useState('none');
  const [expSubmitting, setExpSubmitting] = useState(false);

  // Revenue modal
  const [showRevenue, setShowRevenue] = useState(false);
  const [revCategory, setRevCategory] = useState('bird_sales');
  const [revDesc, setRevDesc] = useState('');
  const [revAmount, setRevAmount] = useState('');
  const [revBuyer, setRevBuyer] = useState('');
  const [revBatchId, setRevBatchId] = useState('none');
  const [revSubmitting, setRevSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);

      const [expResult, revResult, batchResult] = await Promise.all([
        supabase.from('expenses').select('*').eq('farm_id', farm.id).order('date', { ascending: false }).limit(500),
        supabase.from('revenue').select('*').eq('farm_id', farm.id).order('date', { ascending: false }).limit(500),
        supabase.from('batches').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false }),
      ]);

      setExpenses(expResult.data ?? []);
      setRevenues(revResult.data ?? []);
      setBatches(batchResult.data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  // ─── Period filtering ───
  const periodRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'all': return { start: new Date('2000-01-01'), end: now };
    }
  }, [period]);

  const filteredExpenses = useMemo(() =>
    expenses.filter(e => isWithinInterval(new Date(e.date), periodRange)),
    [expenses, periodRange]
  );

  const filteredRevenues = useMemo(() =>
    revenues.filter(r => isWithinInterval(new Date(r.date), periodRange)),
    [revenues, periodRange]
  );

  // ─── Derived metrics ───
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalRevenue = filteredRevenues.reduce((s, r) => s + Number(r.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // This week summary
  const now = new Date();
  const weekRange = { start: startOfWeek(now), end: endOfWeek(now) };
  const weekExpenses = expenses.filter(e => isWithinInterval(new Date(e.date), weekRange)).reduce((s, e) => s + Number(e.amount), 0);
  const weekRevenue = revenues.filter(r => isWithinInterval(new Date(r.date), weekRange)).reduce((s, r) => s + Number(r.amount), 0);

  // Expense category breakdown
  const categoryBreakdown = useMemo(() => {
    return EXPENSE_CATEGORIES.map(cat => ({
      name: EXPENSE_LABELS[cat] || cat,
      key: cat,
      value: filteredExpenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
      fill: CATEGORY_COLORS[cat] || '#6b7280',
    })).filter(c => c.value > 0);
  }, [filteredExpenses]);

  // Revenue category breakdown
  const revenueCategoryBreakdown = useMemo(() => {
    return REVENUE_CATEGORIES.map(cat => ({
      name: REVENUE_LABELS[cat] || cat,
      key: cat,
      value: filteredRevenues.filter(r => r.category === cat).reduce((s, r) => s + Number(r.amount), 0),
    })).filter(c => c.value > 0);
  }, [filteredRevenues]);

  // Daily trend chart (last 14 days or period)
  const trendData = useMemo(() => {
    const days = period === '7d' ? 7 : 14;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayExp = expenses.filter(e => e.date === dateStr).reduce((s, e) => s + Number(e.amount), 0);
      const dayRev = revenues.filter(r => r.date === dateStr).reduce((s, r) => s + Number(r.amount), 0);
      data.push({
        date: format(d, 'MMM d'),
        expenses: parseFloat(dayExp.toFixed(2)),
        revenue: parseFloat(dayRev.toFixed(2)),
        profit: parseFloat((dayRev - dayExp).toFixed(2)),
      });
    }
    return data;
  }, [expenses, revenues, period]);

  // Per-batch cost analysis
  const batchCosts = useMemo(() => {
    return batches.filter(b => b.status === 'active').map(b => {
      const batchExp = filteredExpenses.filter(e => e.batch_id === b.id).reduce((s, e) => s + Number(e.amount), 0);
      const batchRev = filteredRevenues.filter(r => r.batch_id === b.id).reduce((s, r) => s + Number(r.amount), 0);
      const costPerBird = b.current_population > 0 ? batchExp / b.current_population : 0;
      return {
        id: b.id,
        name: b.name,
        species: b.species,
        population: b.current_population,
        expenses: batchExp,
        revenue: batchRev,
        profit: batchRev - batchExp,
        costPerBird,
      };
    }).filter(b => b.expenses > 0 || b.revenue > 0);
  }, [batches, filteredExpenses, filteredRevenues]);

  // Auto-generated vs manual expense split
  const autoExpenseCount = filteredExpenses.filter(e => e.source !== 'manual').length;
  const manualExpenseCount = filteredExpenses.filter(e => e.source === 'manual').length;

  const mask = (v: number) => costPrivacyEnabled ? '****' : `GHS ${v.toFixed(2)}`;

  // ─── Add expense ───
  const addExpense = async () => {
    if (!farmId || !expDesc || !expAmount) return;
    const amount = parseFloat(expAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setExpSubmitting(true);

    const { data, error } = await supabase.from('expenses').insert({
      farm_id: farmId,
      category: expCategory,
      description: expDesc,
      amount,
      date: expDate,
      source: 'manual',
      batch_id: expBatchId !== 'none' ? expBatchId : null,
    }).select().single();

    if (error) { toast.error(error.message); setExpSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: expBatchId !== 'none' ? expBatchId : null,
      event_type: 'expense',
      description: `${EXPENSE_LABELS[expCategory] || expCategory}: ${expDesc} — GHS ${amount.toFixed(2)}`,
    });

    setExpenses(prev => [data, ...prev]);
    setShowExpense(false);
    setExpDesc('');
    setExpAmount('');
    setExpBatchId('none');
    setExpSubmitting(false);
    toast.success('Expense recorded');
  };

  // ─── Add revenue ───
  const addRevenue = async () => {
    if (!farmId || !revDesc || !revAmount) return;
    const amount = parseFloat(revAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setRevSubmitting(true);

    const { data, error } = await supabase.from('revenue').insert({
      farm_id: farmId,
      category: revCategory,
      description: revDesc,
      amount,
      buyer: revBuyer || null,
      batch_id: revBatchId !== 'none' ? revBatchId : null,
    }).select().single();

    if (error) { toast.error(error.message); setRevSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: revBatchId !== 'none' ? revBatchId : null,
      event_type: 'revenue',
      description: `${REVENUE_LABELS[revCategory] || revCategory}: ${revDesc} — GHS ${amount.toFixed(2)}`,
    });

    setRevenues(prev => [data, ...prev]);
    setShowRevenue(false);
    setRevDesc('');
    setRevAmount('');
    setRevBuyer('');
    setRevBatchId('none');
    setRevSubmitting(false);
    toast.success('Revenue recorded');
  };

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Finance</h1>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleCostPrivacy}>
            {costPrivacyEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5 rounded-full" onClick={() => setShowRevenue(true)}>
            <ArrowUpRight className="h-4 w-4" /> Income
          </Button>
          <Button className="gap-1.5 rounded-full" onClick={() => setShowExpense(true)}>
            <ArrowDownRight className="h-4 w-4" /> Expense
          </Button>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {([['7d', '7 Days'], ['30d', '30 Days'], ['month', 'This Month'], ['all', 'All Time']] as const).map(([key, label]) => (
            <Button
              key={key}
              variant={period === key ? 'default' : 'outline'}
              size="sm"
              className="h-7 rounded-full text-xs px-3"
              onClick={() => setPeriod(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* ═══ Financial Summary Dashboard ═══ */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4 px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-background p-2.5 text-center">
              <ArrowDownRight className="h-4 w-4 mx-auto text-destructive mb-1" />
              <p className="text-lg font-bold text-foreground">{mask(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">Expenses</p>
            </div>
            <div className="rounded-lg bg-background p-2.5 text-center">
              <ArrowUpRight className="h-4 w-4 mx-auto text-green-600 mb-1" />
              <p className="text-lg font-bold text-foreground">{mask(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
            <div className={`rounded-lg p-2.5 text-center ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <Wallet className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-destructive'}`}>
                {mask(Math.abs(netProfit))}
              </p>
              <p className="text-xs text-muted-foreground">
                {netProfit >= 0 ? 'Profit' : 'Loss'}
              </p>
            </div>
            <div className="rounded-lg bg-background p-2.5 text-center">
              <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className={`text-lg font-bold ${parseFloat(profitMargin) >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                {costPrivacyEnabled ? '****' : `${profitMargin}%`}
              </p>
              <p className="text-xs text-muted-foreground">Margin</p>
            </div>
          </div>

          {/* This week mini-summary */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
            <span>This week: {mask(weekExpenses)} spent, {mask(weekRevenue)} earned</span>
            <span>{autoExpenseCount} auto + {manualExpenseCount} manual entries</span>
          </div>
        </CardContent>
      </Card>

      {/* Loss warning */}
      {netProfit < 0 && filteredExpenses.length > 5 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Operating at a Loss</AlertTitle>
          <AlertDescription className="text-xs">
            Expenses exceed revenue by {mask(Math.abs(netProfit))} in this period.
            {categoryBreakdown.length > 0 && ` Largest expense category: ${categoryBreakdown[0]?.name} (${mask(categoryBreakdown[0]?.value ?? 0)}).`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview" className="gap-1 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1 text-xs">
            <ArrowDownRight className="h-3.5 w-3.5" /> Expenses
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1 text-xs">
            <ArrowUpRight className="h-3.5 w-3.5" /> Revenue
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-1 text-xs">
            <Receipt className="h-3.5 w-3.5" /> Batches
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Revenue vs Expenses trend */}
          {trendData.some(d => d.expenses > 0 || d.revenue > 0) && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" /> Daily Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        formatter={(value: number) => [`GHS ${value.toFixed(2)}`]}
                      />
                      <Bar dataKey="revenue" fill="#16a34a" name="Revenue" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[2, 2, 0, 0]} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profit/Loss trend line */}
          {trendData.some(d => d.profit !== 0) && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Profit/Loss Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        formatter={(value: number) => [`GHS ${value.toFixed(2)}`, 'Profit/Loss']}
                      />
                      <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expense breakdown pie chart */}
          {categoryBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-muted-foreground" /> Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-1/2 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          innerRadius={30}
                        >
                          {categoryBreakdown.map((c) => <Cell key={c.key} fill={c.fill} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => [costPrivacyEnabled ? '****' : `GHS ${value.toFixed(2)}`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 w-full sm:w-1/2">
                    {categoryBreakdown.map(c => {
                      const pct = totalExpenses > 0 ? ((c.value / totalExpenses) * 100).toFixed(0) : '0';
                      return (
                        <div key={c.key} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
                            <span className="truncate">{c.name}</span>
                          </div>
                          <span className="text-muted-foreground shrink-0">{mask(c.value)} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Expenses Tab ─── */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{filteredExpenses.length} entries • {mask(totalExpenses)} total</p>
            <Button variant="outline" size="sm" className="rounded-full gap-1 h-8 text-xs" onClick={() => setShowExpense(true)}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>

          <Card>
            <CardContent className="pt-4">
              {filteredExpenses.length === 0 ? (
                <div className="py-8 text-center">
                  <ArrowDownRight className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No expenses in this period.</p>
                  <Button variant="outline" className="rounded-full gap-1" onClick={() => setShowExpense(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Expense
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredExpenses.slice(0, 30).map(e => {
                    const batchName = batches.find(b => b.id === e.batch_id)?.name;
                    return (
                      <div key={e.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[e.category] || '#6b7280' }} />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{e.description}</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="capitalize">{EXPENSE_LABELS[e.category] || e.category}</span>
                              {batchName && <><span>•</span><span className="truncate max-w-[80px]">{batchName}</span></>}
                              <span>•</span>
                              <span>{e.source === 'manual' ? 'Manual' : 'Auto'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-medium text-destructive">{mask(Number(e.amount))}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM d')}</p>
                        </div>
                      </div>
                    );
                  })}
                  {filteredExpenses.length > 30 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing 30 of {filteredExpenses.length} entries
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Revenue Tab ─── */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{filteredRevenues.length} entries • {mask(totalRevenue)} total</p>
            <Button variant="outline" size="sm" className="rounded-full gap-1 h-8 text-xs" onClick={() => setShowRevenue(true)}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>

          {/* Revenue by category */}
          {revenueCategoryBreakdown.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {revenueCategoryBreakdown.map(c => (
                <Card key={c.key}>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                    <p className="text-base font-bold text-foreground">{mask(c.value)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="pt-4">
              {filteredRevenues.length === 0 ? (
                <div className="py-8 text-center">
                  <ArrowUpRight className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No revenue in this period.</p>
                  <Button variant="outline" className="rounded-full gap-1" onClick={() => setShowRevenue(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Revenue
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredRevenues.slice(0, 30).map(r => {
                    const batchName = batches.find(b => b.id === r.batch_id)?.name;
                    return (
                      <div key={r.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.description}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{REVENUE_LABELS[r.category] || r.category}</span>
                            {r.buyer && <><span>•</span><span className="truncate max-w-[80px]">{r.buyer}</span></>}
                            {batchName && <><span>•</span><span className="truncate max-w-[80px]">{batchName}</span></>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-medium text-green-700">{mask(Number(r.amount))}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(r.date), 'MMM d')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Batch Cost Analysis Tab ─── */}
        <TabsContent value="batches" className="space-y-4 mt-4">
          {batchCosts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No batch-specific financial data yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Link expenses and revenue to batches when recording them.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {batchCosts.map(bc => (
                <Card key={bc.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{bc.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{bc.species} • {bc.population} birds</p>
                      </div>
                      <Badge variant={bc.profit >= 0 ? 'default' : 'destructive'} className="text-xs">
                        {bc.profit >= 0 ? 'Profit' : 'Loss'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                        <p className="text-sm font-medium text-destructive">{mask(bc.expenses)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="text-sm font-medium text-green-700">{mask(bc.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net</p>
                        <p className={`text-sm font-medium ${bc.profit >= 0 ? 'text-green-700' : 'text-destructive'}`}>
                          {mask(Math.abs(bc.profit))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cost/Bird</p>
                        <p className="text-sm font-medium text-foreground">{mask(bc.costPerBird)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Add Expense Dialog ═══ */}
      <Dialog open={showExpense} onOpenChange={setShowExpense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a farm expense. Link to a batch for per-batch cost tracking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={expCategory} onValueChange={setExpCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{EXPENSE_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="What was this for?" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Amount (GHS)</Label>
                <Input type="number" min="0" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} />
              </div>
            </div>
            {batches.length > 0 && (
              <div className="space-y-1">
                <Label>Batch (optional)</Label>
                <Select value={expBatchId} onValueChange={setExpBatchId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No batch</SelectItem>
                    {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.species})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpense(false)}>Cancel</Button>
            <Button onClick={addExpense} disabled={expSubmitting || !expDesc || !expAmount}>
              {expSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Add Revenue Dialog ═══ */}
      <Dialog open={showRevenue} onOpenChange={setShowRevenue}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Revenue</DialogTitle>
            <DialogDescription>Record income from sales or other sources.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={revCategory} onValueChange={setRevCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REVENUE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{REVENUE_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={revDesc} onChange={e => setRevDesc(e.target.value)} placeholder="What was sold?" />
            </div>
            <div className="space-y-1">
              <Label>Amount (GHS)</Label>
              <Input type="number" min="0" step="0.01" value={revAmount} onChange={e => setRevAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Buyer (optional)</Label>
                <Input value={revBuyer} onChange={e => setRevBuyer(e.target.value)} placeholder="Name" />
              </div>
              {batches.length > 0 && (
                <div className="space-y-1">
                  <Label>Batch (optional)</Label>
                  <Select value={revBatchId} onValueChange={setRevBatchId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No batch</SelectItem>
                      {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevenue(false)}>Cancel</Button>
            <Button onClick={addRevenue} disabled={revSubmitting || !revDesc || !revAmount}>
              {revSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Revenue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
