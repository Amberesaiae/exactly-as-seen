import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Layers } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

interface BatchAnalysisTabProps {
  batches: Batch[];
  expenses: Database['public']['Tables']['expenses']['Row'][];
  revenue: Database['public']['Tables']['revenue']['Row'][];
  costPrivacyEnabled: boolean;
}

export function BatchAnalysisTab({
  batches,
  expenses,
  revenue,
  costPrivacyEnabled,
}: BatchAnalysisTabProps) {
  const mask = (val: string | number) => costPrivacyEnabled ? '****' : val;

  const analysis = batches.map(b => {
    const bExp = expenses.filter(e => e.batch_id === b.id).reduce((s, e) => s + Number(e.amount), 0);
    const bRev = revenue.filter(r => r.batch_id === b.id).reduce((s, r) => s + Number(r.amount), 0);
    const profit = bRev - bExp;
    return { ...b, expenses: bExp, revenue: bRev, profit };
  });

  return (
    <div className="space-y-4 mt-4">
      {analysis.map(b => (
        <Card key={b.id}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" /> {b.name}
            </CardTitle>
            <Badge variant="secondary" className="capitalize text-[10px]">{b.species}</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-secondary/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Revenue</p>
                <p className="font-bold text-sm text-primary">GHS {mask(b.revenue.toLocaleString())}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Expenses</p>
                <p className="font-bold text-sm text-destructive">GHS {mask(b.expenses.toLocaleString())}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Profit</p>
                <p className={`font-bold text-sm ${b.profit >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                  GHS {mask(b.profit.toLocaleString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {batches.length === 0 && (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="py-12 text-center">
            <Target className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No active batches to analyze.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
