import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, Boxes } from 'lucide-react';
import { PrivacyMask } from '@/components/ui/PrivacyMask';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencySymbol } from '@/lib/utils';

interface StockSummaryProps {
  stats: {
    totalValue: number;
    lowStockCount: number;
    uniqueCount: number;
    categories: string[];
  };
  costPrivacyEnabled: boolean;
}

export function StockSummary({ stats, costPrivacyEnabled }: StockSummaryProps) {
  const { currency } = useAuth();
  const symbol = getCurrencySymbol(currency);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="bg-primary/5 border-none shadow-none">
        <CardContent className="pt-4 px-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-3 w-3 text-primary" />
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Inventory Value</p>
          </div>
          <p className="text-xl font-black">{symbol} <PrivacyMask value={stats.totalValue.toLocaleString()} /></p>
        </CardContent>
      </Card>

      <Card className={`${stats.lowStockCount > 0 ? 'bg-destructive/5' : 'bg-secondary/20'} border-none shadow-none`}>
        <CardContent className="pt-4 px-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`h-3 w-3 ${stats.lowStockCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <p className={`text-[10px] font-bold uppercase tracking-wider ${stats.lowStockCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>Low Stock</p>
          </div>
          <p className="text-xl font-black">{stats.lowStockCount}</p>
        </CardContent>
      </Card>

      <Card className="bg-secondary/20 border-none shadow-none">
        <CardContent className="pt-4 px-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Boxes className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Items</p>
          </div>
          <p className="text-xl font-black">{stats.uniqueCount}</p>
        </CardContent>
      </Card>

      <Card className="bg-secondary/20 border-none shadow-none">
        <CardContent className="pt-4 px-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Categories</p>
          </div>
          <p className="text-xl font-black">{stats.categories.length}</p>
        </CardContent>
      </Card>
    </div>
  );
}
