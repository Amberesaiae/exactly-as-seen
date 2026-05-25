import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

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

  const reset = () => {
    setAmount(''); setCategory(''); setDescription(''); setBatchId('none');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddExpense({
      amount: parseFloat(amount),
      category,
      description,
      batch_id: batchId === 'none' ? null : batchId,
      date,
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
    });
    setRevenueOpen(false);
    reset();
  };

  return (
    <>
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleExpenseSubmit}>
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
              <DialogDescription>Add a new expense entry for your farm.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input id="amount" type="number" step="0.01" className="col-span-3" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feed">Feed</SelectItem>
                    <SelectItem value="medication">Medication</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input id="date" type="date" className="col-span-3" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="w-full rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                {submitting ? 'Saving...' : 'Record Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={revenueOpen} onOpenChange={setRevenueOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleRevenueSubmit}>
            <DialogHeader>
              <DialogTitle>Record Revenue</DialogTitle>
              <DialogDescription>Add a new revenue entry for your farm.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rev-amount" className="text-right">Amount</Label>
                <Input id="rev-amount" type="number" step="0.01" className="col-span-3" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="egg_sales">Egg Sales</SelectItem>
                    <SelectItem value="bird_sales">Bird Sales</SelectItem>
                    <SelectItem value="manure_sales">Manure Sales</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rev-date" className="text-right">Date</Label>
                <Input id="rev-date" type="date" className="col-span-3" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rev-desc">Description</Label>
                <Textarea id="rev-desc" value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="w-full rounded-full">
                {submitting ? 'Saving...' : 'Record Revenue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
