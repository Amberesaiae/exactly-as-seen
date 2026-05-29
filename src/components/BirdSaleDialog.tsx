import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { recordBirdSale } from '@/lib/synergy';
import { toast } from 'sonner';
import { AlertTriangle, ShoppingCart } from 'lucide-react';
import { PrivacyMask } from '@/components/ui/PrivacyMask';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

interface BirdSaleDialogProps {
  batch: Batch | null;
  onClose: () => void;
  onSuccess: (batchId: string, newPopulation: number) => void;
  farmId: string | null;
}

export function BirdSaleDialog({ batch, onClose, onSuccess, farmId }: BirdSaleDialogProps) {
  const { currency } = useAuth();
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('0');
  const [buyer, setBuyer] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const qtyNum = parseInt(qty) || 0;
  const priceNum = parseFloat(unitPrice) || 0;
  const totalAmount = qtyNum * priceNum;

  const handleRecord = async () => {
    if (!batch || !farmId) return;
    
    if (qtyNum <= 0) {
      toast.error('Quantity must be positive');
      return;
    }
    if (qtyNum > batch.current_population) {
      toast.error('Not enough birds in this flock');
      return;
    }
    if (priceNum <= 0) {
      toast.error('Enter a valid unit price');
      return;
    }

    setSubmitting(true);
    try {
      const result = await recordBirdSale({
        farmId,
        batchId: batch.id,
        quantity: qtyNum,
        unitPrice: priceNum,
        totalAmount,
        buyer: buyer || undefined,
        notes: notes || undefined,
        currentPopulation: batch.current_population,
      });

      if (!result) {
        setSubmitting(false);
        return;
      }

      toast.success(`Successfully sold ${qtyNum} birds for ${currency} ${totalAmount.toFixed(2)}`);
      onSuccess(batch.id, result.newPop);
      
      // Reset state
      setQty('1');
      setUnitPrice('0');
      setBuyer('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error recording bird sale:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!batch} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Bird Sale — {batch?.name}</DialogTitle>
          <DialogDescription>
            Sell birds from this flock. This will record revenue and update the population automatically.
          </DialogDescription>
        </DialogHeader>

        {batch?.has_active_withdrawal && (
          <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-3 text-xs flex flex-col gap-1.5 animate-pulse">
            <span className="font-bold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-600" /> ACTIVE WITHDRAWAL PERIOD</span>
            <p>This flock has active medication withdrawal. Selling birds now is unsafe and against safety protocols.</p>
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sale-qty">Quantity (Birds)</Label>
              <Input
                id="sale-qty"
                type="number"
                min="1"
                max={batch?.current_population}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-price">Unit Price ({currency})</Label>
              <Input
                id="unit-price"
                type="number"
                min="0.01"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyer">Buyer Name</Label>
            <Input
              id="buyer"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 p-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">Total Revenue:</span>
            <span className="text-lg font-black text-green-800 dark:text-green-300">{currency} <PrivacyMask value={totalAmount.toFixed(2)} /></span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale-notes">Notes (optional)</Label>
            <Textarea
              id="sale-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about the sale..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleRecord} 
            disabled={submitting || (batch?.has_active_withdrawal ?? false)}
            className="rounded-full gap-1.5"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShoppingCart className="h-4 w-4" /> Record Sale</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
