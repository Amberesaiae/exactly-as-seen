import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Boxes, Package } from 'lucide-react';

const chartConfig = {
  value: {
    label: 'Eggs',
  },
} satisfies ChartConfig;

interface SizeDistributionItem {
  size: string;
  count: number;
  pct: string;
}

interface GradingTabProps {
  sizeDistribution: SizeDistributionItem[];
  qualityBreakdown: { totalEggs: number; totalGood: number; totalBroken: number; totalDirty: number };
}

const COLORS = ['hsl(var(--primary))', '#fbbf24', '#f87171', '#818cf8'];

/**
 * Production-Grade Grading & Inventory Tab.
 * Displays Size Distribution and high-fidelity Commercial Inventory (Crates & Looses).
 * Aligned with 'Elite' spec for commercial egg management.
 */
export function GradingTab({ sizeDistribution, qualityBreakdown }: GradingTabProps) {
  const pieData = sizeDistribution.map(d => ({ name: d.size, value: d.count }));

  // Helper to convert eggs to crates (30 eggs per crate)
  const toCrates = (count: number) => {
    const crates = Math.floor(count / 30);
    const loose = count % 30;
    return { crates, loose };
  };

  return (
    <div className="space-y-4 mt-4">
      {/* 1. Commercial Inventory Summary (Spec Priority) */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
              <Boxes className="h-3 w-3" /> Total Stock (Good)
            </div>
            <p className="text-2xl font-black">
              {toCrates(qualityBreakdown.totalGood).crates} <span className="text-sm font-bold text-muted-foreground uppercase">Crates</span>
            </p>
            <p className="text-[10px] font-bold text-primary/70">
              + {toCrates(qualityBreakdown.totalGood).loose} loose eggs
            </p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-destructive uppercase tracking-widest">
              <Package className="h-3 w-3" /> Loss (Broken/Dirty)
            </div>
            <p className="text-2xl font-black">
              {qualityBreakdown.totalBroken + qualityBreakdown.totalDirty} <span className="text-sm font-bold text-muted-foreground uppercase">Eggs</span>
            </p>
            <p className="text-[10px] font-bold text-destructive/70">
              {(((qualityBreakdown.totalBroken + qualityBreakdown.totalDirty) / Math.max(1, qualityBreakdown.totalEggs)) * 100).toFixed(1)}% total loss
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* 2. Size Distribution Chart */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Size Distribution (7d)</span>
              <Badge variant="outline" className="text-[10px] font-bold">BY EGG COUNT</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ChartContainer config={chartConfig}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(value, name) => (
                          <div className="flex flex-1 justify-between items-center leading-none gap-4">
                            <span className="text-muted-foreground">{name}</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {value} eggs
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Quality Health */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Quality Breakdown (Last 7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {[
                { label: 'Marketable (Good)', count: qualityBreakdown.totalGood, color: 'bg-primary' },
                { label: 'Broken / Cracked', count: qualityBreakdown.totalBroken, color: 'bg-destructive' },
                { label: 'Dirty / Stained', count: qualityBreakdown.totalDirty, color: 'bg-amber-400' },
              ].map(item => {
                const pct = qualityBreakdown.totalEggs > 0 ? (item.count / qualityBreakdown.totalEggs) * 100 : 0;
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted-foreground uppercase tracking-tight">{item.label}</span>
                      <span>{item.count} eggs ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Detailed Inventory Table (Optional/Future) */}
    </div>
  );
}
