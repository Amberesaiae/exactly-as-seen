import { useState } from 'react';
import { useEggData } from '@/hooks/useEggData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Egg, Plus, ShoppingCart, BarChart3, Package } from 'lucide-react';

import { EggProductionOverview } from '@/components/eggs/EggProductionOverview';
import { ProductionTab } from '@/components/eggs/ProductionTab';
import { GradingTab } from '@/components/eggs/GradingTab';
import { SalesTab } from '@/components/eggs/SalesTab';
import { EggCollectionDialog } from '@/components/eggs/EggCollectionDialog';
import { EggSaleDialog } from '@/components/eggs/EggSaleDialog';
import { LAYER_EGG_START_WEEK, DUCK_EGG_START_WEEK } from '@/lib/canonical';
import { toast } from 'sonner';

export default function Eggs() {
  const {
    loading, batches, selectedBatch, setSelectedBatch, records, sales, batch,
    batchAge, productionRate, expectedRate, avg7Day, weekTotal, sizeDistribution,
    qualityBreakdown, rateDeviation, chartData, salesSummary, eggSubmitting,
    saleSubmitting, costPrivacyEnabled, recordCollection, recordSale, todayStr,
  } = useEggData();

  const [showCollect, setShowCollect] = useState(false);
  const [showSale, setShowSale] = useState(false);

  const week = batchAge?.week ?? batch?.current_week ?? 0;
  const collectionAllowed = (() => {
    if (!batch) return false;
    if (batch.species === 'layer') return week >= LAYER_EGG_START_WEEK;
    if (batch.species === 'duck' && batch.duck_type === 'layer') return week >= DUCK_EGG_START_WEEK;
    // other egg-capable batches: allow if week gate not applicable
    if (batch.species === 'duck' && batch.duck_type !== 'layer') return false;
    return week >= LAYER_EGG_START_WEEK;
  })();

  const openCollect = () => {
    if (!collectionAllowed) {
      const need = batch?.species === 'duck' ? DUCK_EGG_START_WEEK : LAYER_EGG_START_WEEK;
      toast.error(`Collection opens at week ${need} (currently week ${week})`);
      return;
    }
    setShowCollect(true);
  };

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Harvest</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5 rounded-full" onClick={() => setShowSale(true)} disabled={batches.length === 0 || !!batch?.has_active_withdrawal} title={batch?.has_active_withdrawal ? 'Egg withdrawal active' : undefined}><ShoppingCart className="h-4 w-4" /> Sale</Button>
          <Button className="gap-1.5 rounded-full" onClick={openCollect} disabled={!selectedBatch || !collectionAllowed} title={!collectionAllowed ? `Eligible from week ${batch?.species === 'duck' ? DUCK_EGG_START_WEEK : LAYER_EGG_START_WEEK}` : undefined}><Plus className="h-4 w-4" /> Collect</Button>
        </div>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Egg className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold mb-1">No egg-laying batches</h3>
            <p className="text-sm text-muted-foreground">Create a layer, duck, or turkey batch to start tracking.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Active Batch</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.species})</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <EggProductionOverview
            batch={batch} batchAge={batchAge} productionRate={productionRate} avg7Day={avg7Day}
            weekTotal={weekTotal} expectedRate={expectedRate} qualityBreakdown={qualityBreakdown}
            rateDeviation={rateDeviation} todayRecord={records.find(r => r.date === todayStr)}
          />

          <Tabs defaultValue="production" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="production" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Production</TabsTrigger>
              <TabsTrigger value="grading" className="gap-1"><Package className="h-3.5 w-3.5" /> Grading</TabsTrigger>
              <TabsTrigger value="sales" className="gap-1"><ShoppingCart className="h-3.5 w-3.5" /> Sales</TabsTrigger>
            </TabsList>
            <TabsContent value="production" className="mt-4">
              <ProductionTab chartData={chartData} records={records} batch={batch} todayStr={todayStr} expectedRate={expectedRate} onShowCollect={openCollect} />
            </TabsContent>
            <TabsContent value="grading" className="mt-4"><GradingTab qualityBreakdown={qualityBreakdown} sizeDistribution={sizeDistribution} /></TabsContent>
            <TabsContent value="sales" className="mt-4"><SalesTab salesSummary={salesSummary} sales={sales} costPrivacyEnabled={costPrivacyEnabled} onShowSale={() => setShowSale(true)} /></TabsContent>
          </Tabs>
        </>
      )}

      <EggCollectionDialog open={showCollect} onOpenChange={setShowCollect} onSubmit={recordCollection} submitting={eggSubmitting} />
      <EggSaleDialog open={showSale} onOpenChange={setShowSale} onSubmit={recordSale} submitting={saleSubmitting} hasActiveWithdrawal={batch?.has_active_withdrawal} />
    </div>
  );
}
