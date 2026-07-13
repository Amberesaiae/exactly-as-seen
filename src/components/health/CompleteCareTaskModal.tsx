import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface CompleteCareTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (costPesewas: number) => Promise<void>;
  productName: string;
  taskType?: string;
  submitting?: boolean;
  /** Optional suggested major units (GHS) */
  defaultCostMajor?: string;
}

/**
 * Cost entry before completing a This Week care task — enables dual-pattern Book now / auto-ledger.
 */
export function CompleteCareTaskModal({
  open,
  onOpenChange,
  onConfirm,
  productName,
  taskType = 'care',
  submitting = false,
  defaultCostMajor = '',
}: CompleteCareTaskModalProps) {
  const [cost, setCost] = useState(defaultCostMajor);

  useEffect(() => {
    if (open) setCost(defaultCostMajor);
  }, [open, defaultCostMajor]);

  const handleConfirm = async () => {
    const pesewas = Math.round((parseFloat(cost) || 0) * 100);
    await onConfirm(pesewas);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Complete care task
          </DialogTitle>
          <DialogDescription>
            Mark <strong>{productName}</strong> ({taskType}) done. Enter cost so intensive systems auto-ledger and flexible systems can use <strong>Book now</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Task cost (GHS)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              className="font-bold"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground">
              Leave 0 if free / already expensed. Flexible farms get a Book now toast when cost &gt; 0.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-full gap-2" onClick={handleConfirm} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Complete</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
