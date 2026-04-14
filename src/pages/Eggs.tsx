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
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Egg, Plus, TrendingUp, TrendingDown, ShoppingCart, Loader2,
  BarChart3, AlertTriangle, Check, CalendarDays, Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Legend, Area, AreaChart,
} from 'recharts';
import { getExpectedRate } from '@/lib/health-data';
import { getBatchAge } from '@/lib/batch-utils';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type EggRecord = Database['public']['Tables']['egg_records']['Row'];
type EggSale = Database['public']['Tables']['egg_sales']['Row'];

const SIZE_LABELS: Record<string, string> = {
  small: 'Small (< 53g)',
  medium: 'Medium (53–63g)',
  large: 'Large (> 63g)',
};

export default function Eggs() {
  const { user } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [records, setRecords] = useState<EggRecord[]>([]);
  const [sales, setSales] = useState<EggSale[]>([]);

  // Collection form
  const [showCollect, setShowCollect] = useState(false);
  const [totalEggs, setTotalEggs] = useState('');
  const [broken, setBroken] = useState('0');
  const [dirty, setDirty] = useState('0');
  const [sizeCategory, setSizeCategory] = useState('medium');
  const [eggNotes, setEggNotes] = useState('');
  const [eggSubmitting, setEggSubmitting] = useState(false);

  // Sales form
  const [showSale, setShowSale] = useState(false);
  const [saleQty, setSaleQty] = useState('30');
  const [salePrice, setSalePrice] = useState('');
  const [saleBuyer, setSaleBuyer] = useState('');
  const [saleSizeCategory, setSaleSizeCategory] = useState('medium');
  const [saleNotes, setSaleNotes] = useState('');
  const [saleSubmitting, setSaleSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);
      const { data: b } = await supabase.from('batches').select('*').eq('farm_id', farm.id).eq('status', 'active').in('species', ['layer', 'duck', 'turkey']);
      setBatches(b ?? []);
      if (b?.length) setSelectedBatch(b[0].id);

      // Load sales
      const { data: s } = await supabase.from('egg_sales').select('*').eq('farm_id', farm.id).order('date', { ascending: false }).limit(30);
      setSales(s ?? []);

      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!selectedBatch) { setRecords([]); return; }
    supabase.from('egg_records').select('*').eq('batch_id', selectedBatch).order('date', { ascending: false }).limit(30)
      .then(({ data }) => setRecords(data ?? []));
  }, [selectedBatch]);

  const batch = batches.find(b => b.id === selectedBatch);
  const batchAge = batch ? getBatchAge(batch.start_date, batch.species) : null;

  // ─── Derived metrics ───
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = records.find(r => r.date === todayStr);

  const productionRate = batch && batch.current_population > 0 && todayRecord
    ? ((todayRecord.total_eggs / batch.current_population) * 100).toFixed(1)
    : null;

  const expectedRate = batch ? getExpectedRate(batch.species, batch.current_week) : null;

  // 7-day average production rate
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

  // Total eggs this week
  const weekTotal = useMemo(() => {
    return records.filter(r => {
      const d = new Date(r.date);
      return d >= subDays(new Date(), 7);
    }).reduce((sum, r) => sum + r.total_eggs, 0);
  }, [records]);

  // Size distribution
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

  // Quality breakdown
  const qualityBreakdown = useMemo(() => {
    const last7 = records.filter(r => new Date(r.date) >= subDays(new Date(), 7));
    const totalEggs = last7.reduce((s, r) => s + r.total_eggs, 0);
    const totalGood = last7.reduce((s, r) => s + r.good, 0);
    const totalBroken = last7.reduce((s, r) => s + r.broken, 0);
    const totalDirty = last7.reduce((s, r) => s + r.dirty, 0);
    return { totalEggs, totalGood, totalBroken, totalDirty };
  }, [records]);

  // Production rate deviation alert
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

  // Chart data — production trend with expected range
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

  // Sales summary
  const salesSummary = useMemo(() => {
    const last30 = sales.filter(s => new Date(s.date) >= subDays(new Date(), 30));
    const totalQty = last30.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = last30.reduce((sum, s) => sum + Number(s.total_amount), 0);
    return { totalQty, totalRevenue, count: last30.length };
  }, [sales]);

  const mask = (v: string) => costPrivacyEnabled ? '****' : v;

  // ─── Record collection ───
  const recordCollection = async () => {
    if (!farmId || !selectedBatch) return;
    const total = parseInt(totalEggs) || 0;
    if (total <= 0) { toast.error('Enter a valid egg count'); return; }
    setEggSubmitting(true);
    const brk = parseInt(broken) || 0;
    const drt = parseInt(dirty) || 0;
    const good = Math.max(0, total - brk - drt);

    const { data, error } = await supabase.from('egg_records').insert({
      batch_id: selectedBatch,
      farm_id: farmId,
      total_eggs: total,
      broken: brk,
      dirty: drt,
      good,
      size_category: sizeCategory,
      notes: eggNotes || null,
    }).select().single();

    if (error) { toast.error(error.message); setEggSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: selectedBatch,
      event_type: 'egg_collection',
      description: `Collected ${total} eggs (${good} good, ${brk} broken, ${drt} dirty) — ${SIZE_LABELS[sizeCategory] || sizeCategory}`,
    });

    setRecords(prev => [data, ...prev.slice(0, 29)]);
    setShowCollect(false);
    setTotalEggs('');
    setBroken('0');
    setDirty('0');
    setEggNotes('');
    setEggSubmitting(false);
    toast.success(`Recorded ${total} eggs (${good} good)`);
  };

  // ─── Record sale ───
  const recordSale = async () => {
    if (!farmId) return;
    const qty = parseInt(saleQty) || 0;
    const price = parseFloat(salePrice) || 0;
    if (qty <= 0 || price <= 0) { toast.error('Enter valid quantity and price'); return; }
    setSaleSubmitting(true);

    const totalAmount = qty * price;

    const { data: sale, error } = await supabase.from('egg_sales').insert({
      farm_id: farmId,
      quantity: qty,
      size_category: saleSizeCategory,
      unit_price: price,
      total_amount: totalAmount,
      buyer: saleBuyer || null,
      notes: saleNotes || null,
    }).select().single();

    if (error) { toast.error(error.message); setSaleSubmitting(false); return; }

    // Auto-create revenue record
    await supabase.from('revenue').insert({
      farm_id: farmId,
      batch_id: selectedBatch || null,
      category: 'egg_sales',
      description: `Egg sale: ${qty} ${saleSizeCategory} eggs @ GHS ${price}`,
      amount: totalAmount,
      buyer: saleBuyer || null,
    });

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'egg_sale',
      description: `Sold ${qty} ${saleSizeCategory} eggs for GHS ${totalAmount.toFixed(2)}${saleBuyer ? ` to ${saleBuyer}` : ''}`,
    });

    setSales(prev => [sale, ...prev.slice(0, 29)]);
    setShowSale(false);
    setSaleQty('30');
    setSalePrice('');
    setSaleBuyer('');
    setSaleNotes('');
    setSaleSubmitting(false);
    toast.success(`Sale recorded: GHS ${totalAmount.toFixed(2)}`);
  };

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Egg Production</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5 rounded-full" onClick={() => setShowSale(true)} disabled={!farmId}>
            <ShoppingCart className="h-4 w-4" /> Sale
          </Button>
          <Button className="gap-1.5 rounded-full" onClick={() => setShowCollect(true)} disabled={!selectedBatch}>
            <Plus className="h-4 w-4" /> Collect
          </Button>
        </div>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Egg className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold mb-1">No egg-laying batches</h3>
            <p className="text-sm text-muted-foreground">Create a layer, duck, or turkey batch to start tracking egg production.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Batch selector */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Active Batch</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.species})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* ═══ Production Summary Dashboard ═══ */}
          {batch && batchAge && (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="py-4 px-4">
                <div className="flex items-center gap-2 mb-3">
                  <Egg className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-sm">Production Overview</h3>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Week {batchAge.week} • {batchAge.phase}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-background p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Today's Rate</p>
                    <p className={`text-lg font-bold ${
                      rateDeviation?.type === 'below' ? 'text-destructive' : 'text-foreground'
                    }`}>
                      {productionRate ? `${productionRate}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {todayRecord ? `${todayRecord.total_eggs} eggs` : 'No collection today'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">7-Day Avg</p>
                    <p className="text-lg font-bold text-foreground">{avg7Day ? `${avg7Day}%` : '—'}</p>
                    <p className="text-xs text-muted-foreground">{weekTotal} eggs this week</p>
                  </div>
                  <div className="rounded-lg bg-background p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Expected Range</p>
                    <p className="text-lg font-bold text-foreground">
                      {expectedRate ? `${expectedRate.min}–${expectedRate.max}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {batch.species} standard
                    </p>
                  </div>
                  <div className="rounded-lg bg-background p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Quality (7d)</p>
                    <p className="text-lg font-bold text-foreground">
                      {qualityBreakdown.totalEggs > 0
                        ? `${((qualityBreakdown.totalGood / qualityBreakdown.totalEggs) * 100).toFixed(0)}%`
                        : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {qualityBreakdown.totalBroken > 0 && `${qualityBreakdown.totalBroken} broken`}
                      {qualityBreakdown.totalBroken > 0 && qualityBreakdown.totalDirty > 0 && ', '}
                      {qualityBreakdown.totalDirty > 0 && `${qualityBreakdown.totalDirty} dirty`}
                      {qualityBreakdown.totalBroken === 0 && qualityBreakdown.totalDirty === 0 && 'All good'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ Production Rate Deviation Alert ═══ */}
          {rateDeviation && (
            <Alert variant={rateDeviation.type === 'below' ? 'destructive' : 'default'}
              className={rateDeviation.type === 'above' ? 'border-blue-500/50 bg-blue-50 text-blue-900' : ''}>
              {rateDeviation.type === 'below' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 text-blue-600" />}
              <AlertTitle className="text-sm">
                Production {rateDeviation.type === 'below' ? 'Below' : 'Above'} Expected
              </AlertTitle>
              <AlertDescription className="text-xs">
                {rateDeviation.type === 'below'
                  ? `Today's rate is ${rateDeviation.diff}% below the expected minimum. Check for health issues, feed quality, lighting, or stress factors.`
                  : `Today's rate is ${rateDeviation.diff}% above the expected maximum — great performance! Ensure adequate calcium and nutrition to sustain this.`}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="production" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="production" className="gap-1">
                <BarChart3 className="h-3.5 w-3.5" /> Production
              </TabsTrigger>
              <TabsTrigger value="grading" className="gap-1">
                <Package className="h-3.5 w-3.5" /> Grading
              </TabsTrigger>
              <TabsTrigger value="sales" className="gap-1">
                <ShoppingCart className="h-3.5 w-3.5" /> Sales
              </TabsTrigger>
            </TabsList>

            {/* ─── Production Tab ─── */}
            <TabsContent value="production" className="space-y-4 mt-4">
              {/* Production rate chart with expected range */}
              {chartData.length >= 2 && (
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> Production Rate Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                          <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            formatter={(value: number, name: string) => {
                              if (name === 'rate') return [`${value}%`, 'Actual Rate'];
                              if (name === 'expectedMin') return [`${value}%`, 'Expected Min'];
                              if (name === 'expectedMax') return [`${value}%`, 'Expected Max'];
                              return [value, name];
                            }}
                          />
                          {/* Expected range as shaded area */}
                          <Area type="monotone" dataKey="expectedMax" stroke="none" fill="#10b981" fillOpacity={0.1} />
                          <Area type="monotone" dataKey="expectedMin" stroke="none" fill="#ffffff" fillOpacity={1} />
                          {/* Actual rate line */}
                          <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                          {/* Expected range reference lines */}
                          {expectedRate && (
                            <>
                              <ReferenceLine y={expectedRate.min} stroke="#10b981" strokeDasharray="6 3" />
                              <ReferenceLine y={expectedRate.max} stroke="#10b981" strokeDasharray="6 3" />
                            </>
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    {expectedRate && (
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        Green dashed lines = expected range ({expectedRate.min}–{expectedRate.max}%)
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Egg count bar chart */}
              {chartData.length >= 2 && (
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" /> Daily Collection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Bar dataKey="good" fill="hsl(var(--primary))" name="Good" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="broken" fill="#ef4444" name="Broken/Dirty" radius={[2, 2, 0, 0]} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent collections list */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Collections</CardTitle>
                </CardHeader>
                <CardContent>
                  {records.length === 0 ? (
                    <div className="py-6 text-center">
                      <Egg className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">No collections yet.</p>
                      <Button variant="outline" className="rounded-full gap-1" onClick={() => setShowCollect(true)}>
                        <Plus className="h-3.5 w-3.5" /> Record Collection
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {records.map(r => {
                        const rate = batch && batch.current_population > 0
                          ? ((r.total_eggs / batch.current_population) * 100).toFixed(1) : null;
                        const isToday = r.date === todayStr;
                        return (
                          <div key={r.id} className={`flex items-center justify-between text-sm border-b pb-1.5 last:border-0 ${isToday ? 'bg-primary/5 rounded px-1.5' : ''}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <Egg className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium">{r.total_eggs} eggs</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({r.good} good{r.broken > 0 ? `, ${r.broken} broken` : ''}{r.dirty > 0 ? `, ${r.dirty} dirty` : ''})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span>{format(new Date(r.date), 'MMM d')}</span>
                                  <span>•</span>
                                  <span className="capitalize">{r.size_category}</span>
                                  {rate && <><span>•</span><span>{rate}%</span></>}
                                </div>
                              </div>
                            </div>
                            {r.notes && (
                              <span className="text-xs text-muted-foreground truncate max-w-[80px]">{r.notes}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Grading Tab ─── */}
            <TabsContent value="grading" className="space-y-4 mt-4">
              {/* Size distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" /> Size Distribution (7 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {qualityBreakdown.totalEggs === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No egg data in the last 7 days.</p>
                  ) : (
                    <div className="space-y-3">
                      {sizeDistribution.map(s => (
                        <div key={s.size} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{s.size}</span>
                            <span className="text-muted-foreground">{s.count} eggs ({s.pct}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${s.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quality breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quality Breakdown (7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {qualityBreakdown.totalEggs === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No data.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-green-50 p-3 text-center">
                        <p className="text-2xl font-bold text-green-700">{qualityBreakdown.totalGood}</p>
                        <p className="text-xs text-green-600">Good</p>
                        <p className="text-xs text-green-600/70">
                          {((qualityBreakdown.totalGood / qualityBreakdown.totalEggs) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-3 text-center">
                        <p className="text-2xl font-bold text-red-700">{qualityBreakdown.totalBroken}</p>
                        <p className="text-xs text-red-600">Broken</p>
                        <p className="text-xs text-red-600/70">
                          {qualityBreakdown.totalEggs > 0 ? ((qualityBreakdown.totalBroken / qualityBreakdown.totalEggs) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-yellow-50 p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-700">{qualityBreakdown.totalDirty}</p>
                        <p className="text-xs text-yellow-600">Dirty</p>
                        <p className="text-xs text-yellow-600/70">
                          {qualityBreakdown.totalEggs > 0 ? ((qualityBreakdown.totalDirty / qualityBreakdown.totalEggs) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* High breakage alert */}
              {qualityBreakdown.totalEggs > 0 && (qualityBreakdown.totalBroken / qualityBreakdown.totalEggs) > 0.03 && (
                <Alert className="border-yellow-500/50 bg-yellow-50 text-yellow-900">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-sm">High Breakage Rate</AlertTitle>
                  <AlertDescription className="text-xs">
                    Breakage exceeds 3% this week ({((qualityBreakdown.totalBroken / qualityBreakdown.totalEggs) * 100).toFixed(1)}%).
                    Check for calcium deficiency, rough handling, or nest box padding issues.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* ─── Sales Tab ─── */}
            <TabsContent value="sales" className="space-y-4 mt-4">
              {/* Sales summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Eggs Sold (30d)</p>
                    <p className="text-xl font-bold text-foreground">{salesSummary.totalQty}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Revenue (30d)</p>
                    <p className="text-xl font-bold text-foreground">
                      {mask(`GHS ${salesSummary.totalRevenue.toFixed(2)}`)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="text-xl font-bold text-foreground">{salesSummary.count}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sales list */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Recent Sales</CardTitle>
                    <Button variant="outline" size="sm" className="rounded-full gap-1 h-8 text-xs" onClick={() => setShowSale(true)}>
                      <Plus className="h-3 w-3" /> New Sale
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sales.length === 0 ? (
                    <div className="py-6 text-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">No sales recorded yet.</p>
                      <Button variant="outline" className="rounded-full gap-1" onClick={() => setShowSale(true)}>
                        <Plus className="h-3.5 w-3.5" /> Record Sale
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {sales.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{s.quantity} eggs</span>
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 capitalize">{s.size_category}</Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{format(new Date(s.date), 'MMM d')}</span>
                                {s.buyer && <><span>•</span><span className="truncate max-w-[80px]">{s.buyer}</span></>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium">{mask(`GHS ${Number(s.total_amount).toFixed(2)}`)}</p>
                            <p className="text-xs text-muted-foreground">{mask(`@ GHS ${Number(s.unit_price).toFixed(2)}`)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* ═══ Collection Dialog ═══ */}
      <Dialog open={showCollect} onOpenChange={setShowCollect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Egg Collection</DialogTitle>
            <DialogDescription>
              Log today's egg collection with quality grading and size category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>Total Eggs</Label>
                <Input type="number" min="0" value={totalEggs} onChange={e => setTotalEggs(e.target.value)} placeholder="e.g., 120" />
              </div>
              <div className="space-y-1">
                <Label>Broken</Label>
                <Input type="number" min="0" value={broken} onChange={e => setBroken(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Dirty</Label>
                <Input type="number" min="0" value={dirty} onChange={e => setDirty(e.target.value)} />
              </div>
            </div>
            {totalEggs && parseInt(totalEggs) > 0 && (
              <div className="rounded-lg bg-muted p-2.5 text-sm">
                <p className="font-medium text-green-700">
                  Good: {Math.max(0, (parseInt(totalEggs) || 0) - (parseInt(broken) || 0) - (parseInt(dirty) || 0))} eggs
                </p>
                {batch && batch.current_population > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rate: {(((parseInt(totalEggs) || 0) / batch.current_population) * 100).toFixed(1)}%
                    {expectedRate && ` (expected: ${expectedRate.min}–${expectedRate.max}%)`}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1">
              <Label>Size Category</Label>
              <Select value={sizeCategory} onValueChange={setSizeCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (&lt; 53g)</SelectItem>
                  <SelectItem value="medium">Medium (53–63g)</SelectItem>
                  <SelectItem value="large">Large (&gt; 63g)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea value={eggNotes} onChange={e => setEggNotes(e.target.value)} rows={2} placeholder="e.g., Soft shells observed" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollect(false)}>Cancel</Button>
            <Button onClick={recordCollection} disabled={eggSubmitting || !totalEggs}>
              {eggSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Sale Dialog ═══ */}
      <Dialog open={showSale} onOpenChange={setShowSale}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Egg Sale</DialogTitle>
            <DialogDescription>
              Log an egg sale. Revenue will be automatically recorded in Finance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Quantity (eggs)</Label>
                <Input type="number" min="1" value={saleQty} onChange={e => setSaleQty(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Price per Egg (GHS)</Label>
                <Input type="number" min="0" step="0.01" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="e.g., 1.50" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Size Category</Label>
              <Select value={saleSizeCategory} onValueChange={setSaleSizeCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Buyer (optional)</Label>
              <Input value={saleBuyer} onChange={e => setSaleBuyer(e.target.value)} placeholder="Name or business" />
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Input value={saleNotes} onChange={e => setSaleNotes(e.target.value)} placeholder="e.g., Crate of 30" />
            </div>
            {salePrice && saleQty && parseInt(saleQty) > 0 && parseFloat(salePrice) > 0 && (
              <div className="rounded-lg bg-muted p-2.5">
                <p className="text-sm font-medium">
                  Total: {mask(`GHS ${(parseInt(saleQty) * parseFloat(salePrice)).toFixed(2)}`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {parseInt(saleQty)} × GHS {parseFloat(salePrice).toFixed(2)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSale(false)}>Cancel</Button>
            <Button onClick={recordSale} disabled={saleSubmitting || !salePrice || !saleQty}>
              {saleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
