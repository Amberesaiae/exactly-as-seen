import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];

interface StockAlertsProps {
  lowStockItems: StockItem[];
}

export function StockAlerts({ lowStockItems }: StockAlertsProps) {
  if (lowStockItems.length === 0) return null;

  return (
    <div className="space-y-2">
      {lowStockItems.map(item => (
        <Alert key={item.id} variant="destructive" className="bg-destructive/5 border-destructive/20 py-2.5">
          <AlertTriangle className="h-4 w-4" />
          <div className="flex items-center justify-between w-full pr-2">
            <div>
              <AlertTitle className="text-xs font-bold mb-0">Low Stock: {item.name}</AlertTitle>
              <AlertDescription className="text-[10px] opacity-80">
                Current: {item.current_quantity} {item.unit} (Threshold: {item.reorder_threshold})
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}
