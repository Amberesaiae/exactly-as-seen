import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Egg, AlertCircle } from 'lucide-react';

interface EggCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (total: number, broken: number, dirty: number, size: string, notes: string) => Promise<void>;
  submitting: boolean;
  species?: string;
  week?: number;
}

/**
 * Production-Grade Egg Collection Modal.
 * Implements Size-Based Grading including Pullet (pre-lay) and Duck categories.
 * Aligned with 'Elite' spec for West African commercial layers.
 */
export function EggCollectionDialog({ open, onOpenChange, onSubmit, submitting, species, week = 0 }: EggCollectionDialogProps) {
  const [total, setTotal] = useState('');
  const [broken, setBroken] = useState('0');
  const [dirty, setDirty] = useState('0');
  const [size, setSize] = useState(() => (week >= 17 && week <= 20) ? 'pullet' : 'medium');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(parseInt(total), parseInt(broken), parseInt(dirty), size, notes);
    onOpenChange(false);
    setTotal(''); setBroken('0'); setDirty('0'); setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Egg className="h-5 w-5 text-primary" />
              Daily Egg Collection
            </DialogTitle>
            <DialogDescription>Record total counts and perform initial grading.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* 1. Total Count */}
            <div className="space-y-2">
              <Label htmlFor="total" className="text-xs font-bold text-muted-foreground uppercase">Total Collected Eggs</Label>
              <Input id="total" type="number" className="h-12 text-xl font-black" value={total} onChange={e => setTotal(e.target.value)} placeholder="0" required />
            </div>

            {/* 2. Quality Grading */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="broken" className="text-[10px] font-bold text-destructive uppercase">Broken / Cracked</Label>
                <Input id="broken" type="number" value={broken} onChange={e => setBroken(e.target.value)} className="h-10 border-destructive/20 focus:border-destructive" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dirty" className="text-[10px] font-bold text-amber-600 uppercase">Dirty / Stained</Label>
                <Input id="dirty" type="number" value={dirty} onChange={e => setDirty(e.target.value)} className="h-10 border-amber-200 focus:border-amber-500" />
              </div>
            </div>

            {/* 3. Size Grading */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Size Category</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="large">Large (60-70g)</SelectItem>
                  <SelectItem value="medium">Medium (50-60g)</SelectItem>
                  <SelectItem value="small">Small (40-50g)</SelectItem>
                  <SelectItem value="pullet">Pullet (&lt;40g - Not for Sale)</SelectItem>
                  {species === 'duck' && <SelectItem value="duck">Duck Egg (75g+)</SelectItem>}
                </SelectContent>
              </Select>
              {size === 'pullet' && (
                <div className="flex gap-2 items-start bg-blue-50 text-blue-800 p-2.5 rounded-lg border border-blue-100 text-[10px] leading-tight mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <p>Pullet eggs are generally smaller first-production eggs and typically sold at a discount or discarded as per spec.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs font-bold text-muted-foreground uppercase">Internal Notes</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations..." rows={2} className="text-xs" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={submitting || !total} className="flex-1 rounded-full py-6 text-base font-bold shadow-lg shadow-primary/20">
              Confirm Collection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
