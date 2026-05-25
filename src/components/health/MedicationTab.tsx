import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, ThermometerSun, Plus, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { format, addDays, differenceInDays, isBefore } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { detectConflicts } from '@/lib/medication-conflicts';
import { computeDose } from '@/lib/dosing';

interface MedicationTabProps {
  healthTasks: any[];
  medSubmitting: boolean;
  showMedModal: boolean;
  setShowMedModal: (show: boolean) => void;
  onAddMedication: (params: any) => void;
  onMarkComplete: (id: string) => void;
  medications: any[];
  containerTypes: any[];
  waterSourceChlorinated: boolean;
  batch?: any;
}

export function MedicationTab({
  healthTasks,
  medSubmitting,
  showMedModal,
  setShowMedModal,
  onAddMedication,
  onMarkComplete,
  medications,
  containerTypes,
  waterSourceChlorinated,
  batch,
}: MedicationTabProps) {
  const today = new Date();
  
  // Dialog state
  const [selectedMedId, setSelectedMedId] = useState<string>('');
  const [containerTypeId, setContainerTypeId] = useState<string>('');
  const [containerCount, setContainerCount] = useState<number>(1);
  const [birdCount, setBirdCount] = useState<number>(100);
  const [medNotes, setMedNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [costPesewas, setCostPesewas] = useState<string>('0');

  // Pre-fill bird count when batch is loaded
  useEffect(() => {
    if (batch?.current_population) {
      setBirdCount(batch.current_population);
    }
  }, [batch]);

  const selectedMed = medications.find(m => m.id === selectedMedId) || null;
  const selectedContainer = containerTypes.find(c => c.id === containerTypeId) || null;

  // Compute drinker volume and dose
  const waterVolumeL = selectedContainer ? Number(selectedContainer.volume_l) * containerCount : 0;
  const doseResult = selectedMed ? computeDose(selectedMed, waterVolumeL) : null;

  // Injection values
  const getDosePerBirdMl = (medId: string) => {
    const id = medId.toLowerCase();
    if (id === 'fowl_pox') return 0.01;
    if (id === 'marek') return 0.2;
    if (id === 'gentamicin') return 0.5;
    return 0.2; // default
  };
  const getInjectionSite = (deliveryMethod: string) => {
    if (deliveryMethod === 'injection_wing_web') return 'Wing Web';
    if (deliveryMethod === 'injection_subcutaneous') return 'Subcutaneous (Neck)';
    return 'Intramuscular';
  };

  // Real-time conflict checks inside dialog
  const newDate = scheduledDate || format(new Date(), 'yyyy-MM-dd');
  const newDuration = selectedMed ? selectedMed.duration_days || 5 : 5;

  const neighborhood = healthTasks
    .map(t => {
      const med = medications.find(m => m.id === t.medication_id);
      return { task: t, med };
    })
    .filter((item): item is { task: any; med: any } => item.med !== undefined);

  const conflicts = selectedMed
    ? detectConflicts({
        newMed: selectedMed,
        newDate,
        newDuration,
        neighborhood,
        waterSourceChlorinated,
      })
    : [];

  const hasBlock = conflicts.some(c => c.severity === 'BLOCK');

  const categories = Array.from(new Set(medications.map(m => m.category)));

  const getWithdrawalStatus = (task: any) => {
    // If completed and we have absolute dates, use them
    if (task.completed && (task.withdrawal_meat_until || task.withdrawal_eggs_until)) {
      const meatSafe = task.withdrawal_meat_until ? new Date(task.withdrawal_meat_until) : new Date();
      const eggSafe = task.withdrawal_eggs_until ? new Date(task.withdrawal_eggs_until) : new Date();
      const meatDaysLeft = Math.max(0, differenceInDays(meatSafe, today));
      const eggDaysLeft = Math.max(0, differenceInDays(eggSafe, today));
      const inMeatWithdrawal = task.withdrawal_meat_until ? isBefore(today, meatSafe) : false;
      const inEggWithdrawal = task.withdrawal_eggs_until ? isBefore(today, eggSafe) : false;
      return { 
        endDate: task.completed_at ? new Date(task.completed_at) : new Date(), 
        meatSafe, 
        eggSafe, 
        meatDaysLeft, 
        eggDaysLeft, 
        isActive: false, 
        inMeatWithdrawal, 
        inEggWithdrawal 
      };
    }

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

  const handleAddMed = () => {
    if (!selectedMed || hasBlock) return;

    onAddMedication({
      medicationId: selectedMed.id,
      taskType: selectedMed.category === 'supplement' ? 'supplement' : 'medication',
      durationDays: selectedMed.withdrawal_meat_days > 0 || selectedMed.withdrawal_egg_days > 0 ? 5 : 3, // standard course duration
      withdrawalMeatDays: selectedMed.withdrawal_meat_days,
      withdrawalEggDays: selectedMed.withdrawal_egg_days,
      dosePerGallon: selectedMed.delivery_method === 'drinking_water' ? `${selectedMed.dose_per_gallon || 1.0} per gallon` : undefined,
      indication: selectedMed.category,
      containerTypeId: selectedMed.delivery_method === 'drinking_water' ? containerTypeId : undefined,
      containerCount: selectedMed.delivery_method === 'drinking_water' ? containerCount : undefined,
      waterVolumeL: selectedMed.delivery_method === 'drinking_water' ? waterVolumeL : undefined,
      computedDoseAmount: selectedMed.delivery_method === 'drinking_water' ? doseResult?.amount : (getDosePerBirdMl(selectedMed.id) * birdCount),
      computedDoseUnit: selectedMed.delivery_method === 'drinking_water' ? doseResult?.unit : 'ml',
      birdCount: selectedMed.delivery_method !== 'drinking_water' ? birdCount : undefined,
      costPesewas: parseInt(costPesewas) || 0,
      scheduledDate,
      notes: medNotes,
    });

    // Reset state
    setSelectedMedId('');
    setContainerTypeId('');
    setContainerCount(1);
    setMedNotes('');
    setCostPesewas('0');
    setShowMedModal(false);
  };

  return (
    <div className="space-y-4 mt-4">
      {healthTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Pill className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
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
            const med = medications.find(m => m.id === task.medication_id);

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
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${task.completed && !ws.inMeatWithdrawal ? 'text-muted-foreground' : ''}`}>
                            {task.product_name}
                          </p>
                          {task.blocked_reason && (
                            <Badge variant="destructive" className="text-[9px] h-3.5 px-1 py-0">{task.blocked_reason} BLOCKED</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                          <span>{task.duration_days}d course</span>
                          <span>•</span>
                          <span>Scheduled {format(new Date(task.scheduled_date), 'MMM d')}</span>
                          {task.computed_dose_amount && (
                            <>
                              <span>•</span>
                              <span className="text-primary/70">Dose: {task.computed_dose_amount} {task.computed_dose_unit}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {ws.isActive && <Badge className="text-[10px] h-4 px-1">Active</Badge>}
                          {task.completed && !ws.inMeatWithdrawal && !ws.inEggWithdrawal && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-green-100 text-green-700">Clear</Badge>
                          )}
                          {med && (
                            <span className="text-[10px] text-muted-foreground italic capitalize">{med.category} via {med.delivery_method.replace('_', ' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!task.completed && (
                      <Button size="sm" variant="outline" className="h-8 rounded-full text-xs shrink-0" onClick={() => onMarkComplete(task.id)}>
                        <Check className="h-3 w-3 mr-1" /> Complete
                      </Button>
                    )}
                  </div>

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

                  {task.notes && (
                    <p className="ml-10 text-xs text-muted-foreground whitespace-pre-line border-l-2 border-muted pl-2 mt-1">{task.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Medication Dialog */}
      <Dialog open={showMedModal} onOpenChange={setShowMedModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Treatment / Supplement</DialogTitle>
            <DialogDescription>
              Select product and setup dosing. Real-time safety matrix checks for vaccine and chemical conflicts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Scheduled Date</Label>
              <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Product</Label>
              <Select value={selectedMedId} onValueChange={setSelectedMedId}>
                <SelectTrigger><SelectValue placeholder="Choose product..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <div key={cat}>
                      <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase bg-muted/30 rounded-sm mt-1">{cat}s</div>
                      {medications
                        .filter(m => m.category === cat)
                        .map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMed && (
              <div className="space-y-3 rounded-lg bg-muted p-3 text-sm border border-muted-foreground/10">
                <div className="flex justify-between items-center border-b pb-1">
                  <span className="font-semibold text-xs capitalize text-muted-foreground">{selectedMed.category}</span>
                  <Badge variant="outline" className="text-[10px] py-0">{selectedMed.delivery_method.replace('_', ' ')}</Badge>
                </div>

                {/* Drinking Water Dosing Setup */}
                {selectedMed.delivery_method === 'drinking_water' && (
                  <div className="space-y-2 border-b pb-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Drinker Container</Label>
                        <Select value={containerTypeId} onValueChange={setContainerTypeId}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select container..." /></SelectTrigger>
                          <SelectContent>
                            {containerTypes.map(c => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">{c.name} ({c.volume_l}L)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Container Count</Label>
                        <Input type="number" min="1" className="h-8 text-xs" value={containerCount} onChange={e => setContainerCount(Math.max(1, parseInt(e.target.value) || 1))} />
                      </div>
                    </div>
                    {selectedContainer && (
                      <div className="flex justify-between text-xs font-semibold bg-primary/5 p-1.5 rounded">
                        <span>Total Water Volume:</span>
                        <span>{waterVolumeL} Liters</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Injection Dosing Setup */}
                {selectedMed.delivery_method.startsWith('injection') && (
                  <div className="space-y-2 border-b pb-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Injection Site:</span>
                        <p className="font-medium text-foreground">{getInjectionSite(selectedMed.delivery_method)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Bird Count</Label>
                        <Input type="number" min="1" className="h-8 text-xs" value={birdCount} onChange={e => setBirdCount(Math.max(1, parseInt(e.target.value) || 1))} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground">Computed Dose:</span>
                    {selectedMed.delivery_method === 'drinking_water' ? (
                      <p className="font-bold text-primary">{doseResult ? `${doseResult.amount} ${doseResult.unit}` : 'N/A'}</p>
                    ) : (
                      <p className="font-bold text-primary">{(getDosePerBirdMl(selectedMed.id) * birdCount).toFixed(1)} ml (total)</p>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-semibold">{selectedMed.withdrawal_meat_days > 0 || selectedMed.withdrawal_egg_days > 0 ? '5 days' : '3 days'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Meat Withdrawal:</span>
                    <p className={`font-semibold ${selectedMed.withdrawal_meat_days > 0 ? 'text-yellow-600 font-bold' : ''}`}>
                      {selectedMed.withdrawal_meat_days > 0 ? `${selectedMed.withdrawal_meat_days} days` : 'None'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Egg Withdrawal:</span>
                    <p className={`font-semibold ${selectedMed.withdrawal_egg_days > 0 ? 'text-yellow-600 font-bold' : ''}`}>
                      {selectedMed.withdrawal_egg_days > 0 ? `${selectedMed.withdrawal_egg_days} days` : 'None'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Conflicts Alert Area */}
            {conflicts.length > 0 && (
              <div className="space-y-2 mt-2">
                {conflicts.map((c, idx) => (
                  <div key={idx} className={`flex items-start gap-2 text-xs rounded-md p-2.5 border ${
                    c.severity === 'BLOCK' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                  }`}>
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{c.severity === 'BLOCK' ? '⚠️ BLOCKER: ' : '⚠️ WARNING: '}</span>
                      {c.message}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <Label>Cost (in Pesewas / optional)</Label>
              <Input type="number" min="0" value={costPesewas} onChange={e => setCostPesewas(e.target.value)} placeholder="Cost of treatment in pesewas..." />
            </div>

            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder="Symptoms, observations, or extra details..." rows={2} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowMedModal(false); setSelectedMedId(''); setMedNotes(''); }}>Cancel</Button>
            <Button onClick={handleAddMed} disabled={!selectedMed || hasBlock || medSubmitting}>
              {medSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
