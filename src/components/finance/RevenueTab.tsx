import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Filter, Plus, Search, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Revenue = Database['public']['Tables']['revenue']['Row'];

interface RevenueTabProps {
  revenue: Revenue[];
  costPrivacyEnabled: boolean;
  onShowDialog: () => void;
}

export function RevenueTab({
  revenue,
  costPrivacyEnabled,
  onShowDialog,
}: RevenueTabProps) {
  const mask = (val: string | number) => costPrivacyEnabled ? '****' : val;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search revenue..." className="pl-9 h-9 rounded-full bg-secondary/30 border-none" />
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
            <DollarSign className="h-4 w-4 text-primary" /> Revenue Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {revenue.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                    <span>{format(new Date(r.date), 'MMM d')}</span>
                    <span>•</span>
                    <span>{r.category.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="font-black text-primary">GHS {mask(Number(r.amount).toLocaleString())}</p>
                  {r.buyer && <p className="text-[10px] text-muted-foreground uppercase truncate max-w-[80px]">{r.buyer}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
