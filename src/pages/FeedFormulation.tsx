import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ShoppingBag, Beaker, FlaskConical, CalendarDays } from 'lucide-react';
import { ReadyMadeFeed } from '@/components/feed/ReadyMadeFeed';
import { CustomFormulation } from '@/components/feed/CustomFormulation';
import { ConcentrateMix } from '@/components/feed/ConcentrateMix';
import { getCurrentPhase } from '@/lib/feed-data';
import { getBatchAge } from '@/lib/batch-utils';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

type FeedMethod = 'select' | 'plan' | 'ready_made' | 'custom' | 'concentrate';

export default function FeedFormulation() {
  const { user, farmId } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [method, setMethod] = useState<FeedMethod>('select');
  const [loading, setLoading] = useState(true);

  // Planning step state
  const [targetKg, setTargetKg] = useState<number | undefined>(undefined);
  const [durationValue, setDurationValue] = useState(2);
  const [durationUnit, setDurationUnit] = useState<'weeks' | 'days'>('weeks');

  useEffect(() => {
    if (!farmId) return;
    supabase.from('batches').select('*').eq('farm_id', farmId).eq('status', 'active')
      .then(({ data }) => {
        setBatches(data ?? []);
        if (data?.length) setSelectedBatchId(data[0].id);
        setLoading(false);
      });
  }, [farmId]);

  const batch = batches.find(b => b.id === selectedBatchId);
  const dynamics = batch ? getBatchAge(batch.start_date, batch.species) : null;
  const phase = batch && dynamics ? getCurrentPhase(batch.species, dynamics.week) : undefined;

  // Planning computation
  const durationDays = durationUnit === 'weeks' ? durationValue * 7 : durationValue;
  const computedTargetKg = phase && batch
    ? Math.round((phase.feedPerBirdG * batch.current_population * durationDays / 1000) * 10) / 10
    : 0;
  const bagCount = computedTargetKg > 0 ? Math.ceil(computedTargetKg / 50) : 0;

  const handleDone = () => navigate('/feed');

  const handleConfirmPlan = () => {
    setTargetKg(computedTargetKg);
    setMethod('select');
  };

  const handleBack = () => {
    if (method === 'select') navigate('/feed');
    else if (method === 'plan') setMethod('select');
    else setMethod('select');
  };

  const titleMap: Record<FeedMethod, string> = {
    select: 'Feed Calculator',
    plan: 'Plan Your Feed',
    ready_made: 'Ready-Made Feed',
    custom: 'Custom Formulation',
    concentrate: 'Concentrate Mix',
  };

  const subtitleMap: Record<FeedMethod, string> = {
    select: 'Choose your feed method',
    plan: 'Set how much feed to prepare',
    ready_made: 'Record commercial feed purchase',
    custom: 'Create your own recipe — system optimizes or validates',
    concentrate: 'Mix concentrate with grains at your ratio',
  };

  if (loading) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  if (batches.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/feed')}><ArrowLeft className="h-4 w-4" /></Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No active batches. Create a batch first.</p>
            <Button className="rounded-full mt-4" onClick={() => navigate('/batches/new')}>Create Batch</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{titleMap[method]}</h1>
          <p className="text-sm text-muted-foreground">{subtitleMap[method]}</p>
        </div>
      </div>

      {/* Batch selector — visible on select and plan steps */}
      {(method === 'select' || method === 'plan') && (
        <div className="space-y-1">
          <Label className="text-sm font-medium">Select Batch</Label>
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger className="w-full max-w-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {batches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name} ({b.species} · {b.current_population} birds)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Planning step ── */}
      {method === 'plan' && batch && phase && dynamics && (
        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Phase badge */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Set how much feed to prepare. The system will pre-fill your formulation target.</p>
              <span className="text-xs font-semibold bg-muted rounded-full px-3 py-1 shrink-0 ml-2">
                {phase.name} — Week {dynamics.week}
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Per Bird / Day</p>
                <p className="text-2xl font-bold">{phase.feedPerBirdG}g</p>
                <p className="text-xs text-muted-foreground">{phase.name} phase</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Current Population</p>
                <p className="text-2xl font-bold">{batch.current_population}</p>
                <p className="text-xs text-muted-foreground">birds</p>
              </div>
            </div>

            {/* Duration input */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium whitespace-nowrap">Plan for</span>
              <Input
                type="number"
                min={1}
                max={durationUnit === 'weeks' ? 20 : 140}
                value={durationValue}
                onChange={e => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20"
              />
              <Select value={durationUnit} onValueChange={v => setDurationUnit(v as 'weeks' | 'days')}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weeks">weeks</SelectItem>
                  <SelectItem value="days">days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Result */}
            {computedTargetKg > 0 && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{computedTargetKg.toFixed(1)} kg</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  ≈ {bagCount} {bagCount === 1 ? 'bag' : 'bags'} of 50 kg &nbsp;·&nbsp; covers {durationDays} {durationDays === 1 ? 'day' : 'days'} for {batch.current_population} birds
                </p>
              </div>
            )}

            {/* Semi-intensive note */}
            {batch.production_system === 'semi_intensive' && (
              <p className="text-xs text-muted-foreground italic">
                For semi-intensive batches, record actual usage manually after feeding.
              </p>
            )}

            <Button className="w-full rounded-full" onClick={handleConfirmPlan} disabled={computedTargetKg <= 0}>
              Use This Target → Choose Method
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Method selection ── */}
      {method === 'select' && (
        <>
          {/* Plan Feed First button — shown when a batch is selected */}
          {batch && phase && (
            <Button
              variant="outline"
              className="w-full rounded-full gap-2 border-dashed"
              onClick={() => setMethod('plan')}
            >
              <CalendarDays className="h-4 w-4" />
              Plan Feed First (auto-compute target kg)
              {targetKg !== undefined && (
                <span className="ml-1 text-xs text-primary font-semibold">✓ {targetKg.toFixed(1)} kg set</span>
              )}
            </Button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setMethod('ready_made')}>
              <CardContent className="p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">Ready-Made Feed</h3>
                <p className="text-sm text-muted-foreground">Buy commercial feed — just record brand, bags, and price.</p>
                <p className="text-xs text-muted-foreground/70">Best for: Farmers who buy pre-mixed feed</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setMethod('custom')}>
              <CardContent className="p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FlaskConical className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">Custom Formulation</h3>
                <p className="text-sm text-muted-foreground">Select ingredients — system optimizes or validates your mix.</p>
                <p className="text-xs text-muted-foreground/70">Best for: Farmers who make their own feed</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setMethod('concentrate')}>
              <CardContent className="p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Beaker className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">Concentrate Mix</h3>
                <p className="text-sm text-muted-foreground">Mix concentrate with grains — set your ratio with a slider.</p>
                <p className="text-xs text-muted-foreground/70">Best for: Farmers using concentrate + grain</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ── Method-specific UIs ── */}
      {method === 'ready_made' && batch && farmId && (
        <ReadyMadeFeed batch={batch} phase={phase} week={dynamics?.week ?? 1} farmId={farmId} onDone={handleDone} targetKg={targetKg} />
      )}
      {method === 'custom' && batch && farmId && (
        <CustomFormulation batch={batch} phase={phase} week={dynamics?.week ?? 1} farmId={farmId} onDone={handleDone} targetKg={targetKg} />
      )}
      {method === 'concentrate' && batch && farmId && (
        <ConcentrateMix batch={batch} phase={phase} week={dynamics?.week ?? 1} farmId={farmId} onDone={handleDone} targetKg={targetKg} />
      )}
    </div>
  );
}
