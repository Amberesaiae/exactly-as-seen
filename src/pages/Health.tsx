import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Droplets, Shield, Plus, Check, AlertTriangle, Loader2,
  Pill, Syringe, Clock, CalendarDays, ThermometerSun,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, differenceInDays, isAfter, isBefore, isToday } from 'date-fns';
import { MEDICATION_TEMPLATES, type MedicationTemplate } from '@/lib/health-data';
import { getBatchAge } from '@/lib/batch-utils';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type HealthTask = Database['public']['Tables']['health_tasks']['Row'];
type VaccinationRow = Database['public']['Tables']['vaccination_schedule']['Row'];
type WaterRecord = Database['public']['Tables']['water_records']['Row'];

export default function Health() {
  const { user } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [vaccinations, setVaccinations] = useState<VaccinationRow[]>([]);
  const [healthTasks, setHealthTasks] = useState<HealthTask[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterRecord[]>([]);

  // Water log
  const [waterGallons, setWaterGallons] = useState('');
  const [waterTemp, setWaterTemp] = useState('');
  const [waterNotes, setWaterNotes] = useState('');
  const [waterSaving, setWaterSaving] = useState(false);

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

  // Load batch-specific data
  useEffect(() => {
    if (!selectedBatch || !farmId) {
      setVaccinations([]);
      setHealthTasks([]);
      setWaterRecords([]);
      return;
    }
    Promise.all([
      supabase.from('vaccination_schedule').select('*').eq('batch_id', selectedBatch).order('scheduled_date'),
      supabase.from('health_tasks').select('*').eq('batch_id', selectedBatch).order('scheduled_date', { ascending: false }),
      supabase.from('water_records').select('*').eq('batch_id', selectedBatch).order('date', { ascending: false }).limit(14),
    ]).then(([vResult, hResult, wResult]) => {
      setVaccinations(vResult.data ?? []);
      setHealthTasks(hResult.data ?? []);
      setWaterRecords(wResult.data ?? []);
    });
  }, [selectedBatch, farmId]);

  const batch = batches.find(b => b.id === selectedBatch);
  const batchAge = batch ? getBatchAge(batch.start_date, batch.species) : null;
  const today = new Date();

  // --- Vaccination ---
  const markVaccineAdministered = async (vId: string) => {
    const { error } = await supabase.from('vaccination_schedule')
      .update({ administered: true, administered_at: new Date().toISOString() })
      .eq('id', vId);
    if (error) { toast.error(error.message); return; }
    setVaccinations(prev => prev.map(v => v.id === vId ? { ...v, administered: true, administered_at: new Date().toISOString() } : v));

    if (farmId) {
      const vaccine = vaccinations.find(v => v.id === vId);
      await supabase.from('activity_log').insert({
        farm_id: farmId,
        batch_id: selectedBatch,
        event_type: 'vaccination',
        description: `Administered ${vaccine?.vaccine_name ?? 'vaccine'}`,
      });
    }
    toast.success('Vaccine marked as administered');
  };

  // --- Medication ---
  const addMedication = async () => {
    if (!farmId || !selectedBatch || !selectedMed) return;
    setMedSubmitting(true);

    const { data: task, error } = await supabase.from('health_tasks').insert({
      batch_id: selectedBatch,
      farm_id: farmId,
      task_type: selectedMed.taskType,
      product_name: selectedMed.name,
      dose_per_gallon: null,
      duration_days: selectedMed.durationDays,
      withdrawal_meat_days: selectedMed.withdrawalMeatDays,
      withdrawal_egg_days: selectedMed.withdrawalEggDays,
      notes: medNotes || null,
    }).select().single();

    if (error) { toast.error(error.message); setMedSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: selectedBatch,
      event_type: 'health_task',
      description: `Started ${selectedMed.name} — ${selectedMed.durationDays}d course`,
    });

    setHealthTasks(prev => [task, ...prev]);
    setShowMedModal(false);
    setSelectedMed(null);
    setMedNotes('');
    setMedSubmitting(false);
    toast.success('Medication recorded');
  };

  const markTaskComplete = async (taskId: string) => {
    const task = healthTasks.find(t => t.id === taskId);
    const { error } = await supabase.from('health_tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskId);
    if (error) { toast.error(error.message); return; }
    setHealthTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true, completed_at: new Date().toISOString() } : t));

    // Auto-log expense for medications
    if (farmId && task && task.task_type === 'medication') {
      await supabase.from('expenses').insert({
        farm_id: farmId,
        batch_id: selectedBatch,
        category: 'health',
        description: `${task.product_name} — ${task.duration_days}d course`,
        amount: 0, // User can update in Finance
        source: 'health_task',
        source_ref: taskId,
      });
    }

    toast.success('Task completed');
  };

  // --- Water ---
  const logWater = async () => {
    if (!farmId || !selectedBatch) return;
    const gallons = parseFloat(waterGallons);
    if (!gallons || gallons <= 0) { toast.error('Enter a valid amount'); return; }

    setWaterSaving(true);
    const { data, error } = await supabase.from('water_records').insert({
      batch_id: selectedBatch,
      farm_id: farmId,
      gallons_consumed: gallons,
      temperature_c: waterTemp ? parseFloat(waterTemp) : null,
      notes: waterNotes || null,
    }).select().single();

    if (error) { toast.error(error.message); setWaterSaving(false); return; }
    setWaterRecords(prev => [data, ...prev.slice(0, 13)]);
    setWaterGallons('');
    setWaterTemp('');
    setWaterNotes('');
    setWaterSaving(false);
    toast.success('Water consumption logged');
  };

  // --- Helpers ---
  const getWithdrawalStatus = (task: HealthTask) => {
    const startDate = new Date(task.scheduled_date);
    const endDate = addDays(startDate, task.duration_days);
    const meatSafe = addDays(endDate, task.withdrawal_meat_days);
    const eggSafe = addDays(endDate, task.withdrawal_egg_days);
    const meatDaysLeft = Math.max(0, differenceInDays(meatSafe, today));
    const eggDaysLeft = Math.max(0, differenceInDays(eggSafe, today));
    const isActive = isBefore(today, endDate) && !task.completed;
    const inMeatWithdrawal = isBefore(today, meatSafe) && task.withdrawal_meat_days > 0;
    const inEggWithdrawal = isBefore(today, eggSafe) && task.withdrawal_egg_days > 0;

    return { endDate, meatSafe, eggSafe, meatDaysLeft, eggDaysLeft, isActive, inMeatWithdrawal, inEggWithdrawal };
  };

  // Count pending tasks for header
  const pendingVaccines = vaccinations.filter(v => !v.administered && isBefore(new Date(v.scheduled_date), addDays(today, 7)));
  const activeMeds = healthTasks.filter(t => !t.completed && t.task_type === 'medication');

  if (loading) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Water & Health</h1>
        <Button className="gap-1.5 rounded-full" onClick={() => setShowMedModal(true)} disabled={!selectedBatch}>
          <Plus className="h-4 w-4" /> Medication
        </Button>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold mb-1">No active batches</h3>
            <p className="text-sm text-muted-foreground">Create a batch first to manage health.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Batch selector + summary */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="space-y-1 flex-1">
              <Label className="text-sm font-medium">Active Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.species})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {batchAge && (
              <div className="flex gap-2">
                {pendingVaccines.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <Syringe className="h-3 w-3" /> {pendingVaccines.length} vaccine{pendingVaccines.length > 1 ? 's' : ''} due
                  </Badge>
                )}
                {activeMeds.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Pill className="h-3 w-3" /> {activeMeds.length} active med{activeMeds.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Tabs defaultValue="vaccinations" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="vaccinations" className="gap-1">
                <Syringe className="h-3.5 w-3.5" /> Vaccines
              </TabsTrigger>
              <TabsTrigger value="medications" className="gap-1">
                <Pill className="h-3.5 w-3.5" /> Meds
              </TabsTrigger>
              <TabsTrigger value="water" className="gap-1">
                <Droplets className="h-3.5 w-3.5" /> Water
              </TabsTrigger>
            </TabsList>

            {/* ─── Vaccinations Tab ─── */}
            <TabsContent value="vaccinations" className="space-y-4 mt-4">
              {vaccinations.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No vaccinations scheduled for this batch.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {vaccinations.map(v => {
                    const due = new Date(v.scheduled_date);
                    const overdue = !v.administered && isBefore(due, today) && !isToday(due);
                    const dueToday = !v.administered && isToday(due);
                    const upcoming = !v.administered && isAfter(due, today);
                    const daysUntil = differenceInDays(due, today);

                    return (
                      <Card key={v.id} className={overdue ? 'border-destructive/50' : dueToday ? 'border-primary/50' : ''}>
                        <CardContent className="flex items-center justify-between py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                              v.administered ? 'bg-green-100 text-green-600' :
                              overdue ? 'bg-destructive/10 text-destructive' :
                              dueToday ? 'bg-primary/10 text-primary' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {v.administered ? <Check className="h-4 w-4" /> : <Syringe className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${v.administered ? 'line-through text-muted-foreground' : ''}`}>
                                {v.vaccine_name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Week {v.scheduled_week}</span>
                                <span>•</span>
                                <span>{format(due, 'MMM d, yyyy')}</span>
                                {overdue && <Badge variant="destructive" className="text-[10px] h-4 px-1">Overdue</Badge>}
                                {dueToday && <Badge className="text-[10px] h-4 px-1">Today</Badge>}
                                {upcoming && daysUntil <= 7 && (
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1">In {daysUntil}d</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {!v.administered ? (
                            <Button size="sm" variant={overdue || dueToday ? 'default' : 'outline'} className="h-8 rounded-full text-xs shrink-0" onClick={() => markVaccineAdministered(v.id)}>
                              <Check className="h-3 w-3 mr-1" /> Done
                            </Button>
                          ) : (
                            <span className="text-xs text-green-600 shrink-0">
                              {v.administered_at ? format(new Date(v.administered_at), 'MMM d') : 'Done'}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ─── Medications Tab ─── */}
            <TabsContent value="medications" className="space-y-4 mt-4">
              {healthTasks.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground mb-3">No medications recorded yet.</p>
                    <Button variant="outline" className="rounded-full gap-1" onClick={() => setShowMedModal(true)}>
                      <Plus className="h-3.5 w-3.5" /> Add Medication
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {healthTasks.map(task => {
                    const ws = getWithdrawalStatus(task);
                    return (
                      <Card key={task.id} className={ws.isActive ? 'border-primary/50' : ws.inMeatWithdrawal || ws.inEggWithdrawal ? 'border-yellow-500/50' : ''}>
                        <CardContent className="py-3 px-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                                task.completed && !ws.inMeatWithdrawal && !ws.inEggWithdrawal ? 'bg-green-100 text-green-600' :
                                ws.isActive ? 'bg-primary/10 text-primary' :
                                ws.inMeatWithdrawal || ws.inEggWithdrawal ? 'bg-yellow-100 text-yellow-700' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {task.task_type === 'medication' ? <Pill className="h-4 w-4" /> : <ThermometerSun className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${task.completed && !ws.inMeatWithdrawal ? 'text-muted-foreground' : ''}`}>
                                  {task.product_name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                  <span>{task.duration_days}d course</span>
                                  <span>•</span>
                                  <span>Started {format(new Date(task.scheduled_date), 'MMM d')}</span>
                                  {ws.isActive && <Badge className="text-[10px] h-4 px-1">Active</Badge>}
                                  {task.completed && !ws.inMeatWithdrawal && !ws.inEggWithdrawal && (
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-green-100 text-green-700">Clear</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {!task.completed && (
                              <Button size="sm" variant="outline" className="h-8 rounded-full text-xs shrink-0" onClick={() => markTaskComplete(task.id)}>
                                <Check className="h-3 w-3 mr-1" /> Complete
                              </Button>
                            )}
                          </div>

                          {/* Withdrawal warnings */}
                          {(ws.inMeatWithdrawal || ws.inEggWithdrawal) && (
                            <div className="ml-10 space-y-1">
                              {ws.inMeatWithdrawal && (
                                <div className="flex items-center gap-2 text-xs rounded-md bg-yellow-50 text-yellow-800 px-2 py-1">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  <span>
                                    Meat withdrawal: <strong>{ws.meatDaysLeft}d left</strong> — safe after {format(ws.meatSafe, 'MMM d')}
                                  </span>
                                </div>
                              )}
                              {ws.inEggWithdrawal && (
                                <div className="flex items-center gap-2 text-xs rounded-md bg-yellow-50 text-yellow-800 px-2 py-1">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  <span>
                                    Egg withdrawal: <strong>{ws.eggDaysLeft}d left</strong> — safe after {format(ws.eggSafe, 'MMM d')}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Dosing info */}
                          {task.notes && (
                            <p className="ml-10 text-xs text-muted-foreground">{task.notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Dosing reference */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Dosing Quick Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {MEDICATION_TEMPLATES.filter(m => m.taskType === 'medication').map(m => (
                      <div key={m.name} className="flex justify-between rounded border px-2 py-1.5">
                        <span className="font-medium truncate max-w-[140px]">{m.name}</span>
                        <span className="text-muted-foreground shrink-0">{m.dosePerGallon}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Water Tab ─── */}
            <TabsContent value="water" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Log Water Consumption</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Gallons Consumed</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={waterGallons}
                        onChange={e => setWaterGallons(e.target.value)}
                        placeholder="e.g., 15"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Temperature °C (optional)</Label>
                      <Input
                        type="number"
                        value={waterTemp}
                        onChange={e => setWaterTemp(e.target.value)}
                        placeholder="e.g., 28"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Notes (optional)</Label>
                    <Input value={waterNotes} onChange={e => setWaterNotes(e.target.value)} placeholder="e.g., Added electrolytes" />
                  </div>
                  {batch && (
                    <p className="text-xs text-muted-foreground">
                      Guideline: ~{(batch.current_population * 0.06).toFixed(0)} gallons/day ({batch.current_population} birds × ~¼ cup each)
                    </p>
                  )}
                  <Button
                    onClick={logWater}
                    disabled={!waterGallons || waterSaving}
                    className="rounded-full gap-1.5"
                  >
                    {waterSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Droplets className="h-4 w-4" /> Log Water</>}
                  </Button>
                </CardContent>
              </Card>

              {/* Water history */}
              {waterRecords.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Recent Water Log</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      {waterRecords.map(w => (
                        <div key={w.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                          <div className="flex items-center gap-2">
                            <Droplets className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span>{format(new Date(w.date), 'MMM d')}</span>
                            {w.notes && <span className="text-xs text-muted-foreground truncate max-w-[120px]">— {w.notes}</span>}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-medium">{w.gallons_consumed} gal</span>
                            {w.temperature_c && (
                              <span className="text-xs text-muted-foreground">{w.temperature_c}°C</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* ─── Add Medication Dialog ─── */}
      <Dialog open={showMedModal} onOpenChange={setShowMedModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Medication / Supplement</DialogTitle>
            <DialogDescription>
              Select a product to record. Dosing and withdrawal periods are pre-filled from the reference database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Product</Label>
              <Select
                value={selectedMed?.name ?? 'pick'}
                onValueChange={n => {
                  if (n === 'pick') { setSelectedMed(null); return; }
                  setSelectedMed(MEDICATION_TEMPLATES.find(m => m.name === n) ?? null);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Choose product..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pick" disabled>Choose product...</SelectItem>
                  {MEDICATION_TEMPLATES.map(m => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedMed && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1.5">
                <p className="text-xs text-muted-foreground">{selectedMed.indication}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Dose</p>
                    <p className="font-medium">{selectedMed.dosePerGallon}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">{selectedMed.durationDays} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Meat Withdrawal</p>
                    <p className={`font-medium ${selectedMed.withdrawalMeatDays > 0 ? 'text-yellow-700' : ''}`}>
                      {selectedMed.withdrawalMeatDays > 0 ? `${selectedMed.withdrawalMeatDays} days` : 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Egg Withdrawal</p>
                    <p className={`font-medium ${selectedMed.withdrawalEggDays > 0 ? 'text-yellow-700' : ''}`}>
                      {selectedMed.withdrawalEggDays > 0 ? `${selectedMed.withdrawalEggDays} days` : 'None'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder="Symptoms, observations..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowMedModal(false); setSelectedMed(null); }}>Cancel</Button>
            <Button onClick={addMedication} disabled={!selectedMed || medSubmitting}>
              {medSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
