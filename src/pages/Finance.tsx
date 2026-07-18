import { useState } from 'react';
import { useFinanceData, type Period } from '@/hooks/useFinanceData';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart3, ArrowUpRight, ArrowDownLeft, Landmark } from 'lucide-react';

import { FinanceOverviewTab } from '@/components/finance/FinanceOverviewTab';
import { ExpensesTab } from '@/components/finance/ExpensesTab';
import { RevenueTab } from '@/components/finance/RevenueTab';
import { BatchAnalysisTab } from '@/components/finance/BatchAnalysisTab';
import { FinanceDialogs } from '@/components/finance/FinanceDialogs';

export default function Finance() {
  const {
    loading, period, setPeriod, stats, expenseCategoryTotals, chartData, batchAnalysis,
    expenses, revenue, batches, submitting, costPrivacyEnabled, addExpense, addRevenue,
  } = useFinanceData();

  const [expensesOpen, setExpensesOpen] = useState(false);
  const [revenueOpen, setRevenueOpen] = useState(false);

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Ledger</h1>
        <div className="flex items-center gap-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Period</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[110px] h-8 text-xs font-bold rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['month', 'quarter', 'year', 'all'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-10 p-1 bg-secondary/50 rounded-full">
          <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-background"><BarChart3 className="h-3.5 w-3.5 mr-1.5" /> <span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-full data-[state=active]:bg-background"><ArrowUpRight className="h-3.5 w-3.5 mr-1.5" /> <span className="hidden sm:inline">Expenses</span></TabsTrigger>
          <TabsTrigger value="revenue" className="rounded-full data-[state=active]:bg-background"><ArrowDownLeft className="h-3.5 w-3.5 mr-1.5" /> <span className="hidden sm:inline">Revenue</span></TabsTrigger>
          <TabsTrigger value="analysis" className="rounded-full data-[state=active]:bg-background"><Landmark className="h-3.5 w-3.5 mr-1.5" /> <span className="hidden sm:inline">Batches</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinanceOverviewTab
            stats={{
              totalRevenue: stats.totalRev,
              totalExpenses: stats.totalExp,
              netProfit: stats.net,
              margin: `${stats.margin.toFixed(1)}%`,
              monthlyData: chartData.map(d => ({ month: d.date, revenue: d.rev, expenses: d.exp })),
              categoryData: expenseCategoryTotals
            }}
            costPrivacyEnabled={costPrivacyEnabled}
          />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTab
            expenses={expenses}
            costPrivacyEnabled={costPrivacyEnabled}
            onShowDialog={() => setExpensesOpen(true)}
          />
        </TabsContent>
        <TabsContent value="revenue">
          <RevenueTab
            revenue={revenue}
            costPrivacyEnabled={costPrivacyEnabled}
            onShowDialog={() => setRevenueOpen(true)}
          />
        </TabsContent>
        <TabsContent value="analysis">
          <BatchAnalysisTab
            batches={batches}
            expenses={expenses}
            revenue={revenue}
            costPrivacyEnabled={costPrivacyEnabled}
          />
        </TabsContent>
      </Tabs>

      <FinanceDialogs
        expenseOpen={expensesOpen}
        setExpenseOpen={setExpensesOpen}
        revenueOpen={revenueOpen}
        setRevenueOpen={setRevenueOpen}
        batches={batches}
        onAddExpense={addExpense}
        onAddRevenue={addRevenue}
        submitting={submitting}
      />
    </div>
  );
}
