import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getBatchAge } from '@/lib/batch-utils';
import { getWaterPrescription, getRegionalTemperature } from '@/lib/dosing-utils';
import { getPrescriptiveFeedIntake, getForagingModifier } from '@/lib/health-data';
import { isSemiIntensiveSystem } from '@/lib/production-system';
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
      const [batchesRes, tasksRes, invRes, revRes, waterRes, farmRes, feedRes] = await Promise.all([
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
        supabase.from('water_records').select('batch_id, date').eq('farm_id', farmId).eq('date', todayStr),
        supabase.from('farms').select('location_region, water_rate_per_liter_pesewas').eq('id', farmId).maybeSingle(),
        supabase.from('feed_logs').select('batch_id').eq('farm_id', farmId).eq('date', todayStr),
      ]);

      if (gen !== fetchGenRef.current) return;

      const activeBatches = batchesRes.data ?? [];
      const todayWaterRecords = waterRes.data ?? [];
      const todayFeedLogs = feedRes.data ?? [];

      // Virtual ops (stable ids: type:batch:date)
      const opTasks: any[] = [];
      const farmRegion = farmRes.data?.location_region ?? null;
      const waterRate = farmRes.data?.water_rate_per_liter_pesewas;
      const ambientTemp = getRegionalTemperature(farmRegion);

      activeBatches.forEach((b) => {
        const age = getBatchAge(b.start_date, b.species);

        if (!todayWaterRecords.some((w) => w.batch_id === b.id)) {
          const pres = getWaterPrescription({
            species: b.species,
            duckType: b.duck_type,
            week: age.week,
            population: b.current_population,
            temperatureC: ambientTemp,
          });
          opTasks.push({
            id: `water:${b.id}:${todayStr}`,
            batch_id: b.id,
            batch_name: b.name,
            task_type: 'hydration',
            title: 'Daily Hydration',
            description: `Provide ${pres.gallons} gal water`,
            amount: pres.gallons,
            unit: 'gal',
            estimated_cost: waterRate ? (pres.liters * waterRate) / 100 : 0,
          });
        }

        if (!todayFeedLogs.some((f) => f.batch_id === b.id)) {
          let kgPerBird = getPrescriptiveFeedIntake(b.species, age.week);
          const foragingMod = getForagingModifier(b.species, age.week);
          if (isSemiIntensiveSystem(b.production_system) && foragingMod > 0) {
            kgPerBird = kgPerBird * (1 - foragingMod);
          }
          const totalKg = b.current_population * kgPerBird;
          opTasks.push({
            id: `feed:${b.id}:${todayStr}`,
            batch_id: b.id,
            batch_name: b.name,
            task_type: 'feeding',
            title: 'Daily Feeding',
            description: `Provide ${totalKg.toFixed(1)}kg of ${b.species} feed`,
            amount: totalKg,
            unit: 'kg',
          });
        }
      });

      const combinedTasks = buildTodayChecklist({
        todayStr,
        maxItems: 24,
        virtualOps: opTasks,
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
