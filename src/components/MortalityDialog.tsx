import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { recordMortality } from '@/lib/batch-utils';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

interface MortalityDialogProps {
  batch: Batch | null;
  onClose: () => void;
  onSuccess: (batchId: string, newPopulation: number, count: number) => void;
  farmId: string | null;
}

export function MortalityDialog({ batch, onClose, onSuccess, farmId }: MortalityDialogProps) {
  const [count, setCount] = useState('1');
  const [cause, setCause] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRecord = async () => {
    if (!batch || !farmId) return;
    
    const countNum = parseInt(count) || 0;
    if (countNum <= 0) {
      toast.error('Count must be positive');
      return;
    }
    if (countNum > batch.current_population) {
      toast.error('Count exceeds current population');
      return;
    }

    setSubmitting(true);
    try {
      const newPop = await recordMortality({
        batchId: batch.id,
        farmId,
        batchName: batch.name,
        currentPopulation: batch.current_population,
        count: countNum,
        cause: cause || undefined,
        notes: notes || undefined,
      });

      if (newPop === null) {
        toast.error('Failed to record mortality');
        return;
      }

      toast.success(`Recorded ${countNum} mortality for ${batch.name}`);
      onSuccess(batch.id, newPop, countNum);
      
      // Reset state for next use
      setCount('1');
      setCause('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error recording mortality:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!batch} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Mortality — {batch?.name}</DialogTitle>
          <DialogDescription>
            Record bird deaths for this batch. The population count will be updated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="count">Number of birds</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max={batch?.current_population}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cause">Cause (optional)</Label>
            <Input
              id="cause"
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              placeholder="e.g., Disease, Predator, Unknown"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleRecord} disabled={submitting}>
            {submitting ? 'Recording...' : 'Record Mortality'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
