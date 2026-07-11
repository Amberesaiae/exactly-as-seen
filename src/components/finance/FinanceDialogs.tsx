import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

// ─── Canonical 9 expense categories (DB CHECK / fifth sprint) ────────────────
const EXPENSE_CATEGORIES = [
  { value: 'feed_and_nutrition',      label: 'Feed & Nutrition' },
  { value: 'health_and_medicine',     label: 'Health & Medicine' },
  { value: 'labor_and_workers',       label: 'Labor & Workers' },
  { value: 'utilities_and_services',  label: 'Utilities & Services' },
  { value: 'equipment_and_tools',     label: 'Equipment & Tools' },
  { value: 'transport_and_delivery',  label: 'Transport & Delivery' },
  { value: 'housing_and_facilities',  label: 'Housing & Facilities' },
  { value: 'chicks_and_birds',        label: 'Chicks & Birds' },
  { value: 'other_expenses',          label: 'Other Expenses' },
] as const;

// ─── Canonical 5 revenue categories (DB CHECK / fifth sprint) ────────────────
const REVENUE_CATEGORIES = [
  { value: 'egg_sales',    label: 'Egg Sales' },
  { value: 'bird_sales',   label: 'Bird Sales (Live)' },
  { value: 'meat_sales',   label: 'Meat Sales (Dressed)' },
  { value: 'manure_sales', label: 'Manure Sales' },
  { value: 'other_revenue', label: 'Other Revenue' },
] as const;

const PAYMENT_METHODS = [
  { value: 'cash',          label: 'Cash' },
  { value: 'mobile_money',  label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit',        label: 'Credit' },
] as const;

const PAYMENT_STATUSES = [
  { value: 'paid',    label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial Payment' },
] as const;

interface FinanceDialogsProps {
  expenseOpen: boolean;
  setExpenseOpen: (open: boolean) => void;
  revenueOpen: boolean;
  setRevenueOpen: (open: boolean) => void;
  batches: Batch[];
  onAddExpense: (data: any) => Promise<void>;
  onAddRevenue: (data: any) => Promise<void>;
  submitting: boolean;
}

export function FinanceDialogs({
  expenseOpen,
  setExpenseOpen,
  revenueOpen,
  setRevenueOpen,
  batches,
  onAddExpense,
  onAddRevenue,
  submitting,
}: FinanceDialogsProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [batchId, setBatchId] = useState('none');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [buyer, setBuyer] = useState('');

  const selectedBatchData = batches.find(b => b.id === batchId);
  const showWithdrawalWarning = selectedBatchData?.has_active_withdrawal && 
    ['egg_sales', 'bird_sales', 'meat_sales'].includes(category);

  const reset = () => {
    setAmount(''); setCategory(''); setDescription(''); setBatchId('none');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash'); setPaymentStatus('paid'); setBuyer('');
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddExpense({
      amount: parseFloat(amount),
      category,
      description,
      batch_id: batchId === 'none' ? null : batchId,
      date,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
    });
    setExpenseOpen(false);
    reset();
  };

  const handleRevenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddRevenue({
      amount: parseFloat(amount),
      category,
      description,
      batch_id: batchId === 'none' ? null : batchId,
      date,
      buyer: buyer || null,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
    });
    setRevenueOpen(false);
    reset();
  };

  return (
    <>
      {/* ── Expense Dialog ── */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleExpenseSubmit}>
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
              <DialogDescription>Add a new expense entry for your farm.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Amount */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="exp-amount" className="text-right">Amount (GHS)</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="col-span-3"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Category — all 9 canonical */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Batch</Label>
                <Select value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General (No Batch)</SelectItem>
                    {batches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="exp-date" className="text-right">Date</Label>
                <Input
                  id="exp-date"
                  type="date"
                  className="col-span-3"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="exp-desc">Description</Label>
                <Textarea
                  id="exp-desc"
                  placeholder="What was this expense for?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={submitting || !category}
                className="w-full rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {submitting ? 'Saving...' : 'Record Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Revenue Dialog ── */}
      <Dialog open={revenueOpen} onOpenChange={setRevenueOpen}>
        <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleRevenueSubmit}>
            <DialogHeader>
              <DialogTitle>Record Revenue</DialogTitle>
              <DialogDescription>Add a new revenue entry for your farm.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Amount */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rev-amount" className="text-right">Amount (GHS)</Label>
                <Input
                  id="rev-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="col-span-3"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Category — all 5 canonical */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVENUE_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Batch</Label>
                <Select value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General (No Batch)</SelectItem>
                    {batches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rev-date" className="text-right">Date</Label>
                <Input
                  id="rev-date"
                  type="date"
                  className="col-span-3"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Buyer (optional) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rev-buyer" className="text-right">Buyer</Label>
                <Input
                  id="rev-buyer"
                  type="text"
                  placeholder="Customer name (optional)"
                  className="col-span-3"
                  value={buyer}
                  onChange={e => setBuyer(e.target.value)}
                />
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="rev-desc">Description</Label>
                <Textarea
                  id="rev-desc"
                  placeholder="Details about this sale or revenue"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>

              {showWithdrawalWarning && (
                <div className="bg-red-50 border border-red-200 text-red-900 rounded-lg p-3 text-xs flex flex-col gap-1.5 animate-pulse">
                  <span className="font-bold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-600" /> ACTIVE WITHDRAWAL PERIOD</span>
                  <p>This batch has recently received medication. Selling meat or eggs during this period is unsafe and against production-grade safety protocols.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={submitting || !category}
                className="w-full rounded-full"
              >
                {submitting ? 'Saving...' : 'Record Revenue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
