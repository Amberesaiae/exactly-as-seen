import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface EggCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (total: number, broken: number, dirty: number, size: string, notes: string) => Promise<void>;
  submitting: boolean;
}

export function EggCollectionDialog({ open, onOpenChange, onSubmit, submitting }: EggCollectionDialogProps) {
  const [total, setTotal] = useState('');
  const [broken, setBroken] = useState('0');
  const [dirty, setDirty] = useState('0');
  const [size, setSize] = useState('medium');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(parseInt(total), parseInt(broken), parseInt(dirty), size, notes);
    onOpenChange(false);
    setTotal(''); setBroken('0'); setDirty('0'); setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Collection</DialogTitle>
            <DialogDescription>Enter total eggs collected and grading details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total" className="text-right">Total</Label>
              <Input id="total" type="number" className="col-span-3" value={total} onChange={e => setTotal(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="broken">Broken</Label>
                <Input id="broken" type="number" value={broken} onChange={e => setBroken(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dirty">Dirty</Label>
                <Input id="dirty" type="number" value={dirty} onChange={e => setDirty(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="col-span-3">
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full rounded-full">
              {submitting ? 'Saving...' : 'Record Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
