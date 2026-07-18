import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, Info, AlertTriangle } from 'lucide-react';

interface VaccinationFulfillmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (costPesewas: number, notes: string) => Promise<void>;
  vaccineName: string;
  batchName: string;
  submitting: boolean;
}

/**
 * Spec-Aligned Vaccination Fulfillment Modal.
 * Implements the 5-Step Vaccination Protocol and checklist to ensure biosecurity.
 */
export function VaccinationFulfillmentModal({
  open, onOpenChange, onConfirm, vaccineName, batchName, submitting
}: VaccinationFulfillmentModalProps) {
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [checks, setChecklist] = useState({
    thirst: false,
    dechlorinated: false,
    volume: false,
    duration: false
  });

  const allChecked = Object.values(checks).every(v => v);

  const handleConfirm = async () => {
    if (!allChecked) return;
    await onConfirm(Math.round(parseFloat(cost) * 100) || 0, notes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Complete Vaccination
          </DialogTitle>
          <DialogDescription>
            Administering <strong>{vaccineName}</strong> to <strong>{batchName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* 1. Protocol Box */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <p className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Info className="h-3.5 w-3.5" /> 📋 VACCINATION PROTOCOL
            </p>
            <div className="space-y-2.5">
              {[
                "Remove water 2-3 hours before (make birds thirsty)",
                "Mix vaccine in half of daily water prescribed",
                "Ensure birds consume vaccine water within 1 hour",
                "Provide anti-stress for the next 2 days"
              ].map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                  <p className="text-xs font-medium text-foreground leading-tight">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Completion Checklist */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase px-1">Confirmation Checklist</p>
            <div className="space-y-2">
              {[
                { id: 'thirst', label: "Withheld water for 2-3 hours before administration" },
                { id: 'dechlorinated', label: "Used dechlorinated/clean water" },
                { id: 'volume', label: "Mixed in half-daily water volume" },
                { id: 'duration', label: "Birds consumed everything within 1 hour" }
              ].map(item => (
                <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
                  <Checkbox 
                    id={item.id} 
                    checked={checks[item.id as keyof typeof checks]} 
                    onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, [item.id]: !!checked }))}
                  />
                  <Label htmlFor={item.id} className="text-xs font-medium leading-none cursor-pointer">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Automatic Follow-up Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-amber-800">AUTOMATIC SYNERGY</p>
              <p className="text-[10px] text-amber-700 leading-relaxed">
                The system will automatically schedule <strong>Anti-Stress</strong> and <strong>Multivitamins</strong> for the next 48 hours to aid recovery.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Vaccine Purchase Cost (GHS)</Label>
              <Input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" className="font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observations (Optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Flock reaction, etc..." rows={2} className="text-xs" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!allChecked || submitting} 
            className="rounded-full px-8 gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Finalize Vaccination</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
