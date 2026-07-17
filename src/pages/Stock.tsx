import { useState } from 'react';
import { useStockData } from '@/hooks/useStockData';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Package, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { StockSummary } from '@/components/stock/StockSummary';
import { StockAlerts } from '@/components/stock/StockAlerts';
import { StockCategoryTabs } from '@/components/stock/StockCategoryTabs';
import { StockHistory } from '@/components/stock/StockHistory';
import { StockDialogs } from '@/components/stock/StockDialogs';

export default function Stock() {
  const {
    loading, stockItems, transactions, stats, lowStockItems, submitting, costPrivacyEnabled, addStockItem, recordTransaction, batches,
  } = useStockData();

  const [search, setSearch] = useState('');
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [txType, setTxType] = useState<'purchase' | 'usage' | 'adjustment' | null>(null);

  const filteredItems = stockItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  const handleAction = (itemId: string, type: 'purchase' | 'usage' | 'adjustment') => {
    setSelectedItemId(itemId); setTxType(type); setTxDialogOpen(true);
  };

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Inventory</h1>
        <Button
          className="rounded-full gap-1.5 h-9"
          onClick={() => setItemDialogOpen(true)}
          data-testid="stock-new-item"
          aria-label="New inventory item"
        >
          <Plus className="h-4 w-4" /> New Item
        </Button>
      </div>

      <StockSummary stats={{...stats, uniqueCount: stockItems.length}} costPrivacyEnabled={costPrivacyEnabled} />
      <StockAlerts lowStockItems={lowStockItems} />

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filter inventory..." className="pl-9 rounded-full h-10 bg-secondary/30 border-none shadow-none" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {stockItems.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Inventory Empty</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">Start tracking your feed, medication, and equipment by adding your first item.</p>
            <Button variant="outline" className="rounded-full gap-2" onClick={() => setItemDialogOpen(true)}><Plus className="h-4 w-4" /> Add Item</Button>
          </CardContent>
        </Card>
      ) : (
        <StockCategoryTabs stockItems={filteredItems} categories={stats.categories} onAction={handleAction} />
      )}

      <div className="pt-4"><StockHistory transactions={transactions} stockItems={stockItems} /></div>

      <StockDialogs
        itemDialogOpen={itemDialogOpen} setItemDialogOpen={setItemDialogOpen} txDialogOpen={txDialogOpen} setTxDialogOpen={setTxDialogOpen}
        selectedItemId={selectedItemId} txType={txType} stockItems={stockItems} onAddItem={addStockItem} onRecordTx={recordTransaction}
        batches={batches} submitting={submitting} costPrivacyEnabled={costPrivacyEnabled}
      />
    </div>
  );
}
