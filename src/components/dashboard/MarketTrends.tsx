import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

export function MarketTrends() {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> Market Trends (GHS)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { item: 'Broiler (Live)', price: '85.00', change: '+2.5%', up: true },
          { item: 'Large Eggs (Crate)', price: '52.00', change: '-1.2%', up: false },
          { item: 'Maize (50kg)', price: '185.00', change: '+5.0%', up: true },
        ].map((trend, i) => (
          <Card key={i} className="border-none bg-muted/30 shadow-none">
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{trend.item}</span>
                <Badge className={`text-[8px] h-4 py-0 border-none ${trend.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {trend.change}
                </Badge>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-sm font-black">GHS {trend.price}</span>
                <span className="text-[8px] text-muted-foreground">/ unit</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
