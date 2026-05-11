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
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Package, Plus, AlertTriangle, ShoppingCart, Loader2,
  TrendingDown, ArrowDownRight, ArrowUpRight, Boxes,
  Pill, Syringe, Wrench, Wheat, Sparkles, History,
  Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];
type StockTransaction = Database['public']['Tables']['stock_transactions']['Row'];

const STOCK_CATEGORIES = [
  { value: 'feed_ingredients', label: 'Feed', icon: Wheat },
  { value: 'medications', label: 'Medications', icon: Pill },
  { value: 'vaccines', label: 'Vaccines', icon: Syringe },
  { value: 'supplements', label: 'Supplements', icon: Sparkles },
  { value: 'equipment', label: 'Equipment', icon: Wrench },
];

const CATEGORY_LABELS: Record<string, string> = {
  feed_ingredients: 'Feed Ingredients',
  medications: 'Medications',
  vaccines: 'Vaccines',
  supplements: 'Supplements',
  equipment: 'Equipment',
};

const UNIT_OPTIONS = ['kg', 'g', 'L', 'mL', 'bags', 'bottles', 'doses', 'pcs', 'rolls'];

export default function Stock() {
  const { user } = useAuth();
  const { costPrivacyEnabled, toggleCostPrivacy } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [activeTab, setActiveTab] = useState('feed_ingredients');

  // Add item modal
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState('feed_ingredients');
  const [addUnit, setAddUnit] = useState('kg');
  const [addQty, setAddQty] = useState('');
  const [addThreshold, setAddThreshold] = useState('10');
  const [addPrice, setAddPrice] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Purchase modal
  const [purchaseItem, setPurchaseItem] = useState<StockItem | null>(null);
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);

  // Usage/deduction modal
  const [usageItem, setUsageItem] = useState<StockItem | null>(null);
  const [usageQty, setUsageQty] = useState('');
  const [usageNotes, setUsageNotes] = useState('');
  const [usageSubmitting, setUsageSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);

      const [itemResult, txResult] = await Promise.all([
        supabase.from('stock_items').select('*').eq('farm_id', farm.id).order('name'),
        supabase.from('stock_transactions').select('*').eq('farm_id', farm.id).order('date', { ascending: false }).limit(50),
      ]);

      setItems(itemResult.data ?? []);
      setTransactions(txResult.data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  // ─── Derived data ───
  const lowStockItems = items.filter(i => Number(i.current_quantity) <= Number(i.reorder_threshold) && Number(i.reorder_threshold) > 0);
  const outOfStockItems = items.filter(i => Number(i.current_quantity) <= 0);
  const filteredItems = items.filter(i => i.category === activeTab);

  // Category counts for tab badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; low: number }> = {};
    STOCK_CATEGORIES.forEach(c => {
      const catItems = items.filter(i => i.category === c.value);
      counts[c.value] = {
        total: catItems.length,
        low: catItems.filter(i => Number(i.current_quantity) <= Number(i.reorder_threshold) && Number(i.reorder_threshold) > 0).length,
      };
    });
    return counts;
  }, [items]);

  // Total inventory value
  const totalValue = useMemo(() => {
    return items.reduce((sum, i) => sum + (Number(i.current_quantity) * Number(i.unit_price)), 0);
  }, [items]);

  // Recent purchase spend (30 days)
  const recentSpend = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    return transactions
      .filter(t => t.transaction_type === 'purchase' && new Date(t.date) >= cutoff)
      .reduce((sum, t) => sum + Number(t.total_cost), 0);
  }, [transactions]);

  // Purchase history chart (last 7 days)
  const purchaseChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayTotal = transactions
        .filter(t => t.date === dateStr && t.transaction_type === 'purchase')
        .reduce((s, t) => s + Number(t.total_cost), 0);
      data.push({ date: format(d, 'MMM d'), amount: parseFloat(dayTotal.toFixed(2)) });
    }
    return data;
  }, [transactions]);

  const mask = (v: number) => costPrivacyEnabled ? '****' : `GHS ${v.toFixed(2)}`;

  // ─── Add item ───
  const addItem = async () => {
    if (!farmId || !addName) return;
    setAddSubmitting(true);
    const qty = parseFloat(addQty) || 0;
    const price = parseFloat(addPrice) || 0;

    const { data, error } = await supabase.from('stock_items').insert({
      farm_id: farmId,
      name: addName,
      category: addCategory,
      unit: addUnit,
      current_quantity: qty,
      reorder_threshold: parseFloat(addThreshold) || 0,
      unit_price: price,
    }).select().single();

    if (error) { toast.error(error.message); setAddSubmitting(false); return; }

    // If initial qty > 0, log as opening stock transaction
    if (qty > 0 && data) {
      await supabase.from('stock_transactions').insert({
        stock_item_id: data.id,
        farm_id: farmId,
        transaction_type: 'purchase',
        quantity: qty,
        unit_price: price,
        total_cost: qty * price,
        notes: 'Opening stock',
      });
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'stock_added',
      description: `Added ${addName} to ${CATEGORY_LABELS[addCategory] || addCategory} inventory`,
    });

    setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAdd(false);
    setAddName('');
    setAddQty('');
    setAddPrice('');
    setAddThreshold('10');
    setAddSubmitting(false);
    toast.success(`${addName} added to inventory`);
  };

  // ─── Record purchase ───
  const recordPurchase = async () => {
    if (!farmId || !purchaseItem) return;
    const qty = parseFloat(purchaseQty) || 0;
    const price = parseFloat(purchasePrice) || 0;
    if (qty <= 0) { toast.error('Enter a valid quantity'); return; }
    setPurchaseSubmitting(true);

    const { data: tx, error: txError } = await supabase.from('stock_transactions').insert({
      stock_item_id: purchaseItem.id,
      farm_id: farmId,
      transaction_type: 'purchase',
      quantity: qty,
      unit_price: price,
      total_cost: qty * price,
      notes: purchaseNotes || null,
    }).select().single();

    if (txError) { toast.error(txError.message); setPurchaseSubmitting(false); return; }

    const newQty = Number(purchaseItem.current_quantity) + qty;
    await supabase.from('stock_items').update({
      current_quantity: newQty,
      unit_price: price > 0 ? price : purchaseItem.unit_price,
    }).eq('id', purchaseItem.id);

    // Auto-create expense
    const expCategory = purchaseItem.category === 'feed_ingredients' ? 'feed' :
      ['medications', 'vaccines', 'supplements'].includes(purchaseItem.category) ? 'health' : 'equipment';

    await supabase.from('expenses').insert({
      farm_id: farmId,
      category: expCategory,
      description: `Purchased ${qty} ${purchaseItem.unit} of ${purchaseItem.name}`,
      amount: qty * price,
      source: 'auto',
      source_ref: `stock_tx:${tx.id}`,
    });

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'stock_purchase',
      description: `Purchased ${qty} ${purchaseItem.unit} of ${purchaseItem.name} — GHS ${(qty * price).toFixed(2)}`,
    });

    // Update local state
    setItems(prev => prev.map(i => i.id === purchaseItem.id ? { ...i, current_quantity: newQty, unit_price: price > 0 ? price : Number(i.unit_price) } : i));
    setTransactions(prev => [tx, ...prev.slice(0, 49)]);
    setPurchaseItem(null);
    setPurchaseQty('');
    setPurchasePrice('');
    setPurchaseNotes('');
    setPurchaseSubmitting(false);
    toast.success(`Purchased ${qty} ${purchaseItem.unit} of ${purchaseItem.name}`);
  };

  // ─── Record usage/deduction ───
  const recordUsage = async () => {
    if (!farmId || !usageItem) return;
    const qty = parseFloat(usageQty) || 0;
    if (qty <= 0) { toast.error('Enter a valid quantity'); return; }
    if (qty > Number(usageItem.current_quantity)) { toast.error('Insufficient stock'); return; }
    setUsageSubmitting(true);

    const { data: tx, error: txError } = await supabase.from('stock_transactions').insert({
      stock_item_id: usageItem.id,
      farm_id: farmId,
      transaction_type: 'usage',
      quantity: qty,
      unit_price: Number(usageItem.unit_price),
      total_cost: qty * Number(usageItem.unit_price),
      notes: usageNotes || null,
    }).select().single();

    if (txError) { toast.error(txError.message); setUsageSubmitting(false); return; }

    const newQty = Math.max(0, Number(usageItem.current_quantity) - qty);
    await supabase.from('stock_items').update({ current_quantity: newQty }).eq('id', usageItem.id);

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'stock_usage',
      description: `Used ${qty} ${usageItem.unit} of ${usageItem.name}`,
    });

    setItems(prev => prev.map(i => i.id === usageItem.id ? { ...i, current_quantity: newQty } : i));
    setTransactions(prev => [tx, ...prev.slice(0, 49)]);
    setUsageItem(null);
    setUsageQty('');
    setUsageNotes('');
    setUsageSubmitting(false);

    // Low stock warning after deduction
    const threshold = Number(usageItem.reorder_threshold);
    if (newQty <= threshold && threshold > 0) {
      toast.warning(`⚠️ ${usageItem.name} is now below reorder threshold (${newQty} ${usageItem.unit} remaining)`, { duration: 5000 });
    } else {
      toast.success(`Used ${qty} ${usageItem.unit} of ${usageItem.name}`);
    }
  };

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleCostPrivacy}>
            {costPrivacyEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <Button className="gap-1.5 rounded-full" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* ═══ Inventory Summary Dashboard ═══ */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4 px-4">
          <div className="flex items-center gap-2 mb-3">
            <Boxes className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Inventory Overview</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-background p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-lg font-bold text-foreground">{items.length}</p>
              <p className="text-xs text-muted-foreground">
                {STOCK_CATEGORIES.filter(c => categoryCounts[c.value]?.total > 0).length} categories
              </p>
            </div>
            <div className={`rounded-lg p-2.5 text-center ${lowStockItems.length > 0 ? 'bg-yellow-50' : 'bg-background'}`}>
              <p className="text-xs text-muted-foreground">Low Stock</p>
              <p className={`text-lg font-bold ${lowStockItems.length > 0 ? 'text-yellow-700' : 'text-foreground'}`}>
                {lowStockItems.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {outOfStockItems.length > 0 ? `${outOfStockItems.length} out of stock` : 'All stocked'}
              </p>
            </div>
            <div className="rounded-lg bg-background p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Inventory Value</p>
              <p className="text-lg font-bold text-foreground">{mask(totalValue)}</p>
              <p className="text-xs text-muted-foreground">Current estimate</p>
            </div>
            <div className="rounded-lg bg-background p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Purchases (30d)</p>
              <p className="text-lg font-bold text-foreground">{mask(recentSpend)}</p>
              <p className="text-xs text-muted-foreground">
                {transactions.filter(t => t.transaction_type === 'purchase').length} orders
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Low Stock Alerts ═══ */}
      {lowStockItems.length > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-50 text-yellow-900">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-sm">Low Stock Alert — {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}</AlertTitle>
          <AlertDescription className="text-xs">
            <div className="mt-1 space-y-1">
              {lowStockItems.map(i => {
                const pct = Number(i.reorder_threshold) > 0
                  ? Math.min(100, (Number(i.current_quantity) / Number(i.reorder_threshold)) * 100) : 0;
                return (
                  <div key={i.id} className="flex items-center gap-2">
                    <span className="font-medium min-w-[100px] truncate">{i.name}</span>
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-[10px] shrink-0">
                      {Number(i.current_quantity).toFixed(1)}/{Number(i.reorder_threshold)} {i.unit}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 text-[10px] px-1.5 rounded-full"
                      onClick={() => { setPurchaseItem(i); setPurchasePrice(String(Number(i.unit_price))); }}
                    >
                      Restock
                    </Button>
                  </div>
                );
              })}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Out of stock critical alert */}
      {outOfStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Out of Stock</AlertTitle>
          <AlertDescription className="text-xs">
            {outOfStockItems.map(i => i.name).join(', ')} — restock immediately to avoid disruption.
          </AlertDescription>
        </Alert>
      )}

      {/* ═══ Category Tabs ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          {STOCK_CATEGORIES.map(c => {
            const Icon = c.icon;
            const count = categoryCounts[c.value];
            return (
              <TabsTrigger key={c.value} value={c.value} className="gap-1 text-xs relative">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{c.label}</span>
                {count?.low > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[9px] text-white">
                    {count.low}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {STOCK_CATEGORIES.map(cat => {
          const catItems = items.filter(i => i.category === cat.value);
          return (
            <TabsContent key={cat.value} value={cat.value} className="space-y-3 mt-4">
              {catItems.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">No {cat.label.toLowerCase()} in stock.</p>
                    <Button variant="outline" className="rounded-full gap-1" onClick={() => { setAddCategory(cat.value); setShowAdd(true); }}>
                      <Plus className="h-3.5 w-3.5" /> Add Item
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catItems.map(item => {
                    const qty = Number(item.current_quantity);
                    const threshold = Number(item.reorder_threshold);
                    const isLow = qty <= threshold && threshold > 0;
                    const isOut = qty <= 0;
                    const stockPct = threshold > 0 ? Math.min(100, (qty / (threshold * 2)) * 100) : 50;

                    return (
                      <Card key={item.id} className={isOut ? 'border-destructive/50' : isLow ? 'border-yellow-500/50' : ''}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground truncate">{item.name}</p>
                                {isOut && <Badge variant="destructive" className="text-[10px] h-4 px-1">OUT</Badge>}
                                {isLow && !isOut && <Badge className="text-[10px] h-4 px-1 bg-yellow-100 text-yellow-800 border-yellow-300">LOW</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Reorder at {threshold} {item.unit} • {mask(Number(item.unit_price))}/{item.unit}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xl font-bold ${isOut ? 'text-destructive' : isLow ? 'text-yellow-700' : 'text-foreground'}`}>
                                {qty.toFixed(1)}
                              </p>
                              <p className="text-xs text-muted-foreground">{item.unit}</p>
                            </div>
                          </div>

                          {/* Stock level bar */}
                          <div className="space-y-1">
                            <Progress
                              value={stockPct}
                              className={`h-1.5 ${isOut ? '[&>div]:bg-destructive' : isLow ? '[&>div]:bg-yellow-500' : ''}`}
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Value: {mask(qty * Number(item.unit_price))}</span>
                              <span>Updated {format(new Date(item.updated_at), 'MMM d')}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-full text-xs gap-1 h-8"
                              onClick={() => { setPurchaseItem(item); setPurchasePrice(String(Number(item.unit_price))); }}
                            >
                              <ArrowUpRight className="h-3 w-3" /> Purchase
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-full text-xs gap-1 h-8"
                              onClick={() => setUsageItem(item)}
                              disabled={qty <= 0}
                            >
                              <ArrowDownRight className="h-3 w-3" /> Use
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* ═══ Purchase Spending Chart ═══ */}
      {purchaseChartData.some(d => d.amount > 0) && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" /> Purchase Spend (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purchaseChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: number) => [costPrivacyEnabled ? '****' : `GHS ${value.toFixed(2)}`, 'Spend']}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Recent Transaction History ═══ */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {transactions.slice(0, 15).map(tx => {
                const item = items.find(i => i.id === tx.stock_item_id);
                const isPurchase = tx.transaction_type === 'purchase';
                return (
                  <div key={tx.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${
                        isPurchase ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {isPurchase ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium">{item?.name ?? 'Unknown'}</span>
                          <span className="text-muted-foreground"> — {Number(tx.quantity).toFixed(1)} {item?.unit ?? ''}</span>
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{format(new Date(tx.date), 'MMM d')}</span>
                          <span>•</span>
                          <span className="capitalize">{tx.transaction_type}</span>
                          {tx.notes && <><span>•</span><span className="truncate max-w-[80px]">{tx.notes}</span></>}
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-medium shrink-0 ${isPurchase ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {isPurchase ? mask(Number(tx.total_cost)) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Add Item Dialog ═══ */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock Item</DialogTitle>
            <DialogDescription>Add a new item to your inventory. Set a reorder threshold for low-stock alerts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Item Name</Label>
              <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="e.g., Maize, Amprolium, Layer Mash" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={addCategory} onValueChange={setAddCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STOCK_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select value={addUnit} onValueChange={setAddUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>Initial Qty</Label>
                <Input type="number" min="0" value={addQty} onChange={e => setAddQty(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Reorder At</Label>
                <Input type="number" min="0" value={addThreshold} onChange={e => setAddThreshold(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Price/Unit</Label>
                <Input type="number" min="0" step="0.01" value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="GHS" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addItem} disabled={addSubmitting || !addName}>
              {addSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Purchase Dialog ═══ */}
      <Dialog open={!!purchaseItem} onOpenChange={() => setPurchaseItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase {purchaseItem?.name}</DialogTitle>
            <DialogDescription>
              Record a stock purchase. Cost is auto-logged as an expense in Finance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {purchaseItem && (
              <div className="rounded-lg bg-muted p-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current stock</span>
                  <span className="font-medium">{Number(purchaseItem.current_quantity).toFixed(1)} {purchaseItem.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reorder at</span>
                  <span>{Number(purchaseItem.reorder_threshold)} {purchaseItem.unit}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Quantity ({purchaseItem?.unit})</Label>
                <Input type="number" min="0" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Unit Price (GHS)</Label>
                <Input type="number" min="0" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Input value={purchaseNotes} onChange={e => setPurchaseNotes(e.target.value)} placeholder="e.g., Supplier name" />
            </div>
            {purchaseQty && purchasePrice && parseFloat(purchaseQty) > 0 && parseFloat(purchasePrice) > 0 && (
              <div className="rounded-lg bg-muted p-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total cost</span>
                  <span className="font-medium">{mask(parseFloat(purchaseQty) * parseFloat(purchasePrice))}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>New stock level</span>
                  <span>{purchaseItem ? (Number(purchaseItem.current_quantity) + parseFloat(purchaseQty || '0')).toFixed(1) : '—'} {purchaseItem?.unit}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseItem(null)}>Cancel</Button>
            <Button onClick={recordPurchase} disabled={purchaseSubmitting || !purchaseQty}>
              {purchaseSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Usage/Deduction Dialog ═══ */}
      <Dialog open={!!usageItem} onOpenChange={() => setUsageItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use {usageItem?.name}</DialogTitle>
            <DialogDescription>
              Deduct stock for usage. This reduces the current quantity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {usageItem && (
              <div className="rounded-lg bg-muted p-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium">{Number(usageItem.current_quantity).toFixed(1)} {usageItem.unit}</span>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label>Quantity to Use ({usageItem?.unit})</Label>
              <Input
                type="number"
                min="0"
                max={usageItem ? Number(usageItem.current_quantity) : undefined}
                value={usageQty}
                onChange={e => setUsageQty(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Input value={usageNotes} onChange={e => setUsageNotes(e.target.value)} placeholder="e.g., Fed to Batch A" />
            </div>
            {usageQty && usageItem && parseFloat(usageQty) > 0 && (
              <div className="rounded-lg bg-muted p-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining after</span>
                  <span className={`font-medium ${
                    (Number(usageItem.current_quantity) - parseFloat(usageQty)) <= Number(usageItem.reorder_threshold)
                      ? 'text-yellow-700' : ''
                  }`}>
                    {Math.max(0, Number(usageItem.current_quantity) - parseFloat(usageQty)).toFixed(1)} {usageItem.unit}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsageItem(null)}>Cancel</Button>
            <Button onClick={recordUsage} disabled={usageSubmitting || !usageQty}>
              {usageSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deduct Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
