import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isBefore, isToday } from 'date-fns';
import { getBatchAge } from '@/lib/batch-utils';
import { useHealthBaseData } from './health/useHealthBaseData';
import { useHealthBatchStatus } from './health/useHealthBatchStatus';
import { useVaccinationLogic } from './health/useVaccinationLogic';
import { useMedicationLogic } from './health/useMedicationLogic';
import { useWaterLogic } from './health/useWaterLogic';
import { useWeeklyHealthSummary } from './health/useWeeklyHealthSummary';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type HealthTask = Database['public']['Tables']['health_tasks']['Row'];
type BatchTask = Database['public']['Tables']['batch_tasks']['Row'];
type Vaccination = Database['public']['Tables']['vaccination_schedule']['Row'];
type WaterRecord = Database['public']['Tables']['water_records']['Row'];
type FeedLog = Database['public']['Tables']['feed_logs']['Row'];

/**
 * Master hook for the Care & Water module.
 * Orchestrates base data, multi-species logic, and synergy-driven operational status.
 */
export function useHealthData() {
  const { farmId } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState('');
  const [healthTasks, setHealthTasks] = useState<HealthTask[]>([]);
  const [batchTasks, setBatchTasks] = useState<BatchTask[]>([]);
  const [feedLogs, setFeedLogs] = useState<FeedLog[]>([]);

  // 1. Base Data
  const {
    batches,
    medications,
    containerTypes,
    waterSourceChlorinated,
    waterRatePesewas,
    setWaterRatePesewas,
    farmRegion,
    baseLoading
  } = useHealthBaseData();

  // Set initial selected batch
  useEffect(() => {
    if (batches.length && !selectedBatch) {
      setSelectedBatch(batches[0].id);
    }
  }, [batches, selectedBatch]);

  const batch = useMemo(() => batches.find(b => b.id === selectedBatch), [batches, selectedBatch]);
  const batchAge = useMemo(() => batch ? getBatchAge(batch.start_date, batch.species) : null, [batch]);

  // 2. Logic Modules
  const {
    generatingVaccines,
    vaccinations,
    setVaccinations,
    generateVaccinationSchedule,
    markVaccineAdministered: baseMarkVaccineAdministered
  } = useVaccinationLogic(farmId, batch);

  const {
    medSubmitting,
    addMedication: baseAddMedication,
    markTaskComplete: baseMarkTaskComplete
  } = useMedicationLogic(farmId, selectedBatch, medications, waterSourceChlorinated, healthTasks);

  const {
    waterSaving,
    waterRecords,
    setWaterRecords,
    logWater: baseLogWater
  } = useWaterLogic(farmId, selectedBatch, waterRatePesewas);

  const updateWaterRate = async (rate: number | null) => {
    if (!farmId) return;
    const { error } = await supabase.from('farms').update({ water_rate_per_liter_pesewas: rate } as any).eq('id', farmId);
    if (error) { toast.error(error.message); return; }
    setWaterRatePesewas(rate);
    toast.success('Water utility rate updated');
  };

  const {
    weeklySummary,
    weeklyLoading,
    fetchWeeklySummary,
    bulkCompleteWeekTasks: baseBulkCompleteWeekTasks
  } = useWeeklyHealthSummary(farmId);

  // 3. Status Module
  const {
    latestTemp,
    healthAlerts,
    activeWithdrawals,
    eggDiscardInfo,
    todayTemp,
    waterPrescription,
    waterChartData,
    totalWaterCostPesewas,
    fwRatioInfo,
    dailyOperationalTasks,
  } = useHealthBatchStatus(batch, batchAge, healthTasks, waterRecords, farmRegion, waterRatePesewas, feedLogs);

  // Load batch-specific data
  useEffect(() => {
    if (!selectedBatch || !farmId) {
      setVaccinations([]);
      setHealthTasks([]);
      setWaterRecords([]);
      setBatchTasks([]);
      return;
    }

    const loadBatchData = async () => {
      const activeBatch = batches.find(b => b.id === selectedBatch);
      if (!activeBatch) return;
      const age = getBatchAge(activeBatch.start_date, activeBatch.species);

      const startDate = new Date(activeBatch.start_date);
      const weekStart = addDays(startDate, (age.week - 1) * 7);
      const weekEnd = addDays(weekStart, 7);
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      const todayStrLocal = format(new Date(), 'yyyy-MM-dd');
      const [vResult, hResult, wResult, btResult, flResult] = await Promise.all([
        supabase.from('vaccination_schedule').select('*').eq('batch_id', selectedBatch).order('scheduled_date'),
        supabase.from('health_tasks').select('*').eq('batch_id', selectedBatch).order('scheduled_date', { ascending: false }),
        supabase.from('water_records').select('*').eq('batch_id', selectedBatch).order('date', { ascending: false }).limit(14),
        supabase.from('batch_tasks').select('*').eq('batch_id', selectedBatch).eq('farm_id', farmId).gte('due_date', weekStartStr).lt('due_date', weekEndStr),
        supabase.from('feed_logs').select('*').eq('batch_id', selectedBatch).eq('date', todayStrLocal).limit(1),
      ]);

      setVaccinations(vResult.data ?? []);
      setHealthTasks(hResult.data ?? []);
      setWaterRecords(wResult.data ?? []);
      setBatchTasks(btResult.data ?? []);
      setFeedLogs(flResult.data ?? []);
      fetchWeeklySummary(selectedBatch, age.week);
    };

    loadBatchData();
  }, [selectedBatch, farmId, batches, setVaccinations, setWaterRecords, fetchWeeklySummary]);

  const addMedication = async (params: any) => {
    const task = await baseAddMedication(params);
    if (task) setHealthTasks(prev => [task, ...prev]);
  };

  const markTaskComplete = async (taskId: string, costPesewas: number = 0) => {
    const result = await baseMarkTaskComplete(taskId, costPesewas);
    if (result) {
      setHealthTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, completed: true, completed_at: new Date().toISOString(),
        withdrawal_meat_until: result.withdrawalMeatUntil,
        withdrawal_eggs_until: result.withdrawalEggsUntil,
        cost_pesewas: costPesewas || null
      } : t));
    }
  };

  const markVaccineAdministered = async (vId: string, costPesewas: number = 0, notes?: string) => {
    await baseMarkVaccineAdministered(vId, vaccinations, costPesewas, notes);
  };

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const fulfillOperationalTask = async (task: any) => {
    if (!farmId || !selectedBatch) return;

    if (task.task_type === 'hydration') {
      await logWater(task.amount, todayTemp, 'Protocol fulfilled via Task Orchestrator');
      toast.success(`Today's hydration confirmed: ${task.amount} ${task.unit}`);
    } else if (task.task_type === 'feeding') {
      const { data: matchedStock } = await supabase
        .from('stock_items')
        .select('*')
        .eq('farm_id', farmId)
        .ilike('category', 'feed')
        .limit(1);

      if (matchedStock?.length) {
        await supabase.from('feed_logs').insert({
          batch_id: selectedBatch,
          farm_id: farmId,
          quantity_kg: task.amount,
          feed_type: matchedStock[0].name,
          date: todayStr
        });
        
        const newQty = Math.max(0, Number(matchedStock[0].current_quantity) - task.amount);
        await supabase.from('stock_items').update({ current_quantity: newQty }).eq('id', matchedStock[0].id);
        
        const unitPrice = Number(matchedStock[0].unit_price_pesewas || 0) / 100;
        await supabase.from('expenses').insert({
          farm_id: farmId,
          batch_id: selectedBatch,
          category: 'feed_and_nutrition',
          description: `Daily Feeding: ${task.amount}kg ${matchedStock[0].name}`,
          amount_pesewas: Math.round(task.amount * unitPrice * 100),
          date: todayStr,
          source: 'auto:feed',
          source_ref: `feed:${selectedBatch}:${todayStr}`,
          payment_method: 'cash',
          payment_status: 'paid',
        });

        setFeedLogs(prev => [{ id: 'temp', date: todayStr, quantity_kg: task.amount } as any, ...prev]);
        toast.success(`Today's feeding confirmed: ${task.amount}kg deducted from stock`);
      } else {
        toast.error('No feed stock found. Please add feed to inventory first.');
      }
    }
  };

  const pendingWaterMeds = useMemo(() => {
    return healthTasks.filter(t => 
      !t.completed && 
      t.delivery_method === 'drinking_water' && 
      t.scheduled_date === todayStr
    );
  }, [healthTasks, todayStr]);

  const logWater = async (gallons: number, temp?: number | null, notes?: string, treatmentTaskId?: string) => {
    const data = await baseLogWater(gallons, temp, notes);
    if (data && treatmentTaskId) {
      await markTaskComplete(treatmentTaskId);
    }
  };

  const bulkCompleteWeekTasks = async (batchId: string, weekNumber: number) => {
    const success = await baseBulkCompleteWeekTasks(batchId, weekNumber);
    if (success) {
      const { data: refreshedTasks } = await supabase
        .from('health_tasks')
        .select('*')
        .eq('batch_id', batchId)
        .order('scheduled_date', { ascending: false });
      if (refreshedTasks) setHealthTasks(refreshedTasks);
    }
  };

  const pendingVaccines = vaccinations.filter(v => !v.administered && isBefore(new Date(v.scheduled_date), addDays(today, 7)));
  const overdueVaccines = vaccinations.filter(v => !v.administered && isBefore(new Date(v.scheduled_date), today) && !isToday(new Date(v.scheduled_date)));
  const activeMeds = healthTasks.filter(t => !t.completed && t.task_type === 'medication');
  const todayWaterLogged = waterRecords.some(w => w.date === todayStr);

  return {
    batches,
    selectedBatch,
    setSelectedBatch,
    vaccinations,
    healthTasks,
    waterRecords,
    loading: baseLoading,
    generatingVaccines,
    medSubmitting,
    waterSaving,
    batch,
    batchAge,
    pendingVaccines,
    overdueVaccines,
    activeMeds,
    latestTemp,
    healthAlerts,
    activeWithdrawals,
    eggDiscardInfo,
    waterChartData,
    waterPrescription,
    todayWaterLogged,
    generateVaccinationSchedule,
    markVaccineAdministered,
    addMedication,
    markTaskComplete,
    logWater,
    medications,
    containerTypes,
    waterSourceChlorinated,
    farmRegion,
    todayTemp,
    weeklySummary,
    weeklyLoading,
    batchTasks,
    fetchWeeklySummary,
    bulkCompleteWeekTasks,
    updateWaterRate,
    waterRatePesewas,
    totalWaterCostPesewas,
    pendingWaterMeds,
    fwRatioInfo,
    dailyOperationalTasks,
    fulfillOperationalTask,
  };
}
