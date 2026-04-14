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
import { Package, Plus, AlertTriangle, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];

const STOCK_CATEGORIES = [
  { value: 'feed_ingredients', label: 'Feed Ingredients' },
  { value: 'medications', label: 'Medications' },
  { value: 'vaccines', label: 'Vaccines' },
  { value: 'supplements', label: 'Supplements' },
  { value: 'equipment', label: 'Equipment' },
];

export default function Stock() {
  const { user } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);
  const [activeTab, setActiveTab] = useState('feed_ingredients');

  // Add item modal
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState('feed_ingredients');
  const [addUnit, setAddUnit] = useState('kg');
  const [addQty, setAddQty] = useState('0');
  const [addThreshold, setAddThreshold] = useState('10');
  const [addPrice, setAddPrice] = useState('0');
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Purchase modal
  const [purchaseItem, setPurchaseItem] = useState<StockItem | null>(null);
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);
      const { data } = await supabase.from('stock_items').select('*').eq('farm_id', farm.id).order('name');
      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const lowStockItems = items.filter(i => Number(i.current_quantity) <= Number(i.reorder_threshold));
  const filteredItems = items.filter(i => i.category === activeTab);

  const mask = (v: number) => costPrivacyEnabled ? '****' : `GHS ${v.toFixed(2)}`;

  const addItem = async () => {
    if (!farmId) return;
    setAddSubmitting(true);
    const { error } = await supabase.from('stock_items').insert({
      farm_id: farmId,
      name: addName,
      category: addCategory,
      unit: addUnit,
      current_quantity: parseFloat(addQty) || 0,
      reorder_threshold: parseFloat(addThreshold) || 0,
      unit_price: parseFloat(addPrice) || 0,
    });
    if (error) { toast.error(error.message); setAddSubmitting(false); return; }
    setShowAdd(false);
    setAddName('');
    setAddQty('0');
    setAddSubmitting(false);
    const { data } = await supabase.from('stock_items').select('*').eq('farm_id', farmId).order('name');
    setItems(data ?? []);
    toast.success('Item added');
  };

  const recordPurchase = async () => {
    if (!farmId || !purchaseItem) return;
    setPurchaseSubmitting(true);
    const qty = parseFloat(purchaseQty) || 0;
    const price = parseFloat(purchasePrice) || 0;

    const { error: txError } = await supabase.from('stock_transactions').insert({
      stock_item_id: purchaseItem.id,
      farm_id: farmId,
      transaction_type: 'purchase',
      quantity: qty,
      unit_price: price,
      total_cost: qty * price,
    });
    if (txError) { toast.error(txError.message); setPurchaseSubmitting(false); return; }

    const newQty = Number(purchaseItem.current_quantity) + qty;
    await supabase.from('stock_items').update({ current_quantity: newQty, unit_price: price }).eq('id', purchaseItem.id);

    // Auto-create expense
    await supabase.from('expenses').insert({
      farm_id: farmId,
      category: purchaseItem.category === 'feed_ingredients' ? 'feed' : 'health',
      description: `Purchased ${qty} ${purchaseItem.unit} of ${purchaseItem.name}`,
      amount: qty * price,
      source: 'auto',
      source_ref: `stock:${purchaseItem.id}`,
    });

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'stock_purchase',
      description: `Purchased ${qty} ${purchaseItem.unit} of ${purchaseItem.name}`,
    });

    setPurchaseItem(null);
    setPurchaseQty('');
    setPurchasePrice('');
    setPurchaseSubmitting(false);
    const { data } = await supabase.from('stock_items').select('*').eq('farm_id', farmId).order('name');
    setItems(data ?? []);
    toast.success('Purchase recorded');
  };

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Stock</h1>
        <Button className="gap-1.5 rounded-full" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Low Stock Alert</p>
              <p className="text-sm text-muted-foreground">
                {lowStockItems.map(i => i.name).join(', ')} {lowStockItems.length === 1 ? 'is' : 'are'} below reorder threshold.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          {STOCK_CATEGORIES.map(c => (
            <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>
          ))}
        </TabsList>

        {STOCK_CATEGORIES.map(cat => (
          <TabsContent key={cat.value} value={cat.value}>
            {filteredItems.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">No {cat.label.toLowerCase()} in stock.</p>
                  <Button variant="outline" className="mt-4 rounded-full" onClick={() => { setAddCategory(cat.value); setShowAdd(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map(item => {
                  const low = Number(item.current_quantity) <= Number(item.reorder_threshold);
                  return (
                    <Card key={item.id} className={low ? 'border-warning' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.unit} | Reorder at {Number(item.reorder_threshold)}</p>
                          </div>
                          {low && <AlertTriangle className="h-4 w-4 text-warning" />}
                        </div>
                        <p className="text-2xl font-bold">{Number(item.current_quantity).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Unit price: {mask(Number(item.unit_price))}</p>
                        <Button variant="outline" size="sm" className="mt-3 w-full rounded-full text-xs gap-1" onClick={() => setPurchaseItem(item)}>
                          <ShoppingCart className="h-3 w-3" /> Record Purchase
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Stock Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="e.g., Maize" /></div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={addCategory} onValueChange={setAddCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STOCK_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label>Unit</Label><Input value={addUnit} onChange={e => setAddUnit(e.target.value)} /></div>
              <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={addQty} onChange={e => setAddQty(e.target.value)} /></div>
              <div className="space-y-1"><Label>Reorder At</Label><Input type="number" value={addThreshold} onChange={e => setAddThreshold(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Unit Price (GHS)</Label><Input type="number" step="0.01" value={addPrice} onChange={e => setAddPrice(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addItem} disabled={addSubmitting || !addName}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={!!purchaseItem} onOpenChange={() => setPurchaseItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Purchase {purchaseItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Quantity ({purchaseItem?.unit})</Label><Input type="number" min="0" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)} /></div>
            <div className="space-y-1"><Label>Unit Price (GHS)</Label><Input type="number" min="0" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} /></div>
            {purchaseQty && purchasePrice && <p className="text-sm font-medium">Total: {mask(parseFloat(purchaseQty) * parseFloat(purchasePrice))}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseItem(null)}>Cancel</Button>
            <Button onClick={recordPurchase} disabled={purchaseSubmitting || !purchaseQty}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
