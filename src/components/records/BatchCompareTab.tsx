import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Scale, AlertTriangle, CheckCircle2, Trophy, Info } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import type { BatchPerformance } from '@/hooks/useRecordsPerformance';

type Batch = Database['public']['Tables']['batches']['Row'];

interface Props {
  batches: Batch[];
  performanceData: Record<string, BatchPerformance>;
  currency: string;
  mask: (v: string) => string;
  compareBatch1: string;
  compareBatch2: string;
  setCompareBatch1: (id: string) => void;
  setCompareBatch2: (id: string) => void;
}

export function BatchCompareTab({
  batches,
  performanceData,
  currency,
  mask,
  compareBatch1,
  compareBatch2,
  setCompareBatch1,
  setCompareBatch2,
}: Props) {
  // Add support for 3rd comparison batch per spec
  const [compareBatch3, setCompareBatch3] = useState<string>('');

  const selectedBatches = [
    batches.find(b => b.id === compareBatch1),
    batches.find(b => b.id === compareBatch2),
    batches.find(b => b.id === compareBatch3),
  ].filter((b): b is Batch => !!b);

  const selectedPerf = selectedBatches.map(b => performanceData[b.id]).filter(p => !!p);

  // Biological metrics logic (Rule R6: lower_better vs higher_better)
  const getBestPerformer = (
    metric: 'mortalityPct' | 'totalFeedKg' | 'totalEggs' | 'netProfit' | 'costPerBird',
    direction: 'lower_better' | 'higher_better'
  ) => {
    if (selectedPerf.length < 2) return null;
    
    let bestVal = direction === 'lower_better' ? Infinity : -Infinity;
    let bestBatchId: string | null = null;
    let hasTie = false;

    selectedPerf.forEach(p => {
      let val = 0;
      if (metric === 'netProfit') {
        val = p.totalRevenue - p.totalExpenses;
      } else {
        val = parseFloat(String(p[metric]));
      }

      if (isNaN(val)) return;

      if (direction === 'lower_better') {
        if (val < bestVal) {
          bestVal = val;
          bestBatchId = p.batchId;
          hasTie = false;
        } else if (val === bestVal) {
          hasTie = true;
        }
      } else {
        if (val > bestVal) {
          bestVal = val;
          bestBatchId = p.batchId;
          hasTie = false;
        } else if (val === bestVal) {
          hasTie = true;
        }
      }
    });

    return hasTie ? null : bestBatchId;
  };

  const bestMortality = getBestPerformer('mortalityPct', 'lower_better');
  const bestEggs = getBestPerformer('totalEggs', 'higher_better');
  const bestNetProfit = getBestPerformer('netProfit', 'higher_better');
  const bestCostPerBird = getBestPerformer('costPerBird', 'lower_better');

  // Insights compiler (Rule R7: emit warning, success, or info alerts)
  const generateInsights = () => {
    const insights: Array<{ code: string; severity: 'warn' | 'success' | 'info'; message: string }> = [];
    if (selectedPerf.length < 2) return insights;

    // 1. Mortality gap check
    let minMort = Infinity;
    let maxMort = -Infinity;
    let worstMortBatch = '';
    
    selectedPerf.forEach(p => {
      const mort = parseFloat(p.mortalityPct);
      if (mort < minMort) minMort = mort;
      if (mort > maxMort) {
        maxMort = mort;
        worstMortBatch = selectedBatches.find(b => b.id === p.batchId)?.name ?? '';
      }
    });

    const gap = maxMort - minMort;
    if (gap > 2) {
      insights.push({
        code: 'INSIGHT_MORTALITY_GAP',
        severity: 'warn',
        message: `A mortality gap of ${gap.toFixed(1)}% exists between your flocks. We recommend auditing biosecurity measures in "${worstMortBatch}".`,
      });
    }

    // 2. High mortality alert
    selectedPerf.forEach(p => {
      const mort = parseFloat(p.mortalityPct);
      if (mort > 5) {
        const name = selectedBatches.find(b => b.id === p.batchId)?.name ?? '';
        insights.push({
          code: 'INSIGHT_HIGH_MORTALITY',
          severity: 'warn',
          message: `Flock "${name}" has exceeded the standard 5% mortality threshold at ${p.mortalityPct}%. Investigate ventilation and vaccine compliance immediately.`,
        });
      }
    });

    // 3. Egg laying capability warning (if layers have low totals)
    selectedBatches.forEach(b => {
      const p = performanceData[b.id];
      if (b.species === 'layer' && p && p.totalEggs === 0) {
        insights.push({
          code: 'INSIGHT_LAYING_DELAY',
          severity: 'info',
          message: `Flock "${b.name}" is recorded as a layer cycle but has zero egg collection records. Verify laying start week (Week 19+).`,
        });
      }
    });

    return insights;
  };

  const activeInsights = generateInsights();

  return (
    <div className="space-y-4">
      {/* Selectors grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Select Batch 1</Label>
          <Select value={compareBatch1} onValueChange={setCompareBatch1}>
            <SelectTrigger><SelectValue placeholder="Select batch 1" /></SelectTrigger>
            <SelectContent>
              {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Select Batch 2</Label>
          <Select value={compareBatch2} onValueChange={setCompareBatch2}>
            <SelectTrigger><SelectValue placeholder="Select batch 2" /></SelectTrigger>
            <SelectContent>
              {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Select Batch 3 (Optional)</Label>
          <Select value={compareBatch3} onValueChange={setCompareBatch3}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedBatches.length >= 2 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" /> Side-by-Side Comparison
              </CardTitle>
              <CardDescription>Metrics comparison. Gold crown represents best performer in biological bounds.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto pt-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Metric</th>
                    {selectedBatches.map(b => (
                      <th key={b.id} className="text-right py-2 px-3 font-medium">{b.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: 'Species / System',
                      vals: selectedBatches.map(b => `${b.species} (${b.production_system || 'intensive'})`),
                    },
                    {
                      label: 'Initial Quantity',
                      vals: selectedBatches.map(b => b.initial_quantity.toLocaleString()),
                    },
                    {
                      label: 'Current Population',
                      vals: selectedBatches.map(b => b.current_population.toLocaleString()),
                    },
                    {
                      label: 'Mortality Rate',
                      vals: selectedBatches.map(b => {
                        const p = performanceData[b.id];
                        const isBest = p && p.batchId === bestMortality;
                        return (
                          <span className="flex items-center justify-end gap-1 font-semibold">
                            {p ? `${p.mortalityPct}%` : '0%'}
                            {isBest && <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />}
                          </span>
                        );
                      }),
                    },
                    {
                      label: 'Total Feed (kg)',
                      vals: selectedBatches.map(b => performanceData[b.id]?.totalFeedKg.toFixed(1) ?? '0.0'),
                    },
                    {
                      label: 'Total Eggs Collected',
                      vals: selectedBatches.map(b => {
                        const p = performanceData[b.id];
                        const count = p?.totalEggs ?? 0;
                        const isBest = count > 0 && p && p.batchId === bestEggs;
                        return (
                          <span className="flex items-center justify-end gap-1 font-semibold">
                            {count.toLocaleString()}
                            {isBest && <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />}
                          </span>
                        );
                      }),
                    },
                    {
                      label: 'Total Expenses',
                      vals: selectedBatches.map(b => {
                        const p = performanceData[b.id];
                        return p ? mask(`${currency} ${p.totalExpenses.toFixed(2)}`) : '—';
                      }),
                    },
                    {
                      label: 'Total Revenue',
                      vals: selectedBatches.map(b => {
                        const p = performanceData[b.id];
                        return p ? mask(`${currency} ${p.totalRevenue.toFixed(2)}`) : '—';
                      }),
                    },
                    {
                      label: 'Net Margin',
                      vals: selectedBatches.map(b => {
                        const p = performanceData[b.id];
                        if (!p) return '—';
                        const net = p.totalRevenue - p.totalExpenses;
                        const isBest = p.batchId === bestNetProfit;
                        return (
                          <span className={`flex items-center justify-end gap-1 font-bold ${net >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                            {mask(`${currency} ${net.toFixed(2)}`)}
                            {isBest && <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />}
                          </span>
                        );
                      }),
                    },
                    {
                      label: 'Cost Per Bird',
                      vals: selectedBatches.map(b => {
                        const p = performanceData[b.id];
                        const isBest = p && p.batchId === bestCostPerBird;
                        return (
                          <span className="flex items-center justify-end gap-1 font-semibold">
                            {p ? mask(`${currency} ${p.costPerBird}`) : '—'}
                            {isBest && <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />}
                          </span>
                        );
                      }),
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-2 text-muted-foreground font-medium">{row.label}</td>
                      {row.vals.map((v, i) => (
                        <td key={i} className="py-2.5 px-3 text-right font-medium capitalize">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Dynamic Insights console (Rule R7) */}
          {activeInsights.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Flock Comparison Insights
              </h3>
              {activeInsights.map((ins, idx) => (
                <Alert key={idx} variant={ins.severity === 'warn' ? 'destructive' : 'default'} className={ins.severity === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800' : ''}>
                  {ins.severity === 'warn' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : ins.severity === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                  <AlertTitle className="text-xs font-bold uppercase">{ins.code}</AlertTitle>
                  <AlertDescription className="text-xs leading-relaxed mt-0.5">{ins.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center flex flex-col items-center justify-center">
            <Scale className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Select at least two batches to compile your comparison matrix.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
