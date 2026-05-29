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
import { ArrowLeft, ShoppingBag, Beaker, FlaskConical, CalendarDays, Leaf, Lightbulb } from 'lucide-react';
import { ReadyMadeFeed } from '@/components/feed/ReadyMadeFeed';
import { CustomFormulation } from '@/components/feed/CustomFormulation';
import { ConcentrateMix } from '@/components/feed/ConcentrateMix';
import { getCurrentPhase, FORAGING_MODIFIERS } from '@/lib/feed-data';
import { getBatchAge } from '@/lib/batch-utils';
import type { Database } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { useFeedData } from '@/hooks/feed/useFeedData';

type Batch = Database['public']['Tables']['batches']['Row'];

type FeedMethod = 'select' | 'plan' | 'ready_made' | 'custom' | 'concentrate';

export default function FeedFormulation() {
  const { farmId } = useAuth();
  const navigate = useNavigate();
  const { batches, loading, recipes } = useFeedData();
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [method, setMethod] = useState<FeedMethod>('select');

  // Planning step state
  const [targetKg, setTargetKg] = useState<number | undefined>(undefined);
  const [durationValue, setDurationValue] = useState(2);
  const [durationUnit, setDurationUnit] = useState<'weeks' | 'days'>('weeks');

  useEffect(() => {
    if (batches.length && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const batch = batches.find(b => b.id === selectedBatchId);
  const dynamics = batch ? getBatchAge(batch.start_date, batch.species) : null;
  const phase = batch && dynamics ? getCurrentPhase(batch.species, dynamics.week) : undefined;

  // Planning computation
  const durationDays = durationUnit === 'weeks' ? durationValue * 7 : durationValue;
  const isSemiIntensive = batch?.production_system === 'semi_intensive' || batch?.production_system === 'free_range' || batch?.production_system === 'pasture';
  const foragingModifier = (isSemiIntensive && batch) ? (FORAGING_MODIFIERS[batch.species] || 0) : 0;
  
  const computedTargetKg = phase && batch
    ? Math.round((phase.feedPerBirdG * batch.current_population * durationDays / 1000) * 10) / 10
    : 0;
    
  const reductionPotentialKg = Math.round(computedTargetKg * foragingModifier * 10) / 10;
  const reducedTargetKg = Math.round((computedTargetKg - reductionPotentialKg) * 10) / 10;
  
  const bagCount = computedTargetKg > 0 ? Math.ceil(computedTargetKg / 50) : 0;

  const handleDone = () => navigate('/feed');

  const handleConfirmPlan = (kg: number) => {
    setTargetKg(kg);
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

      {method === 'plan' && batch && phase && dynamics && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Set how much feed to prepare.</p>
              <span className="text-xs font-semibold bg-muted rounded-full px-3 py-1 shrink-0 ml-2">
                {phase.name} — Week {dynamics.week}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Per Bird / Day</p>
                <p className="text-2xl font-bold">{phase.feedPerBirdG}g</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Flock Size</p>
                <p className="text-2xl font-bold">{batch.current_population}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Plan for</span>
              <Input
                type="number"
                min={1}
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

            {computedTargetKg > 0 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Intensive Baseline</p>
                      <p className="text-3xl font-black text-blue-700">{computedTargetKg.toFixed(1)} kg</p>
                    </div>
                    <Button className="rounded-full bg-blue-600 hover:bg-blue-700" onClick={() => handleConfirmPlan(computedTargetKg)}>Use Full</Button>
                  </div>
                </div>

                {isSemiIntensive && reductionPotentialKg > 0 && (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-green-700 font-bold uppercase tracking-wider">Lean Logic Target</p>
                        <p className="text-2xl font-black text-green-800">{reducedTargetKg.toFixed(1)} kg</p>
                      </div>
                      <Button variant="outline" className="rounded-full border-green-300 text-green-700" onClick={() => handleConfirmPlan(reducedTargetKg)}>Use Lean</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {method === 'select' && (
        <>
          {batch && phase && (
            <Button variant="outline" className="w-full rounded-full gap-2 border-dashed" onClick={() => setMethod('plan')}>
              <CalendarDays className="h-4 w-4" /> Plan Feed First
              {targetKg !== undefined && <span className="ml-1 text-xs text-primary font-semibold">✓ {targetKg.toFixed(1)} kg</span>}
            </Button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:border-primary/50 group" onClick={() => setMethod('ready_made')}>
              <CardContent className="p-6 text-center space-y-3">
                <ShoppingBag className="mx-auto h-6 w-6 text-primary" />
                <h3 className="font-bold">Ready-Made</h3>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 group" onClick={() => setMethod('custom')}>
              <CardContent className="p-6 text-center space-y-3">
                <FlaskConical className="mx-auto h-6 w-6 text-primary" />
                <h3 className="font-bold">Custom</h3>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 group" onClick={() => setMethod('concentrate')}>
              <CardContent className="p-6 text-center space-y-3">
                <Beaker className="mx-auto h-6 w-6 text-primary" />
                <h3 className="font-bold">Concentrate</h3>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {method === 'ready_made' && batch && farmId && (
        <ReadyMadeFeed batch={batch} phase={phase} week={dynamics?.week ?? 1} farmId={farmId} onDone={handleDone} targetKg={targetKg} />
      )}
      {method === 'custom' && batch && farmId && (
        <CustomFormulation batch={batch} phase={phase} week={dynamics?.week ?? 1} farmId={farmId} onDone={handleDone} targetKg={targetKg} recipes={recipes} />
      )}
      {method === 'concentrate' && batch && farmId && (
        <ConcentrateMix batch={batch} phase={phase} week={dynamics?.week ?? 1} farmId={farmId} onDone={handleDone} targetKg={targetKg} />
      )}
    </div>
  );
}
