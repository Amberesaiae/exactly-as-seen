import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, FlaskConical, Wrench, Package, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];

interface StockCategoryTabsProps {
  stockItems: StockItem[];
  categories: string[];
  onAction: (itemId: string, type: 'purchase' | 'usage' | 'adjustment') => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  feed: ShoppingCart,
  medication: FlaskConical,
  equipment: Wrench,
  other: Package,
};

export function StockCategoryTabs({ stockItems, categories, onAction }: StockCategoryTabsProps) {
  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <TabsList className="bg-transparent h-auto p-0 gap-2">
          <TabsTrigger value="all" className="rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">
            All
          </TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background capitalize">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="all" className="space-y-3 mt-4">
        {stockItems.map(item => <StockItemCard key={item.id} item={item} onAction={onAction} />)}
      </TabsContent>

      {categories.map(cat => (
        <TabsContent key={cat} value={cat} className="space-y-3 mt-4">
          {stockItems.filter(i => i.category === cat).map(item => (
            <StockItemCard key={item.id} item={item} onAction={onAction} />
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function StockItemCard({ item, onAction }: { item: StockItem, onAction: any }) {
  const Icon = CATEGORY_ICONS[item.category] || Package;
  const isLow = item.current_quantity <= item.reorder_threshold;

  return (
    <Card className={`overflow-hidden ${isLow ? 'border-destructive/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isLow ? 'bg-destructive/10 text-destructive' : 'bg-secondary/50 text-muted-foreground'}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-base truncate">{item.name}</h4>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{item.category}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xl font-black ${isLow ? 'text-destructive' : 'text-foreground'}`}>
              {item.current_quantity} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Threshold: {item.reorder_threshold}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-dashed">
          <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-lg gap-1 uppercase font-bold" onClick={() => onAction(item.id, 'purchase')}>
            <ArrowUpRight className="h-3 w-3" /> Purchase
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-lg gap-1 uppercase font-bold" onClick={() => onAction(item.id, 'usage')}>
            <ArrowDownRight className="h-3 w-3" /> Usage
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-[10px] rounded-lg gap-1 uppercase font-bold" onClick={() => onAction(item.id, 'adjustment')}>
            <RefreshCcw className="h-3 w-3" /> Adjust
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
