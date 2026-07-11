import { Egg } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type EggRecord = Database['public']['Tables']['egg_collections']['Row'];

interface EggProductionOverviewProps {
  batch: Batch;
  batchAge: { week: number; phase: string } | null;
  productionRate: string | null;
  avg7Day: string | null;
  weekTotal: number;
  expectedRate: { min: number; max: number } | null;
  qualityBreakdown: { totalEggs: number; totalGood: number; totalBroken: number; totalDirty: number };
  rateDeviation: { type: 'below' | 'above'; diff: string } | null;
  todayRecord: EggRecord | undefined;
}

export function EggProductionOverview({
  batch,
  batchAge,
  productionRate,
  avg7Day,
  weekTotal,
  expectedRate,
  qualityBreakdown,
  rateDeviation,
  todayRecord,
}: EggProductionOverviewProps) {
  if (!batch || !batchAge) return null;

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="py-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Egg className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Production Overview</h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            Week {batchAge.week} • {batchAge.phase}
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-background p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Today's Rate</p>
            <p className={`text-lg font-bold ${
              rateDeviation?.type === 'below' ? 'text-destructive' : 'text-foreground'
            }`}>
              {productionRate ? `${productionRate}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {todayRecord ? `${todayRecord.total_eggs} eggs` : 'No collection today'}
            </p>
          </div>
          <div className="rounded-lg bg-background p-2.5 text-center">
            <p className="text-xs text-muted-foreground">7-Day Avg</p>
            <p className="text-lg font-bold text-foreground">{avg7Day ? `${avg7Day}%` : '—'}</p>
            <p className="text-xs text-muted-foreground">{weekTotal} eggs this week</p>
          </div>
          <div className="rounded-lg bg-background p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Expected Range</p>
            <p className="text-lg font-bold text-foreground">
              {expectedRate ? `${expectedRate.min}–${expectedRate.max}%` : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {batch.species} standard
            </p>
          </div>
          <div className="rounded-lg bg-background p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Quality (7d)</p>
            <p className="text-lg font-bold text-foreground">
              {qualityBreakdown.totalEggs > 0
                ? `${((qualityBreakdown.totalGood / qualityBreakdown.totalEggs) * 100).toFixed(0)}%`
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {qualityBreakdown.totalBroken > 0 && `${qualityBreakdown.totalBroken} broken`}
              {qualityBreakdown.totalBroken > 0 && qualityBreakdown.totalDirty > 0 && ', '}
              {qualityBreakdown.totalDirty > 0 && `${qualityBreakdown.totalDirty} dirty`}
              {qualityBreakdown.totalBroken === 0 && qualityBreakdown.totalDirty === 0 && 'All good'}
            </p>
          </div>
        </div>

        {rateDeviation && (
          <div className={`mt-3 p-2.5 rounded-lg border text-xs flex gap-2 items-start ${
            rateDeviation.type === 'below' 
              ? 'bg-destructive/5 border-destructive/20 text-destructive' 
              : 'bg-blue-500/5 border-blue-500/20 text-blue-700'
          }`}>
            <span className="font-bold uppercase tracking-wider">{rateDeviation.type}:</span>
            <span>
              {rateDeviation.type === 'below'
                ? `Production is ${rateDeviation.diff}% below expected standard.`
                : `Production is ${rateDeviation.diff}% above expected standard.`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
