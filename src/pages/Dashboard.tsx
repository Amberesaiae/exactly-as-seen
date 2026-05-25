import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { getBatchAge, mortalityRate, cleanupBatchCompletion } from '@/lib/batch-utils';
import {
  cacheFarms, cacheBatches, cacheActivities,
  getCachedFarms, getCachedBatches, getCachedActivities
} from '@/lib/sync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Layers, ClipboardList, Wallet, TrendingUp, Plus, Eye, EyeOff,
  Clock, Skull
} from 'lucide-react';
import { MortalityDialog } from '@/components/MortalityDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

import { db } from '@/lib/db';

const COLORS = ['hsl(var(--primary))', '#fbbf24', '#f87171', '#818cf8', '#34d399', '#ec4899', '#8b5cf6'];

export default function Dashboard() {
  const { user, farmId, farmName, currency } = useAuth();
  const navigate = useNavigate();
  const { costPrivacyEnabled, toggleCostPrivacy, isOnline, setSyncing } = useAppStore();
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Consolidated chart data state to prevent redundant render cycles
  const [chartsState, setChartsState] = useState<{
    expenses: { name: string; value: number }[];
    eggs: { name: string; value: number }[];
    categories: { name: string; value: number }[];
  }>({ expenses: [], eggs: [], categories: [] });

  // Mortality modal
  const [mortalityBatch, setMortalityBatch] = useState<any | null>(null);

  const loadFromCache = async () => {
    try {
      if (!farmId) return;
      const cached = await db.dashboard_cache.get(farmId);
      if (cached) {
        setOverviewData(cached.payload);
        setFetchedAt(new Date(cached.fetched_at));
      }
    } catch (err) {
      console.error('Failed to load dashboard from cache:', err);
    }
  };

  useEffect(() => {
    if (!user || !farmId) return;

    const loadData = async () => {
      setIsLoading(true);

      if (navigator.onLine) {
        try {
          setSyncing(true);
          const { data, error } = await (supabase as any).rpc('get_dashboard_overview', { p_farm_id: farmId });
          if (error) throw error;

          if (data) {
            const overview = data as any;
            setOverviewData(overview);
            setFetchedAt(new Date());

            // Save to Dexie cache
            await db.dashboard_cache.put({
              farm_id: farmId,
              payload: overview,
              fetched_at: new Date().toISOString()
            });

            // Eager background caching of lists for offline/sidebar use
            cacheBatches(farmId).catch(err => console.error('Eager batches caching failed:', err));
            cacheFarms(user.id).catch(err => console.error('Eager farms caching failed:', err));
          }

          // Fetch background chart data
          await loadStats(farmId);
        } catch (err: unknown) {
          console.warn('Online RPC fetch failed, falling back to cache:', err);
          await loadFromCache();
        } finally {
          setSyncing(false);
        }
      } else {
        await loadFromCache();
      }

      setIsLoading(false);
    };

    const loadStats = async (fId: string) => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const weekAgoStr = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      const [dailyExpensesRes, eggRecordsRes] = await Promise.all([
        supabase.from('expenses').select('amount_pesewas, date, category').eq('farm_id', fId).gte('date', weekAgoStr).order('date'),
        supabase.from('egg_records').select('total_eggs, date').eq('farm_id', fId).gte('date', weekAgoStr).order('date'),
      ]);

      // Build 7-day expense chart
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const expByDay: Record<string, number> = {};
      const eggByDay: Record<string, number> = {};
      const expByCategory: Record<string, number> = {};

      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const key = format(d, 'yyyy-MM-dd');
        expByDay[key] = 0;
        eggByDay[key] = 0;
      }
      for (const e of dailyExpensesRes.data ?? []) {
        expByDay[e.date] = (expByDay[e.date] ?? 0) + (Number(e.amount_pesewas || 0) / 100);
        
        // Group by category (cleaner names)
        const friendlyCategory = (e.category || 'other').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        expByCategory[friendlyCategory] = (expByCategory[friendlyCategory] ?? 0) + (Number(e.amount_pesewas || 0) / 100);
      }
      for (const e of eggRecordsRes.data ?? []) {
        eggByDay[e.date] = (eggByDay[e.date] ?? 0) + e.total_eggs;
      }

      setChartsState({
        expenses: Object.entries(expByDay).map(([d, v]) => ({ name: dayNames[new Date(d).getDay()], value: v })),
        eggs: Object.entries(eggByDay).map(([d, v]) => ({ name: dayNames[new Date(d).getDay()], value: v })),
        categories: Object.entries(expByCategory).map(([name, value]) => ({ name, value }))
      });
    };

    loadData();
  }, [user, farmId, setSyncing]);

  const handleToggleCostPrivacy = async () => {
    toggleCostPrivacy();
    if (user) {
      const newValue = !costPrivacyEnabled;
      await supabase.from('user_preferences').update({ cost_privacy_enabled: newValue }).eq('user_id', user.id);
    }
  };

  const handleMortalitySuccess = (batchId: string, newPop: number) => {
    if (overviewData) {
      const updatedBatches = (overviewData.active_batches || []).map((b: any) => 
        b.batch_id === batchId ? { ...b, population_current: newPop } : b
      );
      setOverviewData({ ...overviewData, active_batches: updatedBatches });
    }
  };

  const formatCurrency = (pesewas: number) => {
    return `${overviewData?.currency || currency || 'GHS'} ${(pesewas / 100).toFixed(2)}`;
  };

  const statCards = [
    { title: 'Active Flocks', value: String(overviewData?.quick_stats?.active_batches_count ?? 0), icon: Layers, masked: false },
    { title: 'Tasks Today', value: String(overviewData?.quick_stats?.tasks_today_count ?? 0), icon: ClipboardList, masked: false },
    { title: 'Weekly Expenses', value: costPrivacyEnabled ? '• • • •' : formatCurrency(overviewData?.quick_stats?.weekly_expenses_pesewas ?? 0), icon: Wallet, masked: true },
    { title: 'Monthly Revenue', value: costPrivacyEnabled ? '• • • •' : formatCurrency(overviewData?.quick_stats?.monthly_revenue_pesewas ?? 0), icon: TrendingUp, masked: true },
  ];

  const batches = overviewData?.active_batches || [];
  const activities = overviewData?.recent_activity || [];
  const mappedMortalityBatch = mortalityBatch ? {
    id: mortalityBatch.batch_id || mortalityBatch.id,
    name: mortalityBatch.name,
    current_population: mortalityBatch.population_current || mortalityBatch.current_population,
    species: mortalityBatch.species,
  } as any : null;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{farmName || 'Overview'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            {fetchedAt && (new Date().getTime() - fetchedAt.getTime() > 3600000) && (
              <span className="text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium" title={`Last updated: ${format(fetchedAt, 'h:mm a')}`}>
                ⏳ Stale ({Math.round((new Date().getTime() - fetchedAt.getTime()) / 3600000)}h ago)
              </span>
            )}
          </div>
        </div>
        {!isOnline && (
          <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 px-2 py-1 rounded-full">
            Offline
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                {stat.masked && (
                  <button onClick={handleToggleCostPrivacy} className="text-muted-foreground hover:text-foreground transition-colors">
                    {costPrivacyEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Active Batches</h2>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full" asChild>
                <Link to="/batches/new"><Plus className="h-4 w-4" /> New Batch</Link>
              </Button>
            </div>

            {batches.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No active batches</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create your first batch to start tracking your flock.</p>
                  <Button className="gap-1.5 rounded-full" asChild>
                    <Link to="/batches/new"><Plus className="h-4 w-4" /> Create First Batch</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {batches.map((batch: any) => {
                  return (
                    <Card key={batch.batch_id} className={batch.in_withdrawal ? 'border-amber-500/50 bg-amber-500/5' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{batch.name}</p>
                            <div className="flex gap-1.5 mt-0.5">
                              <p className="text-xs text-muted-foreground capitalize">
                                {batch.species === 'duck' && batch.duck_type ? `${batch.duck_type} duck` : batch.species}
                              </p>
                              {batch.in_withdrawal && (
                                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                  Withdrawal
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                            {batch.phase}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-3">
                          <div>
                            <p className="font-medium text-foreground">{batch.population_current}</p>
                            <p>Birds</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Wk {batch.current_week}</p>
                            <p>Day {batch.current_day_of_week}</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground truncate">{batch.house_name}</p>
                            <p>House</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1 rounded-full text-xs gap-1" onClick={() => navigate(`/batches/${batch.batch_id}`)}>
                            <Eye className="h-3 w-3" /> View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 rounded-full text-xs gap-1" onClick={() => setMortalityBatch(batch)}>
                            <Skull className="h-3 w-3" /> Mortality
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="expenses">
                <TabsList className="mb-4">
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="production">Egg Production</TabsTrigger>
                  <TabsTrigger value="categories">Expense Breakdown</TabsTrigger>
                </TabsList>
                 <TabsContent value="expenses">
                  {chartsState.expenses.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart data={chartsState.expenses}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                        <YAxis className="text-xs fill-muted-foreground" />
                        <Tooltip formatter={(v: number) => formatCurrency(v * 100)} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No expenses this week</div>
                  )}
                </TabsContent>
                <TabsContent value="production">
                  {chartsState.eggs.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={256}>
                      <LineChart data={chartsState.eggs}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                        <YAxis className="text-xs fill-muted-foreground" />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No egg production data this week</div>
                  )}
                </TabsContent>
                <TabsContent value="categories">
                  {chartsState.categories.some(d => d.value > 0) ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartsState.categories}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartsState.categories.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${overviewData?.currency || currency || 'GHS'} ${v.toFixed(2)}`} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No categorized expenses this week</div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Activity feed — visible on all sizes */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {activities.map((activity: any) => (
                    <div key={activity.event_id} className="flex gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="text-foreground truncate">{activity.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.occurred_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mortality Modal */}
      <MortalityDialog
        batch={mappedMortalityBatch}
        farmId={farmId}
        onClose={() => setMortalityBatch(null)}
        onSuccess={handleMortalitySuccess}
      />
    </div>
  );
}
