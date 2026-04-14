import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Droplets, Shield, Plus, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, differenceInDays } from 'date-fns';
import { MEDICATION_TEMPLATES, type MedicationTemplate } from '@/lib/health-data';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type HealthTask = Database['public']['Tables']['health_tasks']['Row'];
type VaccinationRow = Database['public']['Tables']['vaccination_schedule']['Row'];

export default function Health() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [vaccinations, setVaccinations] = useState<VaccinationRow[]>([]);
  const [healthTasks, setHealthTasks] = useState<HealthTask[]>([]);
  const [waterGallons, setWaterGallons] = useState('');
  const [waterTemp, setWaterTemp] = useState('');

  // Medication modal
  const [showMedModal, setShowMedModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MedicationTemplate | null>(null);
  const [medNotes, setMedNotes] = useState('');
  const [medSubmitting, setMedSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);
      const { data: b } = await supabase.from('batches').select('*').eq('farm_id', farm.id).eq('status', 'active');
      setBatches(b ?? []);
      if (b?.length) setSelectedBatch(b[0].id);
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!selectedBatch || !farmId) return;
    Promise.all([
      supabase.from('vaccination_schedule').select('*').eq('batch_id', selectedBatch).order('scheduled_date'),
      supabase.from('health_tasks').select('*').eq('batch_id', selectedBatch).order('scheduled_date', { ascending: false }),
    ]).then(([vResult, hResult]) => {
      setVaccinations(vResult.data ?? []);
      setHealthTasks(hResult.data ?? []);
    });
  }, [selectedBatch, farmId]);

  const markVaccineAdministered = async (vId: string) => {
    const { error } = await supabase.from('vaccination_schedule').update({ administered: true, administered_at: new Date().toISOString() }).eq('id', vId);
    if (error) { toast.error(error.message); return; }
    setVaccinations(prev => prev.map(v => v.id === vId ? { ...v, administered: true, administered_at: new Date().toISOString() } : v));
    toast.success('Vaccine marked as administered');
  };

  const addMedication = async () => {
    if (!farmId || !selectedBatch || !selectedMed) return;
    setMedSubmitting(true);
    const { error } = await supabase.from('health_tasks').insert({
      batch_id: selectedBatch,
      farm_id: farmId,
      task_type: selectedMed.taskType,
      product_name: selectedMed.name,
      dose_per_gallon: parseFloat(selectedMed.dosePerGallon) || null,
      duration_days: selectedMed.durationDays,
      withdrawal_meat_days: selectedMed.withdrawalMeatDays,
      withdrawal_egg_days: selectedMed.withdrawalEggDays,
      notes: medNotes || null,
    });
    if (error) { toast.error(error.message); setMedSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: selectedBatch,
      event_type: 'health_task',
      description: `Started ${selectedMed.name} treatment`,
    });

    setShowMedModal(false);
    setSelectedMed(null);
    setMedNotes('');
    setMedSubmitting(false);
    // Reload
    const { data } = await supabase.from('health_tasks').select('*').eq('batch_id', selectedBatch).order('scheduled_date', { ascending: false });
    setHealthTasks(data ?? []);
    toast.success('Medication recorded');
  };

  const logWater = async () => {
    if (!farmId || !selectedBatch) return;
    const { error } = await supabase.from('water_records').insert({
      batch_id: selectedBatch,
      farm_id: farmId,
      gallons_consumed: parseFloat(waterGallons) || 0,
      temperature_c: waterTemp ? parseFloat(waterTemp) : null,
    });
    if (error) { toast.error(error.message); return; }
    setWaterGallons('');
    setWaterTemp('');
    toast.success('Water consumption logged');
  };

  const markTaskComplete = async (taskId: string) => {
    const { error } = await supabase.from('health_tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
    if (error) { toast.error(error.message); return; }
    setHealthTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true, completed_at: new Date().toISOString() } : t));
    toast.success('Task completed');
  };

  if (loading) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  const today = new Date();

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Water & Health</h1>
        <Button className="gap-1.5 rounded-full" onClick={() => setShowMedModal(true)}>
          <Plus className="h-4 w-4" /> Add Medication
        </Button>
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
            <Droplets className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Create a batch first to manage health.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Vaccination Schedule</CardTitle></CardHeader>
            <CardContent>
              {vaccinations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vaccines scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {vaccinations.map(v => {
                    const due = new Date(v.scheduled_date);
                    const overdue = !v.administered && due < today;
                    return (
                      <div key={v.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                        <div className="flex items-center gap-2">
                          {overdue && <AlertTriangle className="h-3 w-3 text-destructive" />}
                          <div>
                            <p className={`font-medium ${v.administered ? 'line-through text-muted-foreground' : overdue ? 'text-destructive' : ''}`}>{v.vaccine_name}</p>
                            <p className="text-xs text-muted-foreground">Week {v.scheduled_week} — {format(due, 'MMM d')}</p>
                          </div>
                        </div>
                        {!v.administered && (
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-full" onClick={() => markVaccineAdministered(v.id)}>
                            <Check className="h-3 w-3 mr-1" /> Done
                          </Button>
                        )}
                        {v.administered && <span className="text-xs text-primary">✓ Done</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Water Log</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label>Gallons</Label>
                  <Input type="number" min="0" step="0.5" value={waterGallons} onChange={e => setWaterGallons(e.target.value)} placeholder="0" />
                </div>
                <div className="w-24 space-y-1">
                  <Label>Temp °C</Label>
                  <Input type="number" value={waterTemp} onChange={e => setWaterTemp(e.target.value)} placeholder="—" />
                </div>
              </div>
              <Button size="sm" onClick={logWater} disabled={!waterGallons} className="rounded-full">Log Water</Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Active Medications & Supplements</CardTitle></CardHeader>
            <CardContent>
              {healthTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active medications.</p>
              ) : (
                <div className="space-y-2">
                  {healthTasks.map(task => {
                    const startDate = new Date(task.scheduled_date);
                    const endDate = addDays(startDate, task.duration_days);
                    const meatSafe = addDays(endDate, task.withdrawal_meat_days);
                    const eggSafe = addDays(endDate, task.withdrawal_egg_days);
                    return (
                      <div key={task.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                        <div>
                          <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.duration_days}d | Meat safe: {format(meatSafe, 'MMM d')} | Egg safe: {format(eggSafe, 'MMM d')}
                          </p>
                        </div>
                        {!task.completed && (
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-full" onClick={() => markTaskComplete(task.id)}>
                            <Check className="h-3 w-3 mr-1" /> Complete
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showMedModal} onOpenChange={setShowMedModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Medication / Supplement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Select Product</Label>
              <Select value={selectedMed?.name ?? ''} onValueChange={n => setSelectedMed(MEDICATION_TEMPLATES.find(m => m.name === n) ?? null)}>
                <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                <SelectContent>
                  {MEDICATION_TEMPLATES.map(m => (
                    <SelectItem key={m.name} value={m.name}>{m.name} — {m.indication}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedMed && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p><strong>Dose:</strong> {selectedMed.dosePerGallon}</p>
                <p><strong>Duration:</strong> {selectedMed.durationDays} days</p>
                <p><strong>Meat withdrawal:</strong> {selectedMed.withdrawalMeatDays} days</p>
                <p><strong>Egg withdrawal:</strong> {selectedMed.withdrawalEggDays} days</p>
              </div>
            )}
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMedModal(false)}>Cancel</Button>
            <Button onClick={addMedication} disabled={!selectedMed || medSubmitting}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
