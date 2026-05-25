import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, FileSpreadsheet, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import type { BatchPerformance } from '@/hooks/useRecordsPerformance';
import { generateBatchPDF } from '@/lib/pdf-report';

type Batch = Database['public']['Tables']['batches']['Row'];

interface Props {
  batches: Batch[];
  performanceData: Record<string, BatchPerformance>;
  currency: string;
  costPrivacyEnabled: boolean;
}

export default function DataExportsTab({
  batches,
  performanceData,
  currency,
  costPrivacyEnabled,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === batches.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(batches.map(b => b.id));
    }
  };

  // CSV Export (Rule R11: plain RFC-4180 CSV, Rule R3: respects privacy mask)
  const exportCSV = () => {
    const listToExport = batches.filter(b => selectedIds.includes(b.id));
    if (listToExport.length === 0) {
      toast.error('Please select at least one flock to export.');
      return;
    }

    const headers = [
      'Name',
      'Species',
      'Status',
      'Initial Qty',
      'Current Pop',
      'Mortality %',
      'Total Feed (kg)',
      'Total Eggs',
      costPrivacyEnabled ? '' : 'Total Expenses',
      costPrivacyEnabled ? '' : 'Total Revenue',
      'Start Date',
    ].filter(h => h !== '');

    const rows = listToExport.map(b => {
      const p = performanceData[b.id];
      const r = [
        b.name,
        b.species,
        b.status,
        b.initial_quantity,
        b.current_population,
        p?.mortalityPct ?? '0.0',
        p?.totalFeedKg.toFixed(1) ?? '0.0',
        p?.totalEggs ?? 0,
      ];
      if (!costPrivacyEnabled) {
        r.push(p?.totalExpenses.toFixed(2) ?? '0.00');
        r.push(p?.totalRevenue.toFixed(2) ?? '0.00');
      }
      r.push(b.start_date);
      return r;
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lampfarms_ledger_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Flock performance records exported as CSV');
  };

  // PDF Report via jsPDF (full branded multi-page report)
  const exportPDF = async () => {
    const listToExport = batches.filter(b => selectedIds.includes(b.id));
    if (listToExport.length === 0) {
      toast.error('Please select at least one flock to export.');
      return;
    }
    setPdfLoading(true);
    try {
      await generateBatchPDF(
        selectedIds,
        listToExport as any,
        { currency, maskFinancials: costPrivacyEnabled }
      );
      toast.success('PDF report downloaded successfully!');
    } catch (err) {
      console.error('[PDF] generation failed', err);
      toast.error('PDF generation failed. Check console for details.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Privacy Notice */}
      {costPrivacyEnabled && (
        <Card className="bg-destructive/5 border-destructive/10">
          <CardContent className="p-4 flex gap-3 items-start">
            <EyeOff className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-destructive">Financial Privacy Mask Active</p>
              <p className="text-xs text-muted-foreground">
                In compliance with your farm privacy rules (Rule R3), all generated PDF and CSV logs will mask expense/revenue statements.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selector and Actions */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Select Flocks to Export
              </CardTitle>
              <CardDescription>Export backups for local filing</CardDescription>
            </div>
            <Button size="sm" variant="ghost" className="text-xs rounded-full h-8" onClick={handleSelectAll}>
              {selectedIds.length === batches.length ? 'Clear Selection' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {batches.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No flock records available to select.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border rounded-xl p-3">
              {batches.map(b => (
                <div key={b.id} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`export-chk-${b.id}`}
                    checked={selectedIds.includes(b.id)}
                    onCheckedChange={() => handleToggleSelect(b.id)}
                  />
                  <Label htmlFor={`export-chk-${b.id}`} className="text-xs font-medium cursor-pointer capitalize">
                    {b.name} ({b.species})
                  </Label>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" className="rounded-full gap-1.5" onClick={exportCSV} disabled={selectedIds.length === 0}>
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              variant="outline"
              className="rounded-full gap-1.5"
              onClick={exportPDF}
              disabled={selectedIds.length === 0 || pdfLoading}
            >
              {pdfLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><FileText className="h-4 w-4" /> Download PDF</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
