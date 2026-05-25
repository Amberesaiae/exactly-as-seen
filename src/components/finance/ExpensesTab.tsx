import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, Filter, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Expense = Database['public']['Tables']['expenses']['Row'];

interface ExpensesTabProps {
  expenses: Expense[];
  costPrivacyEnabled: boolean;
  onShowDialog: () => void;
}

export function ExpensesTab({
  expenses,
  costPrivacyEnabled,
  onShowDialog,
}: ExpensesTabProps) {
  const mask = (val: string | number) => costPrivacyEnabled ? '****' : val;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-9 h-9 rounded-full bg-secondary/30 border-none" />
        </div>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
          <Filter className="h-4 w-4" />
        </Button>
        <Button size="sm" className="rounded-full gap-1" onClick={onShowDialog}>
          <Plus className="h-3.5 w-3.5" /> Record
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" /> Expense Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{e.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                    <span>{format(new Date(e.date), 'MMM d')}</span>
                    <span>•</span>
                    <span>{e.category}</span>
                  </div>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="font-black text-destructive">GHS {mask(Number(e.amount).toLocaleString())}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{e.source || 'Manual'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
