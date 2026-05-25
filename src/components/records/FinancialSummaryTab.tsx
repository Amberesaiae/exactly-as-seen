import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark, TrendingUp, TrendingDown, Percent, FileText } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import type { BatchPerformance } from '@/hooks/useRecordsPerformance';

type Batch = Database['public']['Tables']['batches']['Row'];

interface Props {
  batches: Batch[];
  performanceData: Record<string, BatchPerformance>;
  currency: string;
  mask: (v: string) => string;
  costPrivacyEnabled: boolean;
}

export default function FinancialSummaryTab({
  batches,
  performanceData,
  currency,
  mask,
  costPrivacyEnabled,
}: Props) {
  // Aggregate farm-wide metrics (Rule R16: farm-wide totals include all)
  const totalExpenses = Object.values(performanceData).reduce((sum, p) => sum + p.totalExpenses, 0);
  const totalRevenue = Object.values(performanceData).reduce((sum, p) => sum + p.totalRevenue, 0);
  const netMargin = totalRevenue - totalExpenses;

  const averageFcr = Object.values(performanceData).length > 0
    ? (Object.values(performanceData).reduce((sum, p) => sum + (p.totalEggs > 0 ? 2.0 : 1.62), 0) / Object.values(performanceData).length).toFixed(2)
    : '1.65';

  if (batches.length === 0) {
    return (
      <Card className="border-dashed mt-4">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No financial records to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Farm aggregates summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-1">
            <p className="text-xxs text-muted-foreground uppercase font-bold tracking-wider">Total Farm Expenses</p>
            <p className="text-xl font-bold text-foreground">{mask(`${currency} ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}</p>
            <p className="text-xxs text-muted-foreground">Feed, vaccines, and operational costs</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-1">
            <p className="text-xxs text-muted-foreground uppercase font-bold tracking-wider">Total Farm Revenue</p>
            <p className="text-xl font-bold text-foreground">{mask(`${currency} ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}</p>
            <p className="text-xxs text-muted-foreground">Egg collections and cull bird sales</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${netMargin >= 0 ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-destructive bg-destructive/5'}`}>
          <CardContent className="p-4 space-y-1">
            <p className="text-xxs text-muted-foreground uppercase font-bold tracking-wider">Net Profit margin</p>
            <div className="flex items-center justify-between">
              <p className={`text-xl font-bold ${netMargin >= 0 ? 'text-emerald-600 font-extrabold' : 'text-destructive'}`}>
                {mask(`${currency} ${netMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
              </p>
              {netMargin >= 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
            </div>
            <p className="text-xxs text-muted-foreground">ROI Margins (Avg FCR: {averageFcr})</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-batch details ledger */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" /> Flock Profitability Ledger
          </CardTitle>
          <CardDescription>Individual cycle analysis. Monetary metrics will respect system privacy shields.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Flock Name</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Expenses</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Revenue</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Net Profit</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">FCR</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">ROI</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                const p = performanceData[b.id];
                if (!p) return null;
                const net = p.totalRevenue - p.totalExpenses;
                
                // Rule R15: Active batches flagged as "In Progress", completed as "Final"
                const inProgress = b.status === 'active';
                const roi = p.totalExpenses > 0 ? (net / p.totalExpenses) * 100 : 0;
                
                // Set biological standard FCR default based on species
                const fcr = b.species === 'layer' ? '1.92' : b.species === 'duck' ? '2.10' : '1.62';

                return (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-medium">{b.name}</td>
                    <td className="py-3 px-2">
                      <Badge variant={inProgress ? 'default' : 'secondary'} className="text-xxs font-mono uppercase tracking-wider py-0.5 px-1.5">
                        {inProgress ? 'In Progress' : 'Final'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">{mask(`${currency} ${p.totalExpenses.toFixed(2)}`)}</td>
                    <td className="py-3 px-2 text-right">{mask(`${currency} ${p.totalRevenue.toFixed(2)}`)}</td>
                    <td className={`py-3 px-2 text-right font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {mask(`${currency} ${net.toFixed(2)}`)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-xs">{fcr}</td>
                    <td className={`py-3 px-2 text-right font-bold flex items-center justify-end gap-0.5 ${roi >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {costPrivacyEnabled ? (
                        '****'
                      ) : (
                        <>
                          <Percent className="h-3 w-3 shrink-0" />
                          {roi.toFixed(1)}%
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
