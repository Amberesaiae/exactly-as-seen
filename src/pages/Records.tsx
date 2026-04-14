import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { getBatchAge, mortalityRate } from '@/lib/batch-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, BarChart3, Skull, Calculator, Egg, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

interface BatchPerformance {
  batchId: string;
  totalMortality: number;
  mortalityPct: string;
  totalFeedKg: number;
  totalEggs: number;
  totalExpenses: number;
  totalRevenue: number;
  costPerBird: string;
}

export default function Records() {
  const { user, farmId, currency } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [performanceData, setPerformanceData] = useState<Record<string, BatchPerformance>>({});
  const [perfLoading, setPerfLoading] = useState(false);

  // Compare
  const [compareBatch1, setCompareBatch1] = useState('');
  const [compareBatch2, setCompareBatch2] = useState('');

  useEffect(() => {
    if (!user || !farmId) return;
    const load = async () => {
      setLoading(true);
      let query = supabase.from('batches').select('*').eq('farm_id', farmId);
      if (speciesFilter !== 'all') query = query.eq('species', speciesFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data } = await query.order('created_at', { ascending: false });
      setBatches(data ?? []);
      setLoading(false);
    };
    load();
  }, [user, farmId, speciesFilter, statusFilter]);

  // Load performance data for all batches
  useEffect(() => {
    if (!farmId || batches.length === 0) return;
    const loadPerf = async () => {
      setPerfLoading(true);
      const batchIds = batches.map(b => b.id);

      const [mortalityRes, feedRes, eggRes, expenseRes, revenueRes] = await Promise.all([
        supabase.from('mortality_records').select('batch_id, count').eq('farm_id', farmId).in('batch_id', batchIds),
        supabase.from('feed_schedules').select('batch_id, total_amount_kg').eq('farm_id', farmId).eq('completed', true).in('batch_id', batchIds),
        supabase.from('egg_records').select('batch_id, total_eggs').eq('farm_id', farmId).in('batch_id', batchIds),
        supabase.from('expenses').select('batch_id, amount').eq('farm_id', farmId).in('batch_id', batchIds),
        supabase.from('revenue').select('batch_id, amount').eq('farm_id', farmId).in('batch_id', batchIds),
      ]);

      const perf: Record<string, BatchPerformance> = {};
      for (const b of batches) {
        const bMorts = (mortalityRes.data ?? []).filter(m => m.batch_id === b.id);
        const bFeed = (feedRes.data ?? []).filter(f => f.batch_id === b.id);
        const bEggs = (eggRes.data ?? []).filter(e => e.batch_id === b.id);
        const bExp = (expenseRes.data ?? []).filter(e => e.batch_id === b.id);
        const bRev = (revenueRes.data ?? []).filter(r => r.batch_id === b.id);

        const totalMortality = bMorts.reduce((s, m) => s + m.count, 0);
        const totalFeedKg = bFeed.reduce((s, f) => s + Number(f.total_amount_kg), 0);
        const totalEggs = bEggs.reduce((s, e) => s + e.total_eggs, 0);
        const totalExpenses = bExp.reduce((s, e) => s + Number(e.amount), 0);
        const totalRevenue = bRev.reduce((s, r) => s + Number(r.amount), 0);

        perf[b.id] = {
          batchId: b.id,
          totalMortality,
          mortalityPct: mortalityRate(b.initial_quantity, b.current_population),
          totalFeedKg,
          totalEggs,
          totalExpenses,
          totalRevenue,
          costPerBird: b.current_population > 0 ? (totalExpenses / b.current_population).toFixed(2) : '0.00',
        };
      }
      setPerformanceData(perf);
      setPerfLoading(false);
    };
    loadPerf();
  }, [farmId, batches]);

  const mask = (v: string) => costPrivacyEnabled ? '****' : v;

  const exportCSV = () => {
    if (batches.length === 0) return;
    const headers = ['Name', 'Species', 'Status', 'Initial Qty', 'Current Pop', 'Mortality %', 'Total Feed (kg)', 'Total Eggs', 'Total Expenses', 'Total Revenue', 'Start Date'];
    const rows = batches.map(b => {
      const p = performanceData[b.id];
      const age = getBatchAge(b.start_date, b.species);
      return [b.name, b.species, b.status, b.initial_quantity, b.current_population,
        p?.mortalityPct ?? '0.0', p?.totalFeedKg.toFixed(1) ?? '0', p?.totalEggs ?? 0,
        p?.totalExpenses.toFixed(2) ?? '0', p?.totalRevenue.toFixed(2) ?? '0', b.start_date];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lampfarms_records_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const batch1 = batches.find(b => b.id === compareBatch1);
  const batch2 = batches.find(b => b.id === compareBatch2);
  const p1 = compareBatch1 ? performanceData[compareBatch1] : null;
  const p2 = compareBatch2 ? performanceData[compareBatch2] : null;

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Records</h1>
        <Button variant="outline" className="gap-1.5 rounded-full" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            <SelectItem value="broiler">Broiler</SelectItem>
            <SelectItem value="layer">Layer</SelectItem>
            <SelectItem value="duck">Duck</SelectItem>
            <SelectItem value="turkey">Turkey</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Batch Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {batches.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No records to display.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Species</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">Initial</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">Current</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">Mortality %</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id} className="border-b last:border-0">
                        <td className="py-2 px-2 font-medium">{b.name}</td>
                        <td className="py-2 px-2 capitalize">{b.species}</td>
                        <td className="py-2 px-2 capitalize">{b.status}</td>
                        <td className="py-2 px-2 text-right">{b.initial_quantity}</td>
                        <td className="py-2 px-2 text-right">{b.current_population}</td>
                        <td className="py-2 px-2 text-right">{performanceData[b.id]?.mortalityPct ?? mortalityRate(b.initial_quantity, b.current_population)}%</td>
                        <td className="py-2 px-2">{format(new Date(b.start_date), 'MMM d, yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance">
          {batches.length === 0 || perfLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="font-semibold mb-1">Performance Metrics</h3>
                <p className="text-sm text-muted-foreground">{perfLoading ? 'Loading...' : 'No batches with data yet.'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {batches.map(b => {
                const p = performanceData[b.id];
                if (!p) return null;
                const age = getBatchAge(b.start_date, b.species);
                return (
                  <Card key={b.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">{b.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{b.species} • {b.status} • Week {age.week}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                          <Skull className="h-4 w-4 mx-auto mb-1 text-destructive" />
                          <p className="text-lg font-bold">{p.mortalityPct}%</p>
                          <p className="text-xs text-muted-foreground">Mortality ({p.totalMortality})</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                          <Calculator className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold">{p.totalFeedKg.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">Feed (kg)</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                          <Egg className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold">{p.totalEggs}</p>
                          <p className="text-xs text-muted-foreground">Total Eggs</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                          <Wallet className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold">{mask(`${currency} ${p.costPerBird}`)}</p>
                          <p className="text-xs text-muted-foreground">Cost/Bird</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <div className="flex gap-3">
            <Select value={compareBatch1} onValueChange={setCompareBatch1}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select batch 1" /></SelectTrigger>
              <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <span className="self-center text-muted-foreground">vs</span>
            <Select value={compareBatch2} onValueChange={setCompareBatch2}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select batch 2" /></SelectTrigger>
              <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {batch1 && batch2 && p1 && p2 ? (
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Metric</th>
                      <th className="text-right py-2 px-2 font-medium">{batch1.name}</th>
                      <th className="text-right py-2 px-2 font-medium">{batch2.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Species', batch1.species, batch2.species],
                      ['Initial Qty', String(batch1.initial_quantity), String(batch2.initial_quantity)],
                      ['Current Pop', String(batch1.current_population), String(batch2.current_population)],
                      ['Mortality %', `${p1.mortalityPct}%`, `${p2.mortalityPct}%`],
                      ['Total Feed (kg)', p1.totalFeedKg.toFixed(1), p2.totalFeedKg.toFixed(1)],
                      ['Total Eggs', String(p1.totalEggs), String(p2.totalEggs)],
                      ['Total Expenses', mask(`${currency} ${p1.totalExpenses.toFixed(2)}`), mask(`${currency} ${p2.totalExpenses.toFixed(2)}`)],
                      ['Total Revenue', mask(`${currency} ${p1.totalRevenue.toFixed(2)}`), mask(`${currency} ${p2.totalRevenue.toFixed(2)}`)],
                      ['Cost/Bird', mask(`${currency} ${p1.costPerBird}`), mask(`${currency} ${p2.costPerBird}`)],
                    ].map(([metric, v1, v2]) => (
                      <tr key={metric} className="border-b last:border-0">
                        <td className="py-2 px-2 text-muted-foreground">{metric}</td>
                        <td className="py-2 px-2 text-right font-medium capitalize">{v1}</td>
                        <td className="py-2 px-2 text-right font-medium capitalize">{v2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">Select two batches to compare.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
