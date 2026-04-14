import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Sprout, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { VACCINATION_TEMPLATES } from '@/lib/health-data';
import { addDays } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type House = Database['public']['Tables']['houses']['Row'];

export default function BatchCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [houses, setHouses] = useState<House[]>([]);

  // Step 1
  const [species, setSpecies] = useState('broiler');
  const [batchName, setBatchName] = useState('');
  const [productionSystem, setProductionSystem] = useState('deep_litter');
  const [quantity, setQuantity] = useState('100');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 2
  const [houseId, setHouseId] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFarmId(data.id);
        supabase.from('houses').select('*').eq('farm_id', data.id).then(({ data: h }) => setHouses(h ?? []));
      }
    });
  }, [user]);

  const canAdvance = () => {
    if (step === 1) return batchName.trim().length > 0 && parseInt(quantity) > 0;
    return true;
  };

  const handleCreate = async () => {
    if (!farmId) return;
    setSubmitting(true);
    const qty = parseInt(quantity) || 0;

    const { data: batch, error } = await supabase.from('batches').insert({
      farm_id: farmId,
      name: batchName,
      species,
      production_system: productionSystem,
      initial_quantity: qty,
      current_population: qty,
      start_date: startDate,
      house_id: houseId || null,
      notes: notes || null,
      status: 'active',
      phase: 'starter',
      current_week: 1,
      current_day: 1,
    }).select('id').single();

    if (error) {
      toast.error('Failed to create batch', { description: error.message });
      setSubmitting(false);
      return;
    }

    // Auto-generate vaccination schedule
    const vaccines = VACCINATION_TEMPLATES.filter(v => v.species.includes(species));
    if (vaccines.length > 0) {
      const start = new Date(startDate);
      await supabase.from('vaccination_schedule').insert(
        vaccines.map(v => ({
          batch_id: batch.id,
          farm_id: farmId,
          vaccine_name: v.name,
          scheduled_week: v.scheduledWeek,
          scheduled_date: addDays(start, v.scheduledWeek * 7).toISOString().split('T')[0],
        }))
      );
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'batch_created',
      description: `Created batch "${batchName}" — ${qty} ${species}`,
    });

    toast.success('Batch created!');
    navigate(`/batches/${batch.id}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">New Batch</CardTitle>
          <CardDescription>Step {step} of 3</CardDescription>
          <Progress value={(step / 3) * 100} className="mt-4 h-2" />
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>Batch Name</Label>
                <Input value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="e.g., Broiler Batch 1" />
              </div>
              <div className="space-y-2">
                <Label>Species</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broiler">Broiler</SelectItem>
                    <SelectItem value="layer">Layer</SelectItem>
                    <SelectItem value="duck">Duck</SelectItem>
                    <SelectItem value="turkey">Turkey</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Production System</Label>
                <Select value={productionSystem} onValueChange={setProductionSystem}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deep_litter">Deep Litter (Intensive)</SelectItem>
                    <SelectItem value="free_range">Free Range (Semi-Intensive)</SelectItem>
                    <SelectItem value="cage">Cage System</SelectItem>
                    <SelectItem value="pasture">Pasture-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Initial Quantity</Label>
                <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>Assign House (optional)</Label>
                <Select value={houseId} onValueChange={setHouseId}>
                  <SelectTrigger><SelectValue placeholder="Select a house" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {houses.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name} (Cap: {h.capacity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this batch..." />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Review</h3>
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Batch Name</span><span className="font-medium">{batchName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Species</span><span className="font-medium capitalize">{species}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">System</span><span className="font-medium capitalize">{productionSystem.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-medium">{quantity} birds</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span className="font-medium">{startDate}</span></div>
                {houseId && <div className="flex justify-between"><span className="text-muted-foreground">House</span><span className="font-medium">{houses.find(h => h.id === houseId)?.name}</span></div>}
                {notes && <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span className="font-medium truncate max-w-[200px]">{notes}</span></div>}
              </div>
              <p className="text-xs text-muted-foreground">
                A vaccination schedule will be auto-generated based on the species.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-between gap-3">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1.5 rounded-full">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate('/batches')} className="gap-1.5 rounded-full">
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()} className="gap-1.5 rounded-full">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={submitting} className="gap-1.5 rounded-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Create Batch</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
