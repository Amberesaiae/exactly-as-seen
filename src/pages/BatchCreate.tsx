import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cacheBatches } from '@/lib/sync';
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
import { generateInitialTasks } from '@/lib/health-auto-tasks';
import { addDays } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type House = Database['public']['Tables']['houses']['Row'];

export default function BatchCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [currency, setCurrency] = useState('GHS');
  const [houses, setHouses] = useState<House[]>([]);

  // Step 1
  const [species, setSpecies] = useState('broiler');
  const [duckType, setDuckType] = useState<'meat' | 'layer' | ''>('');
  const [batchName, setBatchName] = useState('');
  const [productionSystem, setProductionSystem] = useState('deep_litter');
  const [quantity, setQuantity] = useState('100');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 2
  const [houseId, setHouseId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [cycleLength, setCycleLength] = useState<number>(8);

  // Step 3
  const [chickCost, setChickCost] = useState('5.00');

  useEffect(() => {
    if (!user) return;
    supabase.from('farms').select('id, currency, setup_complete, updated_at').eq('user_id', user.id).then(({ data: farms }) => {
      const data = farms && farms.length > 0 ? [...farms].sort((a, b) => {
        if (a.setup_complete !== b.setup_complete) return a.setup_complete ? -1 : 1;
        return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      })[0] : null;
      if (data) {
        setFarmId(data.id);
        setCurrency(data.currency || 'GHS');
        supabase.from('houses').select('*').eq('farm_id', data.id).then(({ data: h }) => setHouses(h ?? []));
      }
    });
  }, [user]);

  useEffect(() => {
    if (species === 'broiler') {
      setCycleLength(8);
    } else if (species === 'layer') {
      setCycleLength(78);
    } else if (species === 'turkey') {
      setCycleLength(16);
    } else if (species === 'duck') {
      if (duckType === 'meat') setCycleLength(10);
      else if (duckType === 'layer') setCycleLength(78);
    } else {
      setCycleLength(8);
    }
  }, [species, duckType]);

  const canAdvance = () => {
    if (step === 1) return batchName.trim().length > 0 && parseInt(quantity) > 0;
    if (step === 1.5) return species === 'duck' ? (duckType !== '') : true;
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
      duck_type: species === 'duck' ? duckType : null,
      production_system: productionSystem,
      initial_quantity: qty,
      current_population: qty,
      start_date: startDate,
      house_id: houseId && houseId !== 'none' ? houseId : null,
      notes: notes || null,
      status: 'active',
      phase: 'starter',
      current_week: 1,
      current_day: 1,
      cycle_length_weeks: cycleLength,
    }).select('id').single();

    if (error) {
      toast.error('Failed to create batch', { description: error.message });
      setSubmitting(false);
      return;
    }

    // Set house occupancy
    if (houseId && houseId !== 'none') {
      await supabase.from('houses').update({ occupied_by_batch_id: batch.id }).eq('id', houseId);
    }

    // Insert automatic chicks purchase expense
    const totalPesewas = Math.round(qty * parseFloat(chickCost) * 100);
    if (totalPesewas > 0) {
      await supabase.from('expenses').upsert({
        farm_id: farmId,
        batch_id: batch.id,
        category: 'chicks_and_birds',
        description: `Auto-expense: Purchased ${qty} chicks for batch "${batchName}" @ ${chickCost}/bird`,
        amount: totalPesewas / 100,
        amount_pesewas: totalPesewas,
        date: startDate,
        source: 'auto:batch',
        source_ref: batch.id,
      }, { onConflict: 'source,source_ref', ignoreDuplicates: true });
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

    // Auto-generate initial health tasks (Day-1 arrival protocol + species specific tasks)
    const initialTasks = generateInitialTasks({
      batchId: batch.id,
      farmId,
      species,
      startDate,
      cycleLengthWeeks: cycleLength,
    });

    if (initialTasks.length > 0) {
      const { error: healthTasksErr } = await supabase.from('health_tasks').insert(initialTasks);
      if (healthTasksErr) {
        console.error('Failed to seed initial health tasks:', healthTasksErr);
      }
    }


    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'batch_created',
      description: `Created batch "${batchName}" — ${qty} ${species}`,
    });

    // Cache updated batches in Dexie immediately
    await cacheBatches(farmId).catch(err => console.error('Failed to cache batches after create:', err));

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
          <CardDescription>Step {step === 1.5 ? '1b' : (step === 2 ? '2' : (step === 3 ? '3' : '1'))} of 3</CardDescription>
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
                    <SelectItem value="broiler">Broiler (8 weeks)</SelectItem>
                    <SelectItem value="layer">Layer (72–78 weeks)</SelectItem>
                    <SelectItem value="duck">Duck (meat 8–10 / layer 72+ weeks)</SelectItem>
                    <SelectItem value="turkey">Turkey (12–20 weeks)</SelectItem>
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

          {step === 1.5 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <Label className="text-sm font-medium text-center">Select Duck Sub-type</Label>
              <p className="text-xs text-muted-foreground text-center">Duck species require selecting their production purpose.</p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDuckType('meat');
                    setCycleLength(10);
                  }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                    duckType === 'meat'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-card-foreground hover:border-muted-foreground/35'
                  }`}
                >
                  <span className="font-bold text-sm mb-1">Meat Duck</span>
                  <span className="text-[10px] text-muted-foreground">8–10 weeks cycle</span>
                  <span className="text-[10px] text-muted-foreground mt-2 font-medium">No egg production</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDuckType('layer');
                    setCycleLength(78);
                  }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                    duckType === 'layer'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-card-foreground hover:border-muted-foreground/35'
                  }`}
                >
                  <span className="font-bold text-sm mb-1">Layer Duck</span>
                  <span className="text-[10px] text-muted-foreground">72+ weeks cycle</span>
                  <span className="text-[10px] text-muted-foreground mt-2 font-medium">Egg laying from Wk 20+</span>
                </button>
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
                    <SelectItem value="none">None</SelectItem>
                    {houses.map(h => {
                      const isOccupied = h.occupied_by_batch_id !== null;
                      return (
                        <SelectItem key={h.id} value={h.id} disabled={isOccupied}>
                          {h.name} (Cap: {h.capacity}){isOccupied ? ' — Occupied' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-1">
                  {houses.filter(h => h.occupied_by_batch_id !== null).map(h => (
                    <span key={h.id} className="text-[10px] inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      {h.name} occupied
                    </span>
                  ))}
                </div>
              </div>
              
              {((species === 'turkey') || (species === 'layer') || (species === 'duck' && duckType === 'layer')) && (
                <div className="space-y-2 border-t pt-4 mt-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Cycle Length (Weeks)</Label>
                    <span className="font-semibold text-primary">{cycleLength} weeks</span>
                  </div>
                  <input
                    type="range"
                    min={species === 'turkey' ? 12 : 72}
                    max={species === 'turkey' ? 20 : (species === 'layer' ? 78 : 100)}
                    value={cycleLength}
                    onChange={e => setCycleLength(parseInt(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Min: {species === 'turkey' ? 12 : 72} weeks</span>
                    <span>Max: {species === 'turkey' ? 20 : (species === 'layer' ? 78 : 100)} weeks</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this batch..." />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Review</h3>
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Batch Name</span><span className="font-medium">{batchName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Species</span><span className="font-medium capitalize">{species}{species === 'duck' && ` (${duckType === 'meat' ? 'Meat' : 'Layer'})`}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">System</span><span className="font-medium capitalize">{productionSystem.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-medium">{quantity} birds</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span className="font-medium">{startDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cycle Length</span><span className="font-medium">{cycleLength} weeks</span></div>
                {houseId && houseId !== 'none' && <div className="flex justify-between"><span className="text-muted-foreground">House</span><span className="font-medium">{houses.find(h => h.id === houseId)?.name}</span></div>}
                {notes && <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span className="font-medium truncate max-w-[200px]">{notes}</span></div>}
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Chick Cost per Bird ({currency})</Label>
                <Input type="number" min="0" step="0.01" value={chickCost} onChange={e => setChickCost(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  This automatically logs a chick purchase expense in your ledger.
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                An automatic vaccination schedule will be generated for this {species}.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-between gap-3">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => {
                  if (step === 2 && species === 'duck') {
                    setStep(1.5);
                  } else if (step === 1.5) {
                    setStep(1);
                  } else {
                    setStep(step - 1);
                  }
                }}
                className="gap-1.5 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate('/batches')} className="gap-1.5 rounded-full">
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => {
                  if (step === 1 && species === 'duck') {
                    setStep(1.5);
                  } else if (step === 1.5) {
                    setStep(2);
                  } else {
                    setStep(step + 1);
                  }
                }}
                disabled={!canAdvance()}
                className="gap-1.5 rounded-full"
              >
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
