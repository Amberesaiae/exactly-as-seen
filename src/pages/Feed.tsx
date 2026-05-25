import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Calculator, Plus, CheckCircle2, Circle, Loader2, TrendingUp, AlertTriangle, X, Wheat } from 'lucide-react';
import { toast } from 'sonner';
import { FEED_PHASES, getCurrentPhase, COMMERCIAL_FEED_TYPES } from '@/lib/feed-data';
import { getBatchAge } from '@/lib/batch-utils';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type FeedSchedule = Database['public']['Tables']['feed_schedules']['Row'];
type Formulation = Database['public']['Tables']['feed_formulations']['Row'];

export default function Feed() {
  const { user } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [farmId, setFarmId] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [schedules, setSchedules] = useState<FeedSchedule[]>([]);

  // Log feed dialog
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [logAmountKg, setLogAmountKg] = useState('');

  // Phase transition alert
  const [phaseAlertDismissed, setPhaseAlertDismissed] = useState(false);
  const [logSaving, setLogSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).order('setup_complete', { ascending: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);

      const [batchResult, formulationResult] = await Promise.all([
        supabase.from('batches').select('*').eq('farm_id', farm.id).eq('status', 'active'),
        supabase.from('feed_formulations').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false }).limit(10),
      ]);

      setBatches(batchResult.data ?? []);
      setFormulations(formulationResult.data ?? []);
      if (batchResult.data?.length) setSelectedBatch(batchResult.data[0].id);
      setLoading(false);
    };
    load();
  }, [user]);

  // Load feed schedules when batch changes
  useEffect(() => {
    if (!selectedBatch || !farmId) { setSchedules([]); return; }
    supabase
      .from('feed_schedules')
      .select('*')
      .eq('batch_id', selectedBatch)
      .order('day', { ascending: false })
      .limit(14)
      .then(({ data }) => setSchedules(data ?? []));
  }, [selectedBatch, farmId]);

  const batch = batches.find(b => b.id === selectedBatch);
  const dynamics = batch ? getBatchAge(batch.start_date, batch.species) : null;
  const phase = batch && dynamics ? getCurrentPhase(batch.species, dynamics.week) : null;

  // Phase transition detection (client-side, no API call)
  const lastSchedule = schedules[0] ?? null; // ordered day DESC
  const phaseTransitionDetected = !!(lastSchedule && phase &&
    lastSchedule.amount_per_bird_g !== phase.feedPerBirdG);
  const previousFeedPerBirdG = lastSchedule?.amount_per_bird_g ?? null;

  const todaySchedule = schedules.find(s => s.day === (dynamics?.day ?? 0));
  const dailyTotalKg = phase && batch ? (phase.feedPerBirdG * batch.current_population) / 1000 : 0;

  const handleMarkFed = async (schedule: FeedSchedule) => {
    const { error } = await supabase
      .from('feed_schedules')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', schedule.id);
    if (error) {
      toast.error(error.message);
    } else {
      setSchedules(prev => prev.map(s => s.id === schedule.id ? { ...s, completed: true, completed_at: new Date().toISOString() } : s));
      toast.success('Marked as fed');

      // Auto inventory deduction if intensive
      const isIntensive = batch?.production_system === 'intensive';
      if (isIntensive && schedule.total_amount_kg > 0 && farmId) {
        // Find matching finished feed stock item
        const { data: stockItems } = await supabase
          .from('stock_items')
          .select('*')
          .eq('farm_id', farmId);

        if (stockItems && stockItems.length > 0) {
          const feedType = COMMERCIAL_FEED_TYPES.find(f => 
            f.species.includes(batch.species) && 
            f.phase === phase?.name.toLowerCase()
          );

          let matchedStock = stockItems.find(item => 
            item.category === 'feed' && 
            phase && item.name.toLowerCase().includes(phase.name.toLowerCase())
          );

          if (!matchedStock && feedType) {
            matchedStock = stockItems.find(item => 
              item.name.toLowerCase().includes(feedType.label.split('(')[0].trim().toLowerCase())
            );
          }

          if (!matchedStock && phase) {
            matchedStock = stockItems.find(item => 
              item.name.toLowerCase().includes(phase.name.toLowerCase())
            );
          }

          if (!matchedStock) {
            matchedStock = stockItems.find(item => item.category === 'feed');
          }

          if (matchedStock) {
            const { error: allocError } = await (supabase as any).rpc('allocate_fifo_by_quality', {
              p_farm_id: farmId,
              p_stock_item_id: matchedStock.id,
              p_qty_needed: schedule.total_amount_kg,
              p_batch_id: selectedBatch,
              p_reason: `Auto-deduction for feed schedule complete: Day ${schedule.day}`,
              p_source_ref: schedule.id
            });

            if (allocError) {
              console.error('Failed to allocate stock for feed mark fed:', allocError);
            } else {
              const newStockQty = Math.max(0, Number(matchedStock.current_quantity) - schedule.total_amount_kg);
              await supabase.from('stock_items')
                .update({
                  current_quantity: newStockQty,
                  updated_at: new Date().toISOString()
                })
                .eq('id', matchedStock.id);
            }
          }
        }
      }
    }
  };

  const handleLogFeed = async () => {
    if (!farmId || !selectedBatch || !dynamics || !phase) return;
    const amount = parseFloat(logAmountKg);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }

    setLogSaving(true);
    const { data, error } = await supabase.from('feed_schedules').insert({
      farm_id: farmId,
      batch_id: selectedBatch,
      week: dynamics.week,
      day: dynamics.day,
      amount_per_bird_g: phase.feedPerBirdG,
      total_amount_kg: amount,
      completed: true,
      completed_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      toast.error(error.message);
    } else {
      setSchedules(prev => [data, ...prev]);
      toast.success('Feed logged');
      setShowLogDialog(false);
      setLogAmountKg('');

      // Auto inventory deduction if intensive
      const isIntensive = batch?.production_system === 'intensive';
      if (isIntensive) {
        const { data: stockItems } = await supabase
          .from('stock_items')
          .select('*')
          .eq('farm_id', farmId);

        if (stockItems && stockItems.length > 0) {
          const feedType = COMMERCIAL_FEED_TYPES.find(f => 
            f.species.includes(batch.species) && 
            f.phase === phase.name.toLowerCase()
          );

          let matchedStock = stockItems.find(item => 
            item.category === 'feed' && 
            item.name.toLowerCase().includes(phase.name.toLowerCase())
          );

          if (!matchedStock && feedType) {
            matchedStock = stockItems.find(item => 
              item.name.toLowerCase().includes(feedType.label.split('(')[0].trim().toLowerCase())
            );
          }

          if (!matchedStock) {
            matchedStock = stockItems.find(item => 
              item.name.toLowerCase().includes(phase.name.toLowerCase())
            );
          }

          if (!matchedStock) {
            matchedStock = stockItems.find(item => item.category === 'feed');
          }

          if (matchedStock) {
            const { error: allocError } = await (supabase as any).rpc('allocate_fifo_by_quality', {
              p_farm_id: farmId,
              p_stock_item_id: matchedStock.id,
              p_qty_needed: amount,
              p_batch_id: selectedBatch,
              p_reason: `Auto-deduction for logged feed: Day ${dynamics.day}`,
              p_source_ref: data.id
            });

            if (allocError) {
              console.error('Failed to allocate stock for feed log:', allocError);
              toast.error(`Feed stock allocation failed: ${allocError.message}`);
            } else {
              const newStockQty = Math.max(0, Number(matchedStock.current_quantity) - amount);
              await supabase.from('stock_items')
                .update({
                  current_quantity: newStockQty,
                  updated_at: new Date().toISOString()
                })
                .eq('id', matchedStock.id);
            }
          }
        }
      }
    }
    setLogSaving(false);
  };

  const mask = (v: string) => costPrivacyEnabled ? '••••' : v;

  if (loading) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Feed Lab</h1>
        <Button className="gap-1.5 rounded-full" asChild>
          <Link to="/feed/formulate"><Calculator className="h-4 w-4" /> Formulate</Link>
        </Button>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calculator className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold mb-1">No active batches</h3>
            <p className="text-sm text-muted-foreground mb-4">Create a batch first to use the feed calculator.</p>
            <Button className="rounded-full" asChild><Link to="/batches/new"><Plus className="h-4 w-4 mr-1" /> Create Batch</Link></Button>
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
                {batches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name} ({b.species})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phase transition alert */}
          {phaseTransitionDetected && !phaseAlertDismissed && phase && previousFeedPerBirdG !== null && (
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
              <Wheat className="h-4 w-4 text-amber-600" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <AlertTitle className="text-amber-800 dark:text-amber-300">
                    🌾 Feed Phase Changed — {phase.name} Phase
                  </AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400 mt-1">
                    New consumption rate: <strong>{phase.feedPerBirdG}g</strong> / bird / day
                    {' '}(was {previousFeedPerBirdG}g)
                  </AlertDescription>
                  <Button
                    size="sm"
                    className="mt-2 rounded-full h-7 text-xs gap-1"
                    asChild
                  >
                    <Link to="/feed/formulate">Plan {phase.name} Feed →</Link>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-amber-600 hover:text-amber-800"
                  onClick={() => setPhaseAlertDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          )}

          {/* Current phase info */}
          {batch && phase && dynamics && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Current Phase</span>
                  <Badge variant="secondary" className="capitalize">{phase.name} — Week {dynamics.week}, Day {dynamics.day}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-muted-foreground text-xs">Protein Target</p>
                    <p className="font-bold text-lg">{phase.proteinPct}%</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-muted-foreground text-xs">Energy Target</p>
                    <p className="font-bold text-lg">{phase.energyKcal}</p>
                    <p className="text-xs text-muted-foreground">kcal/kg</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-muted-foreground text-xs">Per Bird/Day</p>
                    <p className="font-bold text-lg">{phase.feedPerBirdG}g</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-3">
                    <p className="text-muted-foreground text-xs">Daily Total</p>
                    <p className="font-bold text-lg text-primary">{dailyTotalKg.toFixed(1)} kg</p>
                    <p className="text-xs text-muted-foreground">{batch.current_population} birds</p>
                  </div>
                </div>

                {/* Log feed button */}
                <div className="mt-4 flex gap-2">
                  <Button
                    className="rounded-full gap-1.5 flex-1"
                    onClick={() => {
                      setLogAmountKg(dailyTotalKg.toFixed(1));
                      setShowLogDialog(true);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Log Today's Feed
                  </Button>
                </div>

                {todaySchedule?.completed && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Today's feed already logged ({todaySchedule.total_amount_kg} kg)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Feed history */}
          {schedules.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Feed Log (Last 14 entries)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {schedules.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                      <div className="flex items-center gap-2">
                        {s.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span>Day {s.day} (Week {s.week})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{s.total_amount_kg} kg</span>
                        {!s.completed && (
                          <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" onClick={() => handleMarkFed(s)}>
                            Mark Fed
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent formulations */}
          {formulations.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Formulations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formulations.map(f => (
                    <div key={f.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <span className="font-medium capitalize">{f.species} — {f.phase}</span>
                        <span className="text-muted-foreground ml-2">{f.total_kg}kg ({f.bags_count} bags)</span>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs">{f.formulation_type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Log Feed Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Feed</DialogTitle>
            <DialogDescription>
              Record the amount of feed given today for {batch?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Amount (kg)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={logAmountKg}
                onChange={e => setLogAmountKg(e.target.value)}
                placeholder={`Recommended: ${dailyTotalKg.toFixed(1)} kg`}
              />
              {phase && (
                <p className="text-xs text-muted-foreground">
                  Recommended: {dailyTotalKg.toFixed(1)} kg ({batch?.current_population} birds × {phase.feedPerBirdG}g)
                </p>
              )}
            </div>
            {parseFloat(logAmountKg) > dailyTotalKg * 1.3 && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Amount is 30%+ above recommended — double-check</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>Cancel</Button>
            <Button onClick={handleLogFeed} disabled={logSaving}>
              {logSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Feed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
