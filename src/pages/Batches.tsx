import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getBatchAge } from '@/lib/batch-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Layers, Eye, Skull } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

export default function Batches() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  // Mortality modal
  const [mortalityBatch, setMortalityBatch] = useState<Batch | null>(null);
  const [mortalityCount, setMortalityCount] = useState('1');
  const [mortalityCause, setMortalityCause] = useState('');
  const [mortalityNotes, setMortalityNotes] = useState('');
  const [mortalitySubmitting, setMortalitySubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);

      let query = supabase.from('batches').select('*').eq('farm_id', farm.id);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (speciesFilter !== 'all') query = query.eq('species', speciesFilter);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) toast.error('Failed to load batches', { description: error.message });
      setBatches(data ?? []);
      setLoading(false);
    };
    load();
  }, [user, speciesFilter, statusFilter]);

  const handleRecordMortality = async () => {
    if (!mortalityBatch || !farmId) return;
    setMortalitySubmitting(true);
    const count = parseInt(mortalityCount) || 0;
    if (count <= 0) { toast.error('Count must be positive'); setMortalitySubmitting(false); return; }

    const { error: mrError } = await supabase.from('mortality_records').insert({
      batch_id: mortalityBatch.id,
      farm_id: farmId,
      count,
      cause: mortalityCause || null,
      notes: mortalityNotes || null,
    });
    if (mrError) { toast.error('Failed to record mortality', { description: mrError.message }); setMortalitySubmitting(false); return; }

    const newPop = Math.max(0, mortalityBatch.current_population - count);
    const { error: bError } = await supabase.from('batches').update({ current_population: newPop }).eq('id', mortalityBatch.id);
    if (bError) toast.error('Failed to update population', { description: bError.message });

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: mortalityBatch.id,
      event_type: 'mortality',
      description: `Recorded ${count} mortality in ${mortalityBatch.name}${mortalityCause ? `: ${mortalityCause}` : ''}`,
    });

    setBatches(prev => prev.map(b => b.id === mortalityBatch.id ? { ...b, current_population: newPop } : b));
    setMortalityBatch(null);
    setMortalityCount('1');
    setMortalityCause('');
    setMortalityNotes('');
    setMortalitySubmitting(false);
    toast.success(`Recorded ${count} mortality`);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Batches</h1>
        <Button className="gap-1.5 rounded-full" asChild>
          <Link to="/batches/new"><Plus className="h-4 w-4" /> New Batch</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            <SelectItem value="broiler">Broiler</SelectItem>
            <SelectItem value="layer">Layer</SelectItem>
            <SelectItem value="duck">Duck</SelectItem>
            <SelectItem value="turkey">Turkey</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No batches found</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first batch to start tracking.</p>
            <Button className="gap-1.5 rounded-full" asChild>
              <Link to="/batches/new"><Plus className="h-4 w-4" /> Create Batch</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {batches.map(batch => {
            const age = getBatchAge(batch.start_date, batch.species);
            return (
              <Card key={batch.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{batch.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{batch.species} • {batch.production_system.replace('_', ' ')}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      batch.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
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
                    <Button variant="outline" size="sm" className="flex-1 rounded-full text-xs gap-1" asChild>
                      <Link to={`/batches/${batch.id}`}><Eye className="h-3 w-3" /> View</Link>
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

      <Dialog open={!!mortalityBatch} onOpenChange={() => setMortalityBatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Mortality — {mortalityBatch?.name}</DialogTitle>
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
