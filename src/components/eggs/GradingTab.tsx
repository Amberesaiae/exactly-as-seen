import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface SizeDistributionItem {
  size: string;
  count: number;
  pct: string;
}

interface GradingTabProps {
  sizeDistribution: SizeDistributionItem[];
  qualityBreakdown: { totalEggs: number; totalGood: number; totalBroken: number; totalDirty: number };
}

const COLORS = ['hsl(var(--primary))', '#fbbf24', '#f87171'];

export function GradingTab({ sizeDistribution, qualityBreakdown }: GradingTabProps) {
  const pieData = sizeDistribution.map(d => ({ name: d.size, value: d.count }));

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Size Distribution (Last 7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
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
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {sizeDistribution.map((d, i) => (
              <div key={d.size} className="text-center p-2 rounded-lg bg-secondary/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider truncate">{d.size.split(' ')[0]}</p>
                <p className="text-sm font-black" style={{ color: COLORS[i % COLORS.length] }}>{d.pct}%</p>
                <p className="text-[10px] text-muted-foreground">{d.count} eggs</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Quality Breakdown (Last 7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Good Quality', count: qualityBreakdown.totalGood, color: 'bg-primary' },
              { label: 'Broken', count: qualityBreakdown.totalBroken, color: 'bg-destructive' },
              { label: 'Dirty/Stained', count: qualityBreakdown.totalDirty, color: 'bg-amber-400' },
            ].map(item => {
              const pct = qualityBreakdown.totalEggs > 0 ? (item.count / qualityBreakdown.totalEggs) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{item.label}</span>
                    <span>{item.count} eggs ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
