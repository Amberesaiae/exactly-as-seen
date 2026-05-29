import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Filter, Plus, Search, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencySymbol } from '@/lib/utils';

type Revenue = Database['public']['Tables']['revenue']['Row'];

// Human-readable canonical labels
const CATEGORY_LABELS: Record<string, string> = {
  egg_sales:    'Egg Sales',
  bird_sales:   'Bird Sales',
  meat_sales:   'Meat Sales',
  manure_sales: 'Manure Sales',
  other:        'Other Revenue',
};

const STATUS_STYLES: Record<string, string> = {
  paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  pending: 'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
  partial: 'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300',
};

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
  const { currency } = useAuth();
  const symbol = getCurrencySymbol(currency);
  const mask = (val: string | number) => costPrivacyEnabled ? '●●●●' : val;

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
          {revenue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No revenue recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {revenue.map(r => {
                const status = (r.payment_status ?? 'paid') as string;
                const categoryLabel = CATEGORY_LABELS[r.category] ?? r.category.replace('_', ' ');
                return (
                  <div key={r.id} className="flex items-start justify-between text-sm border-b pb-2.5 last:border-0 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{r.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                          {format(new Date(r.date), 'MMM d')}
                        </span>
                        <span className="text-muted-foreground/40 text-[10px]">•</span>
                        <span className="text-[10px] text-muted-foreground">{categoryLabel}</span>
                        {r.buyer && (
                          <>
                            <span className="text-muted-foreground/40 text-[10px]">•</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">{r.buyer}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <p className="font-black text-primary">{symbol} {mask((Number(r.amount_pesewas ?? 0) / 100 || Number(r.amount)).toLocaleString())}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${STATUS_STYLES[status] ?? STATUS_STYLES['paid']}`}>
                        {status}
                      </span>
                    </div>
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
