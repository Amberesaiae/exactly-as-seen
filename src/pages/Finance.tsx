import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, TrendingDown, Plus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type Expense = Database['public']['Tables']['expenses']['Row'];
type Revenue = Database['public']['Tables']['revenue']['Row'];

const EXPENSE_CATEGORIES = ['Feed', 'Health', 'Labor', 'Utilities', 'Equipment', 'Transport', 'Housing', 'Chicks', 'Other'];
const CATEGORY_COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6b7280'];

export default function Finance() {
  const { user } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);

  // Expense modal
  const [showExpense, setShowExpense] = useState(false);
  const [expCategory, setExpCategory] = useState('Feed');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expSubmitting, setExpSubmitting] = useState(false);

  // Revenue modal
  const [showRevenue, setShowRevenue] = useState(false);
  const [revCategory, setRevCategory] = useState('bird_sales');
  const [revDesc, setRevDesc] = useState('');
  const [revAmount, setRevAmount] = useState('');
  const [revBuyer, setRevBuyer] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);

      const [expResult, revResult] = await Promise.all([
        supabase.from('expenses').select('*').eq('farm_id', farm.id).order('date', { ascending: false }).limit(100),
        supabase.from('revenue').select('*').eq('farm_id', farm.id).order('date', { ascending: false }).limit(100),
      ]);

      setExpenses(expResult.data ?? []);
      setRevenues(revResult.data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const mask = (v: number) => costPrivacyEnabled ? '****' : `GHS ${v.toFixed(2)}`;

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalRevenue = revenues.reduce((s, r) => s + Number(r.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const weeklyExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= weekStart && d <= weekEnd; }).reduce((s, e) => s + Number(e.amount), 0);
  const monthlyRevenue = revenues.filter(r => { const d = new Date(r.date); return d >= monthStart && d <= monthEnd; }).reduce((s, r) => s + Number(r.amount), 0);

  const categoryBreakdown = EXPENSE_CATEGORIES.map((cat, i) => ({
    name: cat,
    value: expenses.filter(e => e.category.toLowerCase() === cat.toLowerCase()).reduce((s, e) => s + Number(e.amount), 0),
    fill: CATEGORY_COLORS[i],
  })).filter(c => c.value > 0);

  const addExpense = async () => {
    if (!farmId) return;
    setExpSubmitting(true);
    const { error } = await supabase.from('expenses').insert({
      farm_id: farmId,
      category: expCategory.toLowerCase(),
      description: expDesc,
      amount: parseFloat(expAmount) || 0,
      date: expDate,
      source: 'manual',
    });
    if (error) { toast.error(error.message); setExpSubmitting(false); return; }
    setShowExpense(false);
    setExpDesc('');
    setExpAmount('');
    setExpSubmitting(false);
    // Reload
    const { data } = await supabase.from('expenses').select('*').eq('farm_id', farmId).order('date', { ascending: false }).limit(100);
    setExpenses(data ?? []);
    toast.success('Expense recorded');
  };

  const addRevenue = async () => {
    if (!farmId) return;
    setRevSubmitting(true);
    const { error } = await supabase.from('revenue').insert({
      farm_id: farmId,
      category: revCategory,
      description: revDesc,
      amount: parseFloat(revAmount) || 0,
      buyer: revBuyer || null,
    });
    if (error) { toast.error(error.message); setRevSubmitting(false); return; }
    setShowRevenue(false);
    setRevDesc('');
    setRevAmount('');
    setRevBuyer('');
    setRevSubmitting(false);
    const { data } = await supabase.from('revenue').select('*').eq('farm_id', farmId).order('date', { ascending: false }).limit(100);
    setRevenues(data ?? []);
    toast.success('Revenue recorded');
  };

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Finance</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5 rounded-full" onClick={() => setShowRevenue(true)}>
            <TrendingUp className="h-4 w-4" /> Add Revenue
          </Button>
          <Button className="gap-1.5 rounded-full" onClick={() => setShowExpense(true)}>
            <TrendingDown className="h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <TrendingDown className="h-5 w-5 mx-auto text-destructive mb-1" />
          <p className="text-xl font-bold">{mask(totalExpenses)}</p>
          <p className="text-xs text-muted-foreground">Total Expenses</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold">{mask(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>{mask(netProfit)}</p>
          <p className="text-xs text-muted-foreground">Net Profit/Loss</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Wallet className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-xl font-bold">{mask(weeklyExpenses)}</p>
          <p className="text-xs text-muted-foreground">This Week</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            <CardContent className="pt-4">
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No expenses recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 20).map(e => (
                    <div key={e.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{e.description}</p>
                        <p className="text-xs text-muted-foreground capitalize">{e.category} • {e.source === 'auto' ? 'Auto' : 'Manual'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-destructive">{mask(Number(e.amount))}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM d')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardContent className="pt-4">
              {revenues.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No revenue recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {revenues.slice(0, 20).map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{r.description}</p>
                        <p className="text-xs text-muted-foreground capitalize">{r.category.replace('_', ' ')}{r.buyer ? ` • ${r.buyer}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">{mask(Number(r.amount))}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(r.date), 'MMM d')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardContent className="pt-4">
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data to display.</p>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {categoryBreakdown.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1">
                    {categoryBreakdown.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i] }} />
                        <span>{c.name}: {mask(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Expense Dialog */}
      <Dialog open={showExpense} onOpenChange={setShowExpense}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={expCategory} onValueChange={setExpCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Description</Label><Input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="What was this for?" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Amount (GHS)</Label><Input type="number" min="0" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpense(false)}>Cancel</Button>
            <Button onClick={addExpense} disabled={expSubmitting || !expDesc || !expAmount}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revenue Dialog */}
      <Dialog open={showRevenue} onOpenChange={setShowRevenue}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Revenue</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={revCategory} onValueChange={setRevCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bird_sales">Bird Sales</SelectItem>
                  <SelectItem value="egg_sales">Egg Sales</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Description</Label><Input value={revDesc} onChange={e => setRevDesc(e.target.value)} placeholder="What was sold?" /></div>
            <div className="space-y-1"><Label>Amount (GHS)</Label><Input type="number" min="0" step="0.01" value={revAmount} onChange={e => setRevAmount(e.target.value)} /></div>
            <div className="space-y-1"><Label>Buyer (optional)</Label><Input value={revBuyer} onChange={e => setRevBuyer(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevenue(false)}>Cancel</Button>
            <Button onClick={addRevenue} disabled={revSubmitting || !revDesc || !revAmount}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
