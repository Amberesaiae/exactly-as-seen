import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { autoCreateRevenue } from '@/lib/synergy';
import { cleanupBatchCompletion } from '@/lib/batch-utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { canTerminateNormal } from '@/lib/safety-gates';
import type { Database } from '@/integrations/supabase/types';

type TerminateBatchReturn = Database['public']['Functions']['terminate_batch']['Returns'];

interface TerminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: any;
  onSuccess: (updatedBatch: any) => void;
}

export function TerminationDialog({ open, onOpenChange, batch, onSuccess }: TerminationDialogProps) {
  const { currency } = useAuth();
  const [terminationMode, setTerminationMode] = useState<'normal' | 'emergency'>('normal');
  const [saleRevenue, setSaleRevenue] = useState('0');
  const [completing, setCompleting] = useState(false);

  const terminateBatch = async () => {
    if (!batch) return;
    
    if (!canTerminateNormal(batch, terminationMode)) {
      toast.error('Cannot terminate normally during withdrawal');
      return;
    }

    setCompleting(true);
    const revenueAmt = parseFloat(saleRevenue) || 0;
    const revenueCategory = batch.species === 'broiler' ? 'meat_sales' : 'bird_sales';
    const revenuePesewas = Math.round(revenueAmt * 100);

    const terminateArgs = {
      p_farm_id: batch.farm_id,
      p_batch_id: batch.id,
      p_mode: terminationMode,
      p_revenue_pesewas: revenuePesewas,
      p_revenue_category: revenueCategory,
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const { queueRpc } = await import('@/lib/sync');
      await queueRpc('terminate_batch', terminateArgs, `terminate:${batch.id}`);
      toast.warning('Offline — termination queued; will sync when online');
      onSuccess({ ...batch, status: 'completed', phase: 'terminated', termination_reason: terminationMode });
      setCompleting(false);
      onOpenChange(false);
      return;
    }

    // Prefer atomic RPC (status + house release + revenue + cleanup)
    const { data: rpcData, error: rpcError } = await supabase.rpc('terminate_batch', terminateArgs);

    if (rpcError) {
      console.warn('terminate_batch RPC failed:', rpcError.message);
      setCompleting(false);
      throw new Error(rpcError.message);
    }

    if ((rpcData as TerminateBatchReturn)?.ok === false) {
      toast.error('Terminate failed');
      setCompleting(false);
      return;
    }

    toast.success('Batch terminated successfully');
    onSuccess({ ...batch, status: 'completed', phase: 'terminated', termination_reason: terminationMode });
    setCompleting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Terminate Batch — {batch?.name}</DialogTitle>
          <DialogDescription>
            Close the flock cycle, free the house occupation, and record any final birds sale revenue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Termination Mode</Label>
            <Select value={terminationMode} onValueChange={(val: any) => setTerminationMode(val)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal Culling (Harvest & Sale)</SelectItem>
                <SelectItem value="emergency">Emergency Termination (Depopulation/Disease)</SelectItem>
              </SelectContent>
            </Select>
            {terminationMode === 'normal' && batch?.has_active_withdrawal && (
              <p className="text-xs text-red-600 font-medium bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-100 dark:border-red-900/30">
                ⚠️ Cannot terminate batch normally during active withdrawal period. Emergency terminate is still available.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Total Bird Sales Revenue ({currency})</Label>
            <Input 
              type="number" 
              min="0" 
              step="0.01" 
              value={saleRevenue} 
              onChange={e => setSaleRevenue(e.target.value)} 
              disabled={terminationMode === 'emergency'}
            />
            <p className="text-xs text-muted-foreground">
              Auto-logs bird sales revenue under your farm financial ledger.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
          <Button 
            onClick={terminateBatch} 
            disabled={completing || (terminationMode === 'normal' && batch?.has_active_withdrawal)} 
            className="rounded-full gap-1.5"
            variant={terminationMode === 'emergency' ? 'destructive' : 'default'}
          >
            {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Termination'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
