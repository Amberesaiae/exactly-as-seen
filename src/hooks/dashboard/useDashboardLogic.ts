import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getBatchAge } from '@/lib/batch-utils';
import { getWaterPrescription, getRegionalTemperature } from '@/lib/dosing-utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function useDashboardLogic() {
  const { farmId } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [healthTasks, setHealthTasks] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [mortalityBatch, setMortalityBatch] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!farmId) return;
    setLoading(true);
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const [batchesRes, tasksRes, invRes, revRes, waterRes, farmRes] = await Promise.all([
      supabase.from('batches').select('*').eq('farm_id', farmId).eq('status', 'active').order('start_date', { ascending: false }),
      supabase.from('health_tasks').select('*, batches(name)').eq('farm_id', farmId).eq('completed', false).limit(10),
      supabase.from('stock_items').select('*').eq('farm_id', farmId),
      supabase.rpc('get_farm_financial_stats', { p_farm_id: farmId }),
      supabase.from('water_records').select('batch_id, date').eq('farm_id', farmId).eq('date', todayStr),
      supabase.from('farms').select('region, water_rate_per_liter_pesewas').eq('id', farmId).maybeSingle()
    ]);

    const activeBatches = batchesRes.data ?? [];
    setBatches(activeBatches);
    
    // Generate Virtual Operational Tasks for Dashboard
    const opTasks: any[] = [];
    const todayWaterRecords = waterRes.data ?? [];
    const todayFeedLogs = await supabase.from('feed_logs').select('batch_id').eq('farm_id', farmId).eq('date', todayStr);
    const farmRegion = farmRes.data?.region;
    const waterRate = farmRes.data?.water_rate_per_liter_pesewas;
    const ambientTemp = getRegionalTemperature(farmRegion);

    activeBatches.forEach(b => {
      const age = getBatchAge(b.start_date, b.species);
      
      // 🚿 Water Task
      if (!todayWaterRecords.some(w => w.batch_id === b.id)) {
        const pres = getWaterPrescription({
          species: b.species,
          duckType: b.duck_type,
          week: age.week,
          population: b.current_population,
          temperatureC: ambientTemp
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
          estimated_cost: waterRate ? (pres.liters * waterRate) / 100 : 0
        });
      }

      // 🍲 Feed Task
      if (!todayFeedLogs.data?.some(f => f.batch_id === b.id)) {
        let gPerBird = 150;
        if (age.week === 1) gPerBird = 40;
        else if (age.week === 2) gPerBird = 60;
        else if (age.week === 3) gPerBird = 80;
        else if (age.week === 4) gPerBird = 100;
        
        const totalKg = (b.current_population * gPerBird) / 1000;
        opTasks.push({
          id: `feed:${b.id}:${todayStr}`,
          batch_id: b.id,
          batch_name: b.name,
          task_type: 'feeding',
          title: 'Daily Feeding',
          description: `Provide ${totalKg.toFixed(1)}kg of ${b.species} feed`,
          amount: totalKg,
          unit: 'kg'
        });
      }
    });

    const combinedTasks = [
      ...opTasks,
      ...(tasksRes.data ?? []).map(t => ({ ...t, task_type: 'medication', batch_name: t.batches?.name }))
    ];

    setHealthTasks(combinedTasks);
    
    // Process inventory alerts
    const lowStock = (invRes.data ?? []).filter(item => Number(item.current_quantity) <= Number(item.reorder_threshold));
    setInventoryStats({ total: invRes.data?.length ?? 0, low: lowStock.length, items: lowStock });
    
    setRevenueStats(revRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [farmId]);

  const handleMortalitySuccess = (batchId: string, newPop: number) => {
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, current_population: newPop } : b));
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
      profit: (revenueStats?.total_revenue ?? 0) - (revenueStats?.total_expenses ?? 0)
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
    refresh: fetchDashboardData
  };
}
