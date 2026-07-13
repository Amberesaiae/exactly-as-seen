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

  // Load batch-specific data — only re-run when selection/farm changes (not every batches identity)
  useEffect(() => {
    if (!selectedBatch || !farmId) {
      setVaccinations([]);
      setHealthTasks([]);
      setWaterRecords([]);
      setBatchTasks([]);
      setFeedLogs([]);
      return;
    }

    let cancelled = false;

    const loadBatchData = async () => {
      const { data: activeBatch } = await supabase
        .from('batches')
        .select('*')
        .eq('id', selectedBatch)
        .maybeSingle();
      if (!activeBatch || cancelled) return;

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

      if (cancelled) return;

      setVaccinations(vResult.data ?? []);
      setHealthTasks(hResult.data ?? []);
      setWaterRecords(wResult.data ?? []);
      setBatchTasks(btResult.data ?? []);
      setFeedLogs(flResult.data ?? []);
      fetchWeeklySummary(selectedBatch, age.week);
    };

    loadBatchData();
    return () => { cancelled = true; };
  }, [selectedBatch, farmId, fetchWeeklySummary, setVaccinations, setWaterRecords]);

  const addMedication = async (params: any) => {
    const task = await baseAddMedication(params);
    if (task) setHealthTasks(prev => [task, ...prev]);
  };

  const markTaskComplete = async (taskId: string, costPesewas: number = 0) => {
    const task = healthTasks.find(t => t.id === taskId);
    const result = await baseMarkTaskComplete(taskId, costPesewas);
    if (result) {
      const completedAt = new Date().toISOString();
      setHealthTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, completed: true, completed_at: completedAt,
        withdrawal_meat_until: result.withdrawalMeatUntil,
        withdrawal_eggs_until: result.withdrawalEggsUntil,
        cost_pesewas: costPesewas || null
      } : t));
      // Keep Vaccines tab counter in sync without full reload
      if (result.isVaccination && task?.product_name) {
        setVaccinations(prev => prev.map(v =>
          v.vaccine_name === task.product_name && !v.administered
            ? { ...v, administered: true, administered_at: completedAt }
            : v
        ));
      }
    }
  };

  const markVaccineAdministered = async (vId: string, costPesewas: number = 0, notes?: string) => {
    const vaccine = vaccinations.find(v => v.id === vId);
    const ok = await baseMarkVaccineAdministered(vId, vaccinations, costPesewas, notes);
    if (ok && vaccine?.vaccine_name) {
      const completedAt = new Date().toISOString();
      setHealthTasks(prev => prev.map(t =>
        t.task_type === 'vaccination' && t.product_name === vaccine.vaccine_name && !t.completed
          ? { ...t, completed: true, completed_at: completedAt }
          : t
      ));
    }
  };

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const fulfillOperationalTask = async (task: any) => {
    if (!farmId || !selectedBatch) return;

    if (task.task_type === 'hydration') {
      await logWater(task.amount, todayTemp, 'Protocol fulfilled via Task Orchestrator');
      toast.success(`Today's hydration confirmed: ${task.amount} ${task.unit}`);
    } else if (task.task_type === 'feeding') {
      const {
        shouldDeductStockOnConsumption,
        shouldExpenseConsumption,
        shouldOfferBookNow,
        shouldSkipDayFeedExpense,
      } = await import('@/lib/ledger-policy');
      const { autoCreateExpense, autoDeductStock } = await import('@/lib/synergy');
      const { LEDGER_SOURCES } = await import('@/lib/canonical');
      const { queueWrite } = await import('@/lib/sync');
      const active = batches.find(b => b.id === selectedBatch);
      const system = active?.production_system as any;
      const deductStock = shouldDeductStockOnConsumption(system);
      const expenseConsumption = shouldExpenseConsumption(system);

      const { pickPreferredFeedStock } = await import('@/lib/stock-match');
      const { data: allStock } = await supabase.from('stock_items').select('*').eq('farm_id', farmId);
      const feedStock = pickPreferredFeedStock(allStock ?? []);
      const feedName = feedStock?.name ?? `${active?.species ?? 'flock'} feed`;
      const sourceRef = `day-feed:${selectedBatch}:${todayStr}`;
      const unitPricePesewas = feedStock ? Number(feedStock.unit_price_pesewas || 0) : 0;
      const unitPrice = unitPricePesewas / 100;
      const bookAmount = unitPrice > 0 ? task.amount * unitPrice : 0;

      // Double-ledger guard: stock purchase same day → stock-out only, no second expense
      let stockPurchasedSameDay = false;
      if (feedStock) {
        const { data: txs } = await supabase
          .from('stock_transactions')
          .select('id')
          .eq('farm_id', farmId)
          .eq('stock_item_id', feedStock.id)
          .eq('transaction_type', 'purchase')
          .gte('date', todayStr)
          .limit(1);
        stockPurchasedSameDay = (txs?.length ?? 0) > 0;
      }
      const skipExpense = shouldSkipDayFeedExpense({ stockPurchasedSameDay, unitPricePesewas });

      // Offline: queue payload for later flush
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await queueWrite('feed_logs', 'insert', crypto.randomUUID(), {
          farm_id: farmId,
          batch_id: selectedBatch,
          quantity_kg: task.amount,
          feed_type: feedName,
          date: todayStr,
        });
        toast.warning('Offline — feed queued; will sync when online');
        setFeedLogs(prev => [{ id: 'temp', date: todayStr, quantity_kg: task.amount } as any, ...prev]);
        return;
      }

      // Atomic RPC preferred
      const ledger = deductStock && !!feedStock;
      const { data: rpcData, error: rpcErr } = await supabase.rpc('confirm_day_feed' as any, {
        p_farm_id: farmId,
        p_batch_id: selectedBatch,
        p_quantity_kg: task.amount,
        p_feed_type: feedName,
        p_date: todayStr,
        p_ledger: ledger && expenseConsumption,
        p_stock_item_id: feedStock?.id ?? null,
        p_unit_price_pesewas: unitPricePesewas,
        p_skip_expense: skipExpense || !expenseConsumption,
      });

      if (rpcErr) {
        // Client fallback
        const { error: logErr } = await supabase.from('feed_logs').insert({
          batch_id: selectedBatch,
          farm_id: farmId,
          quantity_kg: task.amount,
          feed_type: feedName,
          date: todayStr,
        });
        if (logErr) {
          toast.error(logErr.message.includes('duplicate') || logErr.code === '23505'
            ? 'Feed already logged for today'
            : logErr.message);
          return;
        }
        if (deductStock && feedStock) {
          await autoDeductStock({
            farmId, itemName: feedStock.name, quantity: task.amount,
            batchId: selectedBatch, reason: `Daily feeding ${task.amount}kg`, sourceRef,
          });
          if (expenseConsumption && !skipExpense && unitPrice > 0) {
            await autoCreateExpense({
              farmId, batchId: selectedBatch, category: 'feed_and_nutrition',
              description: `Daily Feeding: ${task.amount}kg ${feedStock.name}`,
              amount: bookAmount, source: LEDGER_SOURCES.feed, sourceRef,
            });
          }
        }
      } else if ((rpcData as any)?.already_logged) {
        toast.error('Feed already logged for today');
        return;
      }

      if (deductStock && feedStock) {
        toast.success(
          skipExpense
            ? `Today's feeding confirmed: ${task.amount}kg (stock out; expense skipped — purchased today)`
            : `Today's feeding confirmed: ${task.amount}kg deducted from stock`
        );
      } else if (deductStock && !feedStock) {
        toast.warning(`Feed logged (${task.amount}kg) — no feed stock item found for auto-deduct`);
      } else if (shouldOfferBookNow(system)) {
        toast.message(`Today's feeding logged: ${task.amount}kg (flexible — not auto-ledgered)`, {
          duration: 8000,
          action: bookAmount > 0
            ? {
                label: 'Book now',
                onClick: async () => {
                  await supabase.rpc('confirm_day_feed' as any, {
                    p_farm_id: farmId,
                    p_batch_id: selectedBatch,
                    p_quantity_kg: task.amount,
                    p_feed_type: feedName,
                    p_date: todayStr,
                    p_ledger: true,
                    p_stock_item_id: feedStock?.id ?? null,
                    p_unit_price_pesewas: unitPricePesewas,
                    p_skip_expense: false,
                  }).catch(async () => {
                    await autoCreateExpense({
                      farmId, batchId: selectedBatch, category: 'feed_and_nutrition',
                      description: `Daily Feeding (booked): ${task.amount}kg ${feedName}`,
                      amount: bookAmount, source: LEDGER_SOURCES.feed, sourceRef: `${sourceRef}:book`,
                    });
                  });
                  toast.success('Feed expense booked');
                },
              }
            : {
                label: 'Open Ledger',
                onClick: () => { window.location.href = '/finance'; },
              },
        });
      } else {
        toast.success(`Today's feeding logged: ${task.amount}kg`);
      }

      setFeedLogs(prev => [{ id: 'temp', date: todayStr, quantity_kg: task.amount } as any, ...prev]);
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
      const [tasksRes, vaxRes] = await Promise.all([
        supabase
          .from('health_tasks')
          .select('*')
          .eq('batch_id', batchId)
          .order('scheduled_date', { ascending: false }),
        supabase
          .from('vaccination_schedule')
          .select('*')
          .eq('batch_id', batchId)
          .order('scheduled_date'),
      ]);
      if (tasksRes.data) setHealthTasks(tasksRes.data);
      if (vaxRes.data) setVaccinations(vaxRes.data);
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
    feedLogs,
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
