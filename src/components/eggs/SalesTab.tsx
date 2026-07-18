import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Receipt, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencySymbol } from '@/lib/utils';

type EggSale = Database['public']['Tables']['egg_sales']['Row'];

interface SalesTabProps {
  salesSummary: { totalQty: number; totalRevenue: number; count: number };
  sales: EggSale[];
  costPrivacyEnabled: boolean;
  onShowSale: () => void;
}

export function SalesTab({
  salesSummary,
  sales,
  costPrivacyEnabled,
  onShowSale,
}: SalesTabProps) {
  const { currency } = useAuth();
  const symbol = getCurrencySymbol(currency);
  const mask = (val: string | number) => costPrivacyEnabled ? '****' : val;

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-secondary/20 border-none shadow-none">
          <CardContent className="pt-4 px-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Last 30d Revenue</p>
            <p className="text-xl font-black">{symbol} {mask(salesSummary.totalRevenue.toLocaleString())}</p>
            <p className="text-[10px] text-muted-foreground">{salesSummary.count} transactions</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-none shadow-none">
          <CardContent className="pt-4 px-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Eggs Sold (30d)</p>
            <p className="text-xl font-black">{salesSummary.totalQty.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Across all grades</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" /> Recent Sales
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase tracking-wider font-bold" onClick={onShowSale}>
            <Plus className="h-3 w-3 mr-1" /> Record Sale
          </Button>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="py-6 text-center">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No sales recorded yet.</p>
              <Button variant="outline" className="rounded-full gap-1" onClick={onShowSale}>
                <Plus className="h-3.5 w-3.5" /> Record Sale
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sales.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {s.quantity} {s.size_category} eggs
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                        <span>{format(new Date(s.date), 'MMM d')}</span>
                        {s.buyer && <><span>•</span><span className="truncate">{s.buyer}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold">{symbol} {mask(Number(s.total_amount).toLocaleString())}</div>
                    <div className="text-[10px] text-muted-foreground">{symbol} {mask(Number(s.unit_price).toFixed(2))}/ea</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
