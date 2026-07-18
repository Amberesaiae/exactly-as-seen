import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Egg, Plus } from 'lucide-react';
import { format } from 'date-fns';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis,
  BarChart, Bar, Legend,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const productionRateConfig = {
  rate: {
    label: 'Actual Rate',
    color: 'hsl(var(--primary))',
  },
  expectedMin: {
    label: 'Expected Min',
    color: '#10b981',
  },
  expectedMax: {
    label: 'Expected Max',
    color: '#10b981',
  },
} satisfies ChartConfig;

const dailyCollectionConfig = {
  good: {
    label: 'Good',
    color: 'hsl(var(--primary))',
  },
  broken: {
    label: 'Broken/Dirty',
    color: '#ef4444',
  },
} satisfies ChartConfig;
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type EggRecord = Database['public']['Tables']['egg_collections']['Row'];

interface ChartDataItem {
  date: string;
  eggs: number;
  good: number;
  broken: number;
  rate: number;
  expectedMin: number | null;
  expectedMax: number | null;
}

interface ProductionTabProps {
  chartData: ChartDataItem[];
  records: EggRecord[];
  batch: Batch | undefined;
  todayStr: string;
  expectedRate: { min: number; max: number } | null;
  onShowCollect: () => void;
}

export function ProductionTab({
  chartData,
  records,
  batch,
  todayStr,
  expectedRate,
  onShowCollect,
}: ProductionTabProps) {
  return (
    <div className="space-y-4 mt-4">
      {/* Production rate chart with expected range */}
      {chartData.length >= 2 && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Production Rate Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ChartContainer config={productionRateConfig}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex flex-1 justify-between items-center leading-none gap-4">
                            <span className="text-muted-foreground">
                              {name === 'rate' ? 'Actual Rate' : name === 'expectedMin' ? 'Expected Min' : 'Expected Max'}
                            </span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {value}%
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Area type="monotone" dataKey="expectedMax" stroke="none" fill="url(#colorExpected)" />
                  <Area type="monotone" dataKey="expectedMin" stroke="none" fill="#ffffff" fillOpacity={1} />
                  <Area type="monotone" dataKey="rate" stroke="var(--color-rate)" strokeWidth={2.5} dot={{ r: 3 }} fill="transparent" />
                </AreaChart>
              </ChartContainer>
            </div>
            {expectedRate && (
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Green dashed lines = expected range ({expectedRate.min}–{expectedRate.max}%)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Egg count bar chart */}
      {chartData.length >= 2 && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> Daily Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ChartContainer config={dailyCollectionConfig}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex flex-1 justify-between items-center leading-none gap-4">
                            <span className="text-muted-foreground">
                              {name === 'good' ? 'Good' : 'Broken/Dirty'}
                            </span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {value} eggs
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="good" fill="var(--color-good)" name="Good" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="broken" fill="var(--color-broken)" name="Broken/Dirty" radius={[2, 2, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent collections list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-6 text-center">
              <Egg className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No collections yet.</p>
              <Button variant="outline" className="rounded-full gap-1" onClick={onShowCollect}>
                <Plus className="h-3.5 w-3.5" /> Record Collection
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {records.map(r => {
                const rate = batch && batch.current_population > 0
                  ? ((r.total_eggs / batch.current_population) * 100).toFixed(1) : null;
                const isToday = r.date === todayStr;
                return (
                  <div key={r.id} className={`flex items-center justify-between text-sm border-b pb-1.5 last:border-0 ${isToday ? 'bg-primary/5 rounded px-1.5' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Egg className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{r.total_eggs} eggs</span>
                          <span className="text-xs text-muted-foreground">
                            ({r.good} good{r.broken > 0 ? `, ${r.broken} broken` : ''}{r.dirty > 0 ? `, ${r.dirty} dirty` : ''})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{format(new Date(r.date), 'MMM d')}</span>
                          <span>•</span>
                          <span className="capitalize">{r.size_category}</span>
                          {rate && <><span>•</span><span>{rate}%</span></>}
                        </div>
                      </div>
                    </div>
                    {r.notes && (
                      <span className="text-xs text-muted-foreground truncate max-w-[80px]">{r.notes}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
