import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Calculator, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EggSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    crates: number,
    looses: number,
    pricePerCrate: number,
    pricePerLoose: number,
    sizeCategory: string,
    buyer: string,
    paymentMethod: string,
    paymentStatus: string,
    notes: string
  }) => Promise<void>;
  submitting: boolean;
  hasActiveWithdrawal?: boolean;
}

/**
 * Commercial-Grade Egg Sale Modal.
 * Implements Crate (30 eggs) vs Loose logic and Payment Metadata.
 * Aligned with 'Elite' spec for West African commercial poultry.
 */
export function EggSaleDialog({ open, onOpenChange, onSubmit, submitting, hasActiveWithdrawal }: EggSaleDialogProps) {
  const { currency } = useAuth();
  const [crates, setCrates] = useState('0');
  const [looses, setLooses] = useState('0');
  const [priceCrate, setPriceCrate] = useState('45.00'); // Default market avg
  const [priceLoose, setPriceLoose] = useState('1.50');
  const [size, setSize] = useState('medium');
  const [buyer, setBuyer] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payStatus, setPayStatus] = useState('paid');
  const [notes, setNotes] = useState('');

  const totalEggs = useMemo(() => (parseInt(crates) || 0) * 30 + (parseInt(looses) || 0), [crates, looses]);
  const totalAmount = useMemo(() => 
    (parseInt(crates) || 0) * (parseFloat(priceCrate) || 0) + 
    (parseInt(looses) || 0) * (parseFloat(priceLoose) || 0)
  , [crates, priceCrate, looses, priceLoose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalEggs <= 0) return;
    
    await onSubmit({
      crates: parseInt(crates) || 0,
      looses: parseInt(looses) || 0,
      pricePerCrate: parseFloat(priceCrate) || 0,
      pricePerLoose: parseFloat(priceLoose) || 0,
      sizeCategory: size,
      buyer,
      paymentMethod: payMethod,
      paymentStatus: payStatus,
      notes
    });
    
    onOpenChange(false);
    reset();
  };

  const reset = () => {
    setCrates('0'); setLooses('0'); setBuyer(''); setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[95vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Record Egg Sale
            </DialogTitle>
            <DialogDescription>Commercial-grade sales recording (Crates & Looses).</DialogDescription>
          </DialogHeader>

          {hasActiveWithdrawal && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-xs flex flex-col gap-1.5 animate-pulse mt-4">
              <span className="font-bold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> BLOCK: ACTIVE WITHDRAWAL PERIOD</span>
              <p>Flock safety protocol: Cannot sell eggs during withdrawal. Discard eggs as specified by vet.</p>
            </div>
          )}

          <div className="space-y-6 py-4">
            {/* 1. Grading & Size */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Grading & Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="large">Large Eggs (60g+)</SelectItem>
                  <SelectItem value="medium">Medium Eggs (50-60g)</SelectItem>
                  <SelectItem value="small">Small Eggs (40-50g)</SelectItem>
                  <SelectItem value="duck">Duck Eggs (75g+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. Quantities (Crates vs Loose) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crates">Crates (30 eggs)</Label>
                <Input id="crates" type="number" value={crates} onChange={e => setCrates(e.target.value)} className="h-11 font-bold" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="looses">Loose Eggs</Label>
                <Input id="looses" type="number" value={looses} onChange={e => setLooses(e.target.value)} className="h-11 font-bold" />
              </div>
            </div>

            {/* 3. Pricing (Per Unit) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price-crate">Price / Crate ({currency})</Label>
                <Input id="price-crate" type="number" step="0.01" value={priceCrate} onChange={e => setPriceCrate(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-loose">Price / Loose ({currency})</Label>
                <Input id="price-loose" type="number" step="0.01" value={priceLoose} onChange={e => setPriceLoose(e.target.value)} className="h-11" />
              </div>
            </div>

            {/* 4. Calculation Synergy */}
            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                <Calculator className="h-3 w-3" /> Sale Summary
              </div>
              <div className="flex justify-between items-baseline">
                <p className="text-sm font-medium text-muted-foreground">Total Units:</p>
                <p className="text-lg font-black text-foreground">{totalEggs} <span className="text-[10px] font-bold uppercase">Eggs</span></p>
              </div>
              <div className="flex justify-between items-baseline border-t border-primary/10 pt-2">
                <p className="text-sm font-bold text-primary">Gross Revenue:</p>
                <p className="text-2xl font-black text-primary">{currency} {totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* 5. Payment & Customer Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit">Credit / Debt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={payStatus} onValueChange={setPayStatus}>
                  <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Fully Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><User className="h-3 w-3" /> Buyer / Customer</Label>
              <Input value={buyer} onChange={e => setBuyer(e.target.value)} placeholder="e.g. Market Vendor A" className="h-10" />
            </div>

            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional details..." rows={2} className="text-xs" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={submitting || totalEggs <= 0 || hasActiveWithdrawal} className="flex-1 rounded-full py-6 text-base font-black shadow-lg shadow-primary/20">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm & Ledger Sale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Loader2(props: any) {
  return <Calculator {...props} />;
}
