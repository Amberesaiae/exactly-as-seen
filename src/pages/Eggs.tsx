import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Egg, Plus, TrendingUp, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getExpectedRate } from '@/lib/health-data';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type EggRecord = Database['public']['Tables']['egg_records']['Row'];

export default function Eggs() {
  const { user } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [records, setRecords] = useState<EggRecord[]>([]);

  // Collection form
  const [showCollect, setShowCollect] = useState(false);
  const [totalEggs, setTotalEggs] = useState('0');
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
  const [saleSubmitting, setSaleSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);
      // Only egg-laying species
      const { data: b } = await supabase.from('batches').select('*').eq('farm_id', farm.id).eq('status', 'active').in('species', ['layer', 'duck', 'turkey']);
      setBatches(b ?? []);
      if (b?.length) setSelectedBatch(b[0].id);
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!selectedBatch) return;
    supabase.from('egg_records').select('*').eq('batch_id', selectedBatch).order('date', { ascending: false }).limit(30).then(({ data }) => setRecords(data ?? []));
  }, [selectedBatch]);

  const batch = batches.find(b => b.id === selectedBatch);

  const recordCollection = async () => {
    if (!farmId || !selectedBatch) return;
    setEggSubmitting(true);
    const total = parseInt(totalEggs) || 0;
    const brk = parseInt(broken) || 0;
    const drt = parseInt(dirty) || 0;
    const good = Math.max(0, total - brk - drt);

    const { error } = await supabase.from('egg_records').insert({
      batch_id: selectedBatch,
      farm_id: farmId,
      total_eggs: total,
      broken: brk,
      dirty: drt,
      good,
      size_category: sizeCategory,
      notes: eggNotes || null,
    });

    if (error) { toast.error(error.message); setEggSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: selectedBatch,
      event_type: 'egg_collection',
      description: `Collected ${total} eggs (${good} good, ${brk} broken, ${drt} dirty)`,
    });

    setShowCollect(false);
    setTotalEggs('0');
    setBroken('0');
    setDirty('0');
    setEggNotes('');
    setEggSubmitting(false);
    // Reload
    const { data } = await supabase.from('egg_records').select('*').eq('batch_id', selectedBatch).order('date', { ascending: false }).limit(30);
    setRecords(data ?? []);
    toast.success('Collection recorded');
  };

  const recordSale = async () => {
    if (!farmId) return;
    setSaleSubmitting(true);
    const qty = parseInt(saleQty) || 0;
    const price = parseFloat(salePrice) || 0;
    const { error } = await supabase.from('egg_sales').insert({
      farm_id: farmId,
      quantity: qty,
      size_category: sizeCategory,
      unit_price: price,
      total_amount: qty * price,
      buyer: saleBuyer || null,
    });
    if (error) { toast.error(error.message); setSaleSubmitting(false); return; }

    // Auto-create revenue record
    await supabase.from('revenue').insert({
      farm_id: farmId,
      batch_id: selectedBatch || null,
      category: 'egg_sales',
      description: `Egg sale: ${qty} eggs`,
      amount: qty * price,
      buyer: saleBuyer || null,
    });

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'egg_sale',
      description: `Sold ${qty} eggs${saleBuyer ? ` to ${saleBuyer}` : ''}`,
    });

    setShowSale(false);
    setSaleQty('30');
    setSalePrice('');
    setSaleBuyer('');
    setSaleSubmitting(false);
    toast.success('Sale recorded');
  };

  const productionRate = batch && batch.current_population > 0 && records.length > 0
    ? ((records[0].total_eggs / batch.current_population) * 100).toFixed(1)
    : '0.0';

  const expectedRate = batch ? getExpectedRate(batch.species, batch.current_week) : null;
  const mask = (v: string) => costPrivacyEnabled ? '****' : v;

  const chartData = records.slice().reverse().map(r => ({
    date: format(new Date(r.date), 'MMM d'),
    eggs: r.total_eggs,
    good: r.good,
  }));

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Egg Production</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5 rounded-full" onClick={() => setShowSale(true)}>
            <ShoppingCart className="h-4 w-4" /> Record Sale
          </Button>
          <Button className="gap-1.5 rounded-full" onClick={() => setShowCollect(true)}>
            <Plus className="h-4 w-4" /> Collect
          </Button>
        </div>
      </div>

      {batches.length > 0 && (
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.species})</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Egg className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No egg-laying batches. Create a layer, duck, or turkey batch first.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{productionRate}%</p>
              <p className="text-xs text-muted-foreground">Today's Rate</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <Egg className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{records[0]?.total_eggs ?? 0}</p>
              <p className="text-xs text-muted-foreground">Last Collection</p>
            </CardContent></Card>
            {expectedRate && (
              <Card><CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{expectedRate.min}-{expectedRate.max}%</p>
                <p className="text-xs text-muted-foreground">Expected Range</p>
              </CardContent></Card>
            )}
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Production Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip />
                    <Line type="monotone" dataKey="eggs" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="good" stroke="hsl(var(--success))" strokeWidth={2} name="Good" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Recent Collections</CardTitle></CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No collections yet.</p>
              ) : (
                <div className="space-y-2">
                  {records.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <span className="font-medium">{r.total_eggs} eggs</span>
                        <span className="text-muted-foreground ml-2">({r.good} good, {r.broken} broken, {r.dirty} dirty)</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(r.date), 'MMM d')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Collection Dialog */}
      <Dialog open={showCollect} onOpenChange={setShowCollect}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Egg Collection</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label>Total</Label><Input type="number" min="0" value={totalEggs} onChange={e => setTotalEggs(e.target.value)} /></div>
              <div className="space-y-1"><Label>Broken</Label><Input type="number" min="0" value={broken} onChange={e => setBroken(e.target.value)} /></div>
              <div className="space-y-1"><Label>Dirty</Label><Input type="number" min="0" value={dirty} onChange={e => setDirty(e.target.value)} /></div>
            </div>
            <div className="space-y-1">
              <Label>Size</Label>
              <Select value={sizeCategory} onValueChange={setSizeCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={eggNotes} onChange={e => setEggNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollect(false)}>Cancel</Button>
            <Button onClick={recordCollection} disabled={eggSubmitting}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sale Dialog */}
      <Dialog open={showSale} onOpenChange={setShowSale}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Egg Sale</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Quantity</Label><Input type="number" min="1" value={saleQty} onChange={e => setSaleQty(e.target.value)} /></div>
              <div className="space-y-1"><Label>Price Each</Label><Input type="number" min="0" step="0.01" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="GHS" /></div>
            </div>
            <div className="space-y-1"><Label>Buyer (optional)</Label><Input value={saleBuyer} onChange={e => setSaleBuyer(e.target.value)} placeholder="Name" /></div>
            {salePrice && saleQty && <p className="text-sm font-medium">Total: {mask(`GHS ${(parseInt(saleQty) * parseFloat(salePrice)).toFixed(2)}`)}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSale(false)}>Cancel</Button>
            <Button onClick={recordSale} disabled={saleSubmitting}>Record Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
