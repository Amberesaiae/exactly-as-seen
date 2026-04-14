import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { FEED_PHASES, getCurrentPhase } from '@/lib/feed-data';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

export default function Feed() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [formulations, setFormulations] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle();
      if (!farm) { setLoading(false); return; }

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

  const batch = batches.find(b => b.id === selectedBatch);
  const phase = batch ? getCurrentPhase(batch.species, batch.current_week) : null;

  if (loading) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Feed Calculator</h1>
        <Button className="gap-1.5 rounded-full" asChild>
          <Link to="/feed/formulate"><Calculator className="h-4 w-4" /> New Formulation</Link>
        </Button>
      </div>

      {batches.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Active Batch</label>
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {batches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name} ({b.species})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {batch && phase && (
        <Card>
          <CardHeader><CardTitle className="text-base">Current Feed Phase</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Phase</p>
                <p className="font-semibold">{phase.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Protein</p>
                <p className="font-semibold">{phase.proteinPct}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Energy</p>
                <p className="font-semibold">{phase.energyKcal} kcal</p>
              </div>
              <div>
                <p className="text-muted-foreground">Feed/Bird/Day</p>
                <p className="font-semibold">{phase.feedPerBirdG}g</p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium">Daily Total: <span className="text-primary">{((phase.feedPerBirdG * batch.current_population) / 1000).toFixed(1)} kg</span></p>
              <p className="text-muted-foreground">{batch.current_population} birds × {phase.feedPerBirdG}g</p>
            </div>
          </CardContent>
        </Card>
      )}

      {batches.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calculator className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold mb-1">No active batches</h3>
            <p className="text-sm text-muted-foreground mb-4">Create a batch first to use the feed calculator.</p>
            <Button className="rounded-full" asChild><Link to="/batches/new"><Plus className="h-4 w-4" /> Create Batch</Link></Button>
          </CardContent>
        </Card>
      )}

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
                  <span className="text-xs text-muted-foreground capitalize">{f.formulation_type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
