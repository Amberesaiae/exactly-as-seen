import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';

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
  const mask = (val: string | number) => costPrivacyEnabled ? '****' : val;

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-primary/5 border-none">
          <CardContent className="pt-4 px-4 pb-3">
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-xl font-black">GHS {mask(stats.totalRevenue.toLocaleString())}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-none">
          <CardContent className="pt-4 px-4 pb-3">
            <p className="text-[10px] text-destructive font-bold uppercase tracking-wider mb-1">Total Expenses</p>
            <p className="text-xl font-black">GHS {mask(stats.totalExpenses.toLocaleString())}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-none">
          <CardContent className="pt-4 px-4 pb-3">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Net Profit</p>
            <p className={`text-xl font-black ${stats.netProfit >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              GHS {mask(stats.netProfit.toLocaleString())}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-none">
          <CardContent className="pt-4 px-4 pb-3">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Profit Margin</p>
            <p className="text-xl font-black">{mask(stats.margin)}</p>
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  {!costPrivacyEnabled && (
                    <>
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
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
                  {!costPrivacyEnabled && <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />}
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
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
