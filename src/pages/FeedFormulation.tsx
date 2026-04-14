import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ShoppingBag, Beaker, FlaskConical } from 'lucide-react';
import { ReadyMadeFeed } from '@/components/feed/ReadyMadeFeed';
import { CustomFormulation } from '@/components/feed/CustomFormulation';
import { ConcentrateMix } from '@/components/feed/ConcentrateMix';
import { getCurrentPhase } from '@/lib/feed-data';
import { getBatchAge } from '@/lib/batch-utils';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

type FeedMethod = 'select' | 'ready_made' | 'custom' | 'concentrate';

export default function FeedFormulation() {
  const { user, farmId } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [method, setMethod] = useState<FeedMethod>('select');
  const [loading, setLoading] = useState(true);

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

  const handleDone = () => navigate('/feed');

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
        <Button variant="ghost" size="icon" onClick={() => method === 'select' ? navigate('/feed') : setMethod('select')} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {method === 'select' && 'Feed Calculator'}
            {method === 'ready_made' && 'Ready-Made Feed'}
            {method === 'custom' && 'Custom Formulation'}
            {method === 'concentrate' && 'Concentrate Mix'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {method === 'select' && 'Choose your feed method'}
            {method === 'ready_made' && 'Record commercial feed purchase'}
            {method === 'custom' && 'Create your own recipe — system optimizes or validates'}
            {method === 'concentrate' && 'Mix concentrate with grains at your ratio'}
          </p>
        </div>
      </div>

      {/* Batch selector — always visible */}
      {method === 'select' && (
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

      {/* Method selection */}
      {method === 'select' && (
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
      )}

      {/* Method-specific UIs */}
      {method === 'ready_made' && batch && farmId && (
        <ReadyMadeFeed batch={batch} phase={phase} week={dynamics?.week ?? 1} farmId={farmId} onDone={handleDone} />
      )}
      {method === 'custom' && batch && farmId && (
        <CustomFormulation batch={batch} phase={phase} week={dynamics?.week ?? 1} farmId={farmId} onDone={handleDone} />
      )}
      {method === 'concentrate' && batch && farmId && (
        <ConcentrateMix batch={batch} phase={phase} week={dynamics?.week ?? 1} farmId={farmId} onDone={handleDone} />
      )}
    </div>
  );
}
