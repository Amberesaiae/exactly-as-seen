import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InventoryAlertsProps {
  stats: {
    total: number;
    low: number;
    items: any[];
  } | null;
}

export function InventoryAlerts({ stats }: InventoryAlertsProps) {
  if (!stats) return null;

  return (
    <Card className="border-primary/10">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Inventory
          </h2>
          {stats.low > 0 ? (
            <Badge variant="destructive" className="text-[10px] animate-pulse">
              {stats.low} Low Stock
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">Optimal</Badge>
          )}
        </div>

        {stats.low === 0 ? (
          <div className="py-2">
            <p className="text-xs text-muted-foreground">All essential items are above safety thresholds.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.items.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{item.name}</p>
                  <p className="text-[10px] text-destructive font-bold uppercase tracking-tight">
                    {item.current_quantity} {item.unit} left
                  </p>
                </div>
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
              </div>
            ))}
          </div>
        )}
        
        <Button variant="outline" className="w-full text-xs h-8 rounded-full" asChild>
          <Link to="/stock" className="gap-1.5">
            Manage Inventory <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
