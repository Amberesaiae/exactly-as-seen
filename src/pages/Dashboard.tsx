import { useDashboardLogic } from '@/hooks/dashboard/useDashboardLogic';
import { Skeleton } from '@/components/ui/skeleton';
import { MortalityDialog } from '@/components/MortalityDialog';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ActiveBatchesGrid } from '@/components/dashboard/ActiveBatchesGrid';
import { HealthTasksList } from '@/components/dashboard/HealthTasksList';
import { InventoryAlerts } from '@/components/dashboard/InventoryAlerts';
import { MarketTrends } from '@/components/dashboard/MarketTrends';

export default function Dashboard() {
  const {
    batches,
    healthTasks,
    inventoryStats,
    dashboardStats,
    mortalityBatch,
    setMortalityBatch,
    loading,
    handleMortalitySuccess
  } = useDashboardLogic();

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Farm Overview</h1>
        <p className="text-sm text-muted-foreground">Welcome back to your dashboard</p>
      </div>

      <StatsOverview stats={dashboardStats} />

      <ActiveBatchesGrid 
        batches={batches} 
        onRecordMortality={setMortalityBatch} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HealthTasksList tasks={healthTasks} />
        <InventoryAlerts stats={inventoryStats} />
      </div>

      <MarketTrends />

      <MortalityDialog
        batch={mortalityBatch}
        farmId={batches[0]?.farm_id || null}
        onClose={() => setMortalityBatch(null)}
        onSuccess={handleMortalitySuccess}
      />
    </div>
  );
}
