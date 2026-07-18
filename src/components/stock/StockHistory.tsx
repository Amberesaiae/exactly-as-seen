import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];
type StockTransaction = Database['public']['Tables']['stock_transactions']['Row'];

interface StockHistoryProps {
  transactions: StockTransaction[];
  stockItems: StockItem[];
}

export function StockHistory({ transactions, stockItems }: StockHistoryProps) {
  const getIcon = (type: string) => {
    if (type === 'purchase') return <ArrowUpRight className="h-3 w-3 text-primary" />;
    if (type === 'usage') return <ArrowDownRight className="h-3 w-3 text-destructive" />;
    return <RefreshCcw className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" /> Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map(tx => {
            const item = stockItems.find(i => i.id === tx.stock_item_id);
            return (
              <div key={tx.id} className="flex items-center justify-between text-sm border-b border-dashed pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    {getIcon(tx.transaction_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item?.name || 'Unknown Item'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                      {format(new Date(tx.date || tx.created_at), 'MMM d, HH:mm')} • {tx.transaction_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${tx.transaction_type === 'purchase' ? 'text-primary' : 'text-foreground'}`}>
                    {tx.transaction_type === 'purchase' ? '+' : '-'}{tx.quantity} {item?.unit}
                  </p>
                  {tx.notes && <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">{tx.notes}</p>}
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <p className="text-center py-4 text-sm text-muted-foreground">No recent transactions.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
