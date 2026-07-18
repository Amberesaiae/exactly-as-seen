import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, Droplets, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { detectConflicts } from '@/lib/medication-conflicts';
import { computeDose } from '@/lib/dosing';
import type { Database } from '@/integrations/supabase/types';

type Medication = Database['public']['Tables']['medications']['Row'];
type ContainerType = Database['public']['Tables']['container_types']['Row'];
type HealthTask = Database['public']['Tables']['health_tasks']['Row'];
type Batch = Database['public']['Tables']['batches']['Row'];

interface AddMedicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (params: any) => void;
  medications: Medication[];
  containerTypes: ContainerType[];
  healthTasks: HealthTask[];
  waterSourceChlorinated: boolean;
  batch: Batch | undefined;
  submitting: boolean;
  waterRatePesewas?: number | null;
  onUpdateWaterRate?: (rate: number | null) => void;
}

/**
 * Standardized treatment/supplement recording interface.
 * Implements safety conflict detection and water utility configuration.
 */
export function AddMedicationModal({
  open, onOpenChange, onAdd, medications, containerTypes, healthTasks, waterSourceChlorinated, batch, submitting, waterRatePesewas, onUpdateWaterRate
}: AddMedicationModalProps) {
  const [selectedMedId, setSelectedMedId] = useState<string>('');
  const [containerTypeId, setContainerTypeId] = useState<string>('');
  const [containerCount, setContainerCount] = useState<number>(1);
  const [birdCount, setBirdCount] = useState<number>(100);
  const [medNotes, setMedNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [localWaterRate, setLocalWaterRate] = useState<string>(waterRatePesewas?.toString() || '');

  useEffect(() => {
    if (batch?.current_population) setBirdCount(batch.current_population);
  }, [batch]);

  useEffect(() => {
    if (waterRatePesewas !== undefined) setLocalWaterRate(waterRatePesewas?.toString() || '');
  }, [waterRatePesewas]);

  const selectedMed = medications.find(m => m.id === selectedMedId) || null;
  const selectedContainer = containerTypes.find(c => c.id === containerTypeId) || null;
  const waterVolumeL = selectedContainer ? Number(selectedContainer.volume_l) * containerCount : 0;
  const doseResult = selectedMed ? computeDose(selectedMed, waterVolumeL) : null;

  const conflicts = selectedMed ? detectConflicts({
    newMed: selectedMed,
    newDate: scheduledDate || format(new Date(), 'yyyy-MM-dd'),
    newDuration: (selectedMed as { duration_days?: number }).duration_days || 5,
    neighborhood: healthTasks.map(t => ({ task: t, med: medications.find(m => m.id === t.medication_id) })).filter(i => i.med),
    waterSourceChlorinated,
  }) : [];

  const hasBlock = conflicts.some(c => c.severity === 'BLOCK');
  const categories = Array.from(new Set(medications.map(m => m.category)));

  const handleAdd = () => {
    if (!selectedMed || hasBlock) return;

    if (onUpdateWaterRate && localWaterRate !== (waterRatePesewas?.toString() || '')) {
      onUpdateWaterRate(localWaterRate ? parseFloat(localWaterRate) : null);
    }

    onAdd({
      medicationId: selectedMed.id,
      taskType: selectedMed.category === 'supplement' ? 'supplement' : 'medication',
      durationDays: selectedMed.withdrawal_meat_days > 0 || selectedMed.withdrawal_egg_days > 0 ? 5 : 3,
      withdrawalMeatDays: selectedMed.withdrawal_meat_days,
      withdrawalEggDays: selectedMed.withdrawal_egg_days,
      dosePerGallon: selectedMed.delivery_method === 'drinking_water' ? `${selectedMed.dose_per_gallon || 1.0} per gallon` : undefined,
      indication: selectedMed.category,
      containerTypeId: selectedMed.delivery_method === 'drinking_water' ? containerTypeId : undefined,
      containerCount: selectedMed.delivery_method === 'drinking_water' ? containerCount : undefined,
      waterVolumeL: selectedMed.delivery_method === 'drinking_water' ? waterVolumeL : undefined,
      computedDoseAmount: selectedMed.delivery_method === 'drinking_water' ? doseResult?.amount : (0.2 * birdCount),
      computedDoseUnit: selectedMed.delivery_method === 'drinking_water' ? doseResult?.unit : 'ml',
      birdCount: selectedMed.delivery_method !== 'drinking_water' ? birdCount : undefined,
      costPesewas: 0, // Manual expense handling is done separately via financial dialogs if not auto-calculated
      scheduledDate,
      notes: medNotes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Treatment / Supplement</DialogTitle>
          <DialogDescription>Select product and setup dosing.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Droplets className="h-3.5 w-3.5" />
                <span>WATER UTILITY RATE</span>
              </div>
              <a 
                href="https://www.gwcl.com.gh/tariffs/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                Check latest rates <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Rate (Pesewas/Liter)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  className="h-8 text-xs font-bold"
                  value={localWaterRate}
                  onChange={e => setLocalWaterRate(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Used to auto-calculate batch water costs in the ledger. Set to 0 to exclude.
              </p>
            </div>
          </div>

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
                    {medications.filter(m => m.category === cat).map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
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
                  {selectedContainer && <div className="flex justify-between text-xs font-semibold bg-primary/5 p-1.5 rounded"><span>Total Water Volume:</span><span>{waterVolumeL} Liters</span></div>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div><span className="text-muted-foreground">Computed Dose:</span><p className="font-bold text-primary">{doseResult ? `${doseResult.amount} ${doseResult.unit}` : 'N/A'}</p></div>
                <div><span className="text-muted-foreground">Meat Withdrawal:</span><p className={`font-semibold ${selectedMed.withdrawal_meat_days > 0 ? 'text-yellow-600 font-bold' : ''}`}>{selectedMed.withdrawal_meat_days > 0 ? `${selectedMed.withdrawal_meat_days} days` : 'None'}</p></div>
              </div>
            </div>
          )}

          {conflicts.map((c, idx) => (
            <div key={idx} className={`flex items-start gap-2 text-xs rounded-md p-2.5 border ${c.severity === 'BLOCK' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div><span className="font-bold">{c.severity === 'BLOCK' ? '⚠️ BLOCKER: ' : '⚠️ WARNING: '}</span>{c.message}</div>
            </div>
          ))}

          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder="Symptoms, observations, or extra details..." rows={2} />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!selectedMed || hasBlock || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
