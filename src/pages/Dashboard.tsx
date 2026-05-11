import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { getBatchAge, recordMortality } from '@/lib/batch-utils';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type Activity = Database['public']['Tables']['activity_log']['Row'];

export default function Dashboard() {
  const { user, farmId, farmName, currency } = useAuth();
  const navigate = useNavigate();
  const { costPrivacyEnabled, toggleCostPrivacy, isOnline, setSyncing } = useAppStore();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real stat data
  const [tasksToday, setTasksToday] = useState(0);
  const [weeklyExpenses, setWeeklyExpenses] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  // Chart data
  const [expenseChartData, setExpenseChartData] = useState<{ name: string; value: number }[]>([]);
  const [eggChartData, setEggChartData] = useState<{ name: string; value: number }[]>([]);

  // Mortality modal
  const [mortalityBatch, setMortalityBatch] = useState<Batch | null>(null);
  const [mortalityCount, setMortalityCount] = useState('1');
  const [mortalityCause, setMortalityCause] = useState('');
  const [mortalityNotes, setMortalityNotes] = useState('');
  const [mortalitySubmitting, setMortalitySubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);

      if (navigator.onLine) {
        try {
          setSyncing(true);
          const farms = await cacheFarms(user.id);
          const farm = farms?.[0];

          if (farm) {
            const [batchData, activityData] = await Promise.all([
              cacheBatches(farm.id),
              cacheActivities(farm.id),
            ]);

            const activeBatches = (batchData ?? []).filter(b => b.status === 'active');
            setBatches(activeBatches as Batch[]);
            setActivities((activityData ?? []).slice(0, 10) as Activity[]);

            // Fetch real stats
            await loadStats(farm.id);
          }
        } catch (err: unknown) {
          console.warn('Online fetch failed, falling back to cache:', err);
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
      const monthStartStr = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      const [batchTasksRes, healthTasksRes, expensesRes, revenueRes, dailyExpensesRes, eggRecordsRes] = await Promise.all([
        supabase.from('batch_tasks').select('id', { count: 'exact', head: true }).eq('farm_id', fId).eq('completed', false).lte('due_date', todayStr),
        supabase.from('health_tasks').select('id', { count: 'exact', head: true }).eq('farm_id', fId).eq('completed', false).lte('scheduled_date', todayStr),
        supabase.from('expenses').select('amount').eq('farm_id', fId).gte('date', weekAgoStr),
        supabase.from('revenue').select('amount').eq('farm_id', fId).gte('date', monthStartStr),
        supabase.from('expenses').select('amount, date').eq('farm_id', fId).gte('date', weekAgoStr).order('date'),
        supabase.from('egg_records').select('total_eggs, date').eq('farm_id', fId).gte('date', weekAgoStr).order('date'),
      ]);

      setTasksToday((batchTasksRes.count ?? 0) + (healthTasksRes.count ?? 0));
      setWeeklyExpenses((expensesRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0));
      setMonthlyRevenue((revenueRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0));

      // Build 7-day expense chart
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const expByDay: Record<string, number> = {};
      const eggByDay: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const key = format(d, 'yyyy-MM-dd');
        const label = dayNames[d.getDay()];
        expByDay[key] = 0;
        eggByDay[key] = 0;
      }
      for (const e of dailyExpensesRes.data ?? []) expByDay[e.date] = (expByDay[e.date] ?? 0) + Number(e.amount);
      for (const e of eggRecordsRes.data ?? []) eggByDay[e.date] = (eggByDay[e.date] ?? 0) + e.total_eggs;

      setExpenseChartData(Object.entries(expByDay).map(([d, v]) => ({ name: dayNames[new Date(d).getDay()], value: v })));
      setEggChartData(Object.entries(eggByDay).map(([d, v]) => ({ name: dayNames[new Date(d).getDay()], value: v })));
    };

    const loadFromCache = async () => {
      try {
        const cachedFarms = await getCachedFarms(user!.id);
        const farm = cachedFarms[0];
        if (farm) {
          const [cachedBatches, cachedActivities] = await Promise.all([
            getCachedBatches(farm.id),
            getCachedActivities(farm.id),
          ]);
          const activeBatches = cachedBatches.filter(b => b.status === 'active');
          setBatches(activeBatches as unknown as Batch[]);
          setActivities(cachedActivities.slice(0, 10) as unknown as Activity[]);
        }
      } catch (cacheErr) {
        console.error('Cache read failed:', cacheErr);
      }
    };

    loadData();
  }, [user, setSyncing]);

  const handleToggleCostPrivacy = async () => {
    toggleCostPrivacy();
    if (user) {
      const newValue = !costPrivacyEnabled;
      await supabase.from('user_preferences').update({ cost_privacy_enabled: newValue }).eq('user_id', user.id);
    }
  };

  const handleRecordMortality = async () => {
    if (!mortalityBatch || !farmId) return;
    setMortalitySubmitting(true);
    const count = parseInt(mortalityCount) || 0;
    if (count <= 0) { toast.error('Count must be positive'); setMortalitySubmitting(false); return; }

    const newPop = await recordMortality({
      batchId: mortalityBatch.id,
      farmId,
      batchName: mortalityBatch.name,
      currentPopulation: mortalityBatch.current_population,
      count,
      cause: mortalityCause || undefined,
      notes: mortalityNotes || undefined,
    });

    if (newPop === null) {
      toast.error('Failed to record mortality');
      setMortalitySubmitting(false);
      return;
    }

    setBatches(prev => prev.map(b => b.id === mortalityBatch.id ? { ...b, current_population: newPop } : b));
    setMortalityBatch(null);
    setMortalityCount('1');
    setMortalityCause('');
    setMortalityNotes('');
    setMortalitySubmitting(false);
    toast.success(`Recorded ${count} mortality`);
  };

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const maskedValue = (value: string) => costPrivacyEnabled ? '• • • •' : value;

  const statCards = [
    { title: 'Active Batches', value: String(batches.length), icon: Layers, masked: false },
    { title: 'Tasks Today', value: String(tasksToday), icon: ClipboardList, masked: false },
    { title: 'Weekly Expenses', value: maskedValue(formatCurrency(weeklyExpenses)), icon: Wallet, masked: true },
    { title: 'Monthly Revenue', value: maskedValue(formatCurrency(monthlyRevenue)), icon: TrendingUp, masked: true },
  ];

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
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
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
                {batches.map((batch) => {
                  const age = getBatchAge(batch.start_date, batch.species);
                  return (
                    <Card key={batch.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{batch.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{batch.species}</p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                            {age.phase}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-3">
                          <div>
                            <p className="font-medium text-foreground">{batch.current_population}</p>
                            <p>Birds</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Wk {age.week}</p>
                            <p>Day {age.day}</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{format(new Date(batch.start_date), 'MMM d')}</p>
                            <p>Started</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1 rounded-full text-xs gap-1" onClick={() => navigate(`/batches/${batch.id}`)}>
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
                </TabsList>
                <TabsContent value="expenses">
                  {expenseChartData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart data={expenseChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                        <YAxis className="text-xs fill-muted-foreground" />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No expenses this week</div>
                  )}
                </TabsContent>
                <TabsContent value="production">
                  {eggChartData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={256}>
                      <LineChart data={eggChartData}>
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
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="text-foreground truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), 'MMM d, h:mm a')}
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
      <Dialog open={!!mortalityBatch} onOpenChange={() => setMortalityBatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Mortality — {mortalityBatch?.name}</DialogTitle>
            <DialogDescription>Record bird deaths for this batch. The population count will be updated automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Count</Label>
              <Input type="number" min="1" value={mortalityCount} onChange={e => setMortalityCount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cause (optional)</Label>
              <Input value={mortalityCause} onChange={e => setMortalityCause(e.target.value)} placeholder="e.g., Disease, Predator, Unknown" />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={mortalityNotes} onChange={e => setMortalityNotes(e.target.value)} placeholder="Additional details..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMortalityBatch(null)}>Cancel</Button>
            <Button onClick={handleRecordMortality} disabled={mortalitySubmitting}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
