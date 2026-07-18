import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { PrivacyMask } from '@/components/ui/PrivacyMask';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencySymbol } from '@/lib/utils';

const cashFlowConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
  expenses: {
    label: 'Expenses',
    color: '#ef4444',
  },
} satisfies ChartConfig;

const pieConfig = {
  value: {
    label: 'Amount',
  },
} satisfies ChartConfig;

interface FinanceOverviewTabProps {
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    margin: string;
    monthlyData: { month: string; revenue: number; expenses: number }[];
    categoryData: { name: string; value: number }[];
  };
  costPrivacyEnabled: boolean;
}

const COLORS = ['hsl(var(--primary))', '#fbbf24', '#f87171', '#818cf8', '#34d399'];

export function FinanceOverviewTab({ stats, costPrivacyEnabled }: FinanceOverviewTabProps) {
  const { currency } = useAuth();
  const symbol = getCurrencySymbol(currency);

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-primary/5 border-none">
          <CardContent className="pt-4 px-4 pb-3">
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-xl font-black">{symbol} <PrivacyMask value={stats.totalRevenue.toLocaleString()} /></p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-none">
          <CardContent className="pt-4 px-4 pb-3">
            <p className="text-[10px] text-destructive font-bold uppercase tracking-wider mb-1">Total Expenses</p>
            <p className="text-xl font-black">{symbol} <PrivacyMask value={stats.totalExpenses.toLocaleString()} /></p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-none">
          <CardContent className="pt-4 px-4 pb-3">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Net Profit</p>
            <p className={`text-xl font-black ${stats.netProfit >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              {symbol} <PrivacyMask value={stats.netProfit.toLocaleString()} />
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-none">
          <CardContent className="pt-4 px-4 pb-3">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Profit Margin</p>
            <p className="text-xl font-black"><PrivacyMask value={stats.margin} /></p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Cash Flow trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer config={cashFlowConfig}>
                <AreaChart data={stats.monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => costPrivacyEnabled ? '••••' : v.toLocaleString()} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex flex-1 justify-between items-center leading-none gap-4">
                            <span className="text-muted-foreground">
                              {name === 'revenue' ? 'Revenue' : 'Expenses'}
                            </span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {costPrivacyEnabled ? `${symbol} ••••` : `${symbol} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="var(--color-expenses)" fill="url(#colorExpenses)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> Expense Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer config={pieConfig}>
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.categoryData.map((_, index) => (
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
                              {costPrivacyEnabled ? `${symbol} ••••` : `${symbol} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BarChart3(props: any) {
  return <TrendingUp {...props} />;
}
