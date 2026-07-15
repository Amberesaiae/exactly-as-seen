import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { buildTodayChecklist } from '@/lib/today-tasks';

export function useDashboardLogic() {
  const { farmId } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [healthTasks, setHealthTasks] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [mortalityBatch, setMortalityBatch] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const fetchGenRef = useRef(0);

    const fetchDashboardData = useCallback(async (opts?: { soft?: boolean }) => {
    if (!farmId) return;
    const soft = opts?.soft ?? hasLoadedRef.current;
    // Soft refresh: never blank the whole page (stops skeleton flicker)
    if (!soft) setLoading(true);

    const gen = ++fetchGenRef.current;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
      const [batchesRes, tasksRes, invRes, revRes, batchTasksRes, farmRes] = await Promise.all([
        supabase.from('batches').select('*').eq('farm_id', farmId).eq('status', 'active').order('start_date', { ascending: false }),
        supabase
          .from('health_tasks')
          .select('*, batches(name)')
          .eq('farm_id', farmId)
          .eq('completed', false)
          .lte('scheduled_date', todayStr)
          .order('scheduled_date', { ascending: true })
          .limit(24),
        supabase.from('stock_items').select('*').eq('farm_id', farmId),
        supabase.rpc('get_farm_financial_stats', { p_farm_id: farmId }),
        supabase
          .from('batch_tasks')
          .select('*, batches(name)')
          .eq('farm_id', farmId)
          .order('due_date', { ascending: true }),
        supabase.from('farms').select('location_region, water_rate_per_liter_pesewas').eq('id', farmId).maybeSingle(),
      ]);

      if (gen !== fetchGenRef.current) return;

      const activeBatches = batchesRes.data ?? [];
      const batchTasks = batchTasksRes.data ?? [];

      const combinedTasks = buildTodayChecklist({
        todayStr,
        maxItems: 24,
        batchTasks,
        healthTasks: tasksRes.data ?? [],
      });

      // Apply in one paint
      setBatches(activeBatches);
      setHealthTasks(combinedTasks);
      const lowStock = (invRes.data ?? []).filter(
        (item) => Number(item.current_quantity) <= Number(item.reorder_threshold)
      );
      setInventoryStats({ total: invRes.data?.length ?? 0, low: lowStock.length, items: lowStock });
      setRevenueStats(revRes.data);
      hasLoadedRef.current = true;
      setLoading(false);

      // Background ensure — never block first paint (cron/client seed)
      void import('@/lib/ensure-daily-tasks').then(({ ensureDailyBatchTasksOnce }) =>
        ensureDailyBatchTasksOnce({ farmId, batches: activeBatches, todayStr })
      );
    } catch (e) {
      console.error('dashboard load:', e);
      if (gen === fetchGenRef.current) setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void fetchDashboardData({ soft: false });
  }, [fetchDashboardData]);

  const handleMortalitySuccess = (batchId: string, newPop: number) => {
    setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, current_population: newPop } : b)));
  };

  const dashboardStats = useMemo(() => {
    const totalBirds = batches.reduce((sum, b) => sum + b.current_population, 0);
    const activeFlocks = batches.length;
    const pendingTasks = healthTasks.length;

    return {
      totalBirds,
      activeFlocks,
      pendingTasks,
      revenue: revenueStats?.total_revenue ?? 0,
      expenses: revenueStats?.total_expenses ?? 0,
      profit: (revenueStats?.total_revenue ?? 0) - (revenueStats?.total_expenses ?? 0),
    };
  }, [batches, healthTasks, revenueStats]);

  return {
    batches,
    healthTasks,
    inventoryStats,
    dashboardStats,
    mortalityBatch,
    setMortalityBatch,
    loading,
    handleMortalitySuccess,
    refresh: () => fetchDashboardData({ soft: true }),
  };
}
