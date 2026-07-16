import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Download, Trash2, Loader2, FileJson, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { isOffline, queueWrite } from '@/lib/sync';
import type { Database } from '@/integrations/supabase/types';

type Farm = Database['public']['Tables']['farms']['Row'];

interface DataTabProps {
  farm: Farm | null;
  signOut: () => Promise<void>;
}

export default function DataTab({ farm, signOut }: DataTabProps) {
  const [exporting, setExporting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Full Database JSON Export
  const exportData = async () => {
    if (!farm) return;
    setExporting(true);
    try {
      const [batchesRes, eggsRes, feedRes, healthRes, mortalityRes, expensesRes, revenueRes, stockRes] = await Promise.all([
        supabase.from('batches').select('*').eq('farm_id', farm.id),
        supabase.from('egg_collections').select('*').eq('farm_id', farm.id),
        supabase.from('feed_schedules').select('*').eq('farm_id', farm.id),
        supabase.from('health_tasks').select('*').eq('farm_id', farm.id),
        supabase.from('mortality_records').select('*').eq('farm_id', farm.id),
        supabase.from('expenses').select('*').eq('farm_id', farm.id),
        supabase.from('revenue').select('*').eq('farm_id', farm.id),
        supabase.from('stock_items').select('*').eq('farm_id', farm.id),
      ]);

      const dataBundle = {
        exported_at: new Date().toISOString(),
        farm: { name: farm.name, type: farm.farm_type, region: farm.location_region, district: farm.location_district },
        batches: batchesRes.data ?? [],
        egg_collections: eggsRes.data ?? [],
        feed_schedules: feedRes.data ?? [],
        health_tasks: healthRes.data ?? [],
        mortality_records: mortalityRes.data ?? [],
        expenses: expensesRes.data ?? [],
        revenue: revenueRes.data ?? [],
        stock_items: stockRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(dataBundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lampfarms-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Farm data exported successfully');

      await supabase.from('activity_log').insert({
        farm_id: farm.id,
        event_type: 'export',
        description: 'Full farm data exported',
      });
    } catch {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // CSV Export
  const exportCSV = async () => {
    if (!farm) return;
    setExporting(true);
    try {
      const [expensesRes, revenueRes] = await Promise.all([
        supabase.from('expenses').select('date, category, description, amount_pesewas').eq('farm_id', farm.id).order('date', { ascending: false }),
        supabase.from('revenue').select('date, category, description, amount_pesewas, buyer').eq('farm_id', farm.id).order('date', { ascending: false }),
      ]);

      let csv = 'Type,Date,Category,Description,Amount,Buyer\n';
      (revenueRes.data ?? []).forEach(r => {
        const amt = Number(r.amount_pesewas ?? 0) / 100;
        csv += `Revenue,${r.date},${r.category},"${r.description}",${amt},${r.buyer || ''}\n`;
      });
      (expensesRes.data ?? []).forEach(e => {
        const amt = Number(e.amount_pesewas ?? 0) / 100;
        csv += `Expense,${e.date},${e.category},"${e.description}",-${amt},\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lampfarms-finance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Financial data exported as CSV');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  // Full Account & Farm Data Deletion
  const deleteAccount = async () => {
    if (!farm) return;
    if (deleteConfirmation !== 'DELETE MY SYSTEM DATA') {
      toast.error("Please type the exact phrase 'DELETE MY SYSTEM DATA' to confirm.");
      return;
    }

    setDeletingAccount(true);
    try {
      if (isOffline()) {
        await queueWrite('farms', 'delete', farm.id, {} as Record<string, unknown>);
        toast.success('Farm data queued for deletion (offline — will sync)');
        await signOut();
        return;
      }

      const { error: deleteErr } = await supabase.from('farms').delete().eq('id', farm.id);
      if (deleteErr) throw deleteErr;

      await signOut();
      toast.success('Account and all associated farm data permanently deleted.');
    } catch (err: any) {
      toast.error('Failed to delete account: ' + err.message);
    } finally {
      setDeletingAccount(false);
      setShowDelete(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" /> Data Exports
          </CardTitle>
          <CardDescription>Download backup bundles of all your recorded farm data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2 rounded-full" onClick={exportData} disabled={exporting}>
            <FileJson className="h-4 w-4 text-primary" /> Export Full Backup (JSON)
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 rounded-full" onClick={exportCSV} disabled={exporting}>
            <FileSpreadsheet className="h-4 w-4 text-primary" /> Export Ledger (CSV)
          </Button>
        </CardContent>
      </Card>

      {/* Deletion */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4 text-destructive" /> Danger Zone
          </CardTitle>
          <CardDescription className="text-destructive/80">Permanently delete your farm and all of its records</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-destructive/85 mb-4 leading-relaxed">
            Deletions are permanent and cannot be reversed. This will purge all batches, mortality statistics, financial ledgers, and configurations.
          </p>
          <Button variant="destructive" className="rounded-full gap-2" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete Farm Data
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5 text-destructive animate-bounce" /> Permanent System Purge
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This action is irreversible. All records, batches, ledgers, and configurations will be permanently deleted from the database.</p>
              <p className="font-semibold text-foreground">To confirm deletion, please type the confirmation phrase exactly: <span className="font-mono text-destructive bg-destructive/10 px-1 py-0.5 rounded">DELETE MY SYSTEM DATA</span></p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="delete-confirm-input" className="sr-only">Confirmation Phrase</Label>
            <Input
              id="delete-confirm-input"
              value={deleteConfirmation}
              onChange={e => setDeleteConfirmation(e.target.value)}
              placeholder="Type confirmation phrase here"
              className="border-destructive/30 focus-visible:ring-destructive"
            />
          </div>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={deletingAccount || deleteConfirmation !== 'DELETE MY SYSTEM DATA'}
              className="rounded-full"
            >
              {deletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Everything
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
