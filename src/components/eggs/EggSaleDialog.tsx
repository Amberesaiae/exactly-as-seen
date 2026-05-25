import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EggSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (qty: number, price: number, size: string, buyer: string, notes: string) => Promise<void>;
  submitting: boolean;
}

export function EggSaleDialog({ open, onOpenChange, onSubmit, submitting }: EggSaleDialogProps) {
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('medium');
  const [buyer, setBuyer] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(parseInt(qty), parseFloat(price), size, buyer, notes);
    onOpenChange(false);
    setQty(''); setPrice(''); setBuyer(''); setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Egg Sale</DialogTitle>
            <DialogDescription>Enter sales quantity, price and buyer info.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity (Eggs)</Label>
                <Input id="qty" type="number" value={qty} onChange={e => setQty(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Unit Price (GHS)</Label>
                <Input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Size Category</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer">Buyer Name</Label>
              <Input id="buyer" value={buyer} onChange={e => setBuyer(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full rounded-full">
              {submitting ? 'Recording...' : 'Complete Sale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
