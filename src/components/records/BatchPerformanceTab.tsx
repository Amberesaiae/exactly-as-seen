import { BarChart3, Skull, Calculator, Egg, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getBatchAge } from '@/lib/batch-utils';
import type { Database } from '@/integrations/supabase/types';
import type { BatchPerformance } from '@/hooks/useRecordsPerformance';

type Batch = Database['public']['Tables']['batches']['Row'];

interface Props {
  batches: Batch[];
  performanceData: Record<string, BatchPerformance>;
  perfLoading: boolean;
  currency: string;
  mask: (v: string) => string;
}

export function BatchPerformanceTab({ batches, performanceData, perfLoading, currency, mask }: Props) {
  if (batches.length === 0 || perfLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-1">Performance Metrics</h3>
          <p className="text-sm text-muted-foreground">
            {perfLoading ? 'Loading…' : 'No batches with data yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {batches.map(b => {
        const p = performanceData[b.id];
        if (!p) return null;
        const age = getBatchAge(b.start_date, b.species);
        return (
          <Card key={b.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {b.species} • {b.status} • Week {age.week}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Skull className="h-4 w-4 mx-auto mb-1 text-destructive" />
                  <p className="text-lg font-bold">{p.mortalityPct}%</p>
                  <p className="text-xs text-muted-foreground">Mortality ({p.totalMortality})</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Calculator className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{p.totalFeedKg.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Feed (kg)</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Egg className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{p.totalEggs}</p>
                  <p className="text-xs text-muted-foreground">Total Eggs</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Wallet className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{mask(`${currency} ${p.costPerBird}`)}</p>
                  <p className="text-xs text-muted-foreground">Cost/Bird</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
