import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isBefore, isToday } from 'date-fns';
import { getBatchAge } from '@/lib/batch-utils';
import { isOffline, queueWrite } from '@/lib/sync';
import { useHealthBaseData } from './health/useHealthBaseData';
import { useHealthBatchStatus } from './health/useHealthBatchStatus';
import { useVaccinationLogic } from './health/useVaccinationLogic';
import { useMedicationLogic } from './health/useMedicationLogic';
import { useWaterLogic } from './health/useWaterLogic';
import { useWeeklyHealthSummary } from './health/useWeeklyHealthSummary';
import { runPostCompletionSideEffects } from '@/lib/care-completion';
import { toast } from 'sonner';
import { resolvePreferredBatchId, setPreferredBatchId } from '@/lib/preferred-batch';
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

  // Set initial selected batch (prefer just-created flock)
  useEffect(() => {
    if (!batches.length) return;
    const ids = batches.map((b) => b.id);
    const preferred = resolvePreferredBatchId(ids);
    if (preferred && preferred !== selectedBatch) {
      setSelectedBatch(preferred);
      return;
    }
    if (!selectedBatch) {
      const sorted = [...batches].sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || ''))
      );
      setSelectedBatch(sorted[0].id);
    }
  }, [batches, selectedBatch]);

  // Remember manual selection across modules
  useEffect(() => {
    if (selectedBatch) setPreferredBatchId(selectedBatch);
  }, [selectedBatch]);

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

    if (isOffline()) {
      await queueWrite('farms', 'update', farmId, { water_rate_per_liter_pesewas: rate } as unknown as Record<string, unknown>);
      setWaterRatePesewas(rate);
      toast.success('Water utility rate updated (offline — will sync)');
      return;
    }

    const { error } = await supabase.from('farms').update({ water_rate_per_liter_pesewas: rate }).eq('id', farmId);
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
    feedAmountKg,
  } = useHealthBatchStatus(batch, batchAge, healthTasks, waterRecords, farmRegion, waterRatePesewas, feedLogs);

  // Load batch-specific data — paint first, ensure/reconcile in background (no list thrash)
  useEffect(() => {
    if (!selectedBatch || !farmId) {
      // Only clear when truly unselected — not during batch switch mid-flight
      return;
    }

    let cancelled = false;

    const loadBatchData = async () => {
      const todayStrLocal = format(new Date(), 'yyyy-MM-dd');

      // 1) Fetch everything in parallel first (do NOT block on ensure)
      const [activeBatchRes, vResult, hResult, wResult, flResult, btResult] = await Promise.all([
        supabase.from('batches').select('*').eq('id', selectedBatch).maybeSingle(),
        supabase.from('vaccination_schedule').select('*').eq('batch_id', selectedBatch).order('scheduled_date'),
        supabase.from('health_tasks').select('*').eq('batch_id', selectedBatch).order('scheduled_date', { ascending: true }),
        supabase.from('water_records').select('*').eq('batch_id', selectedBatch).order('date', { ascending: false }).limit(14),
        supabase.from('feed_logs').select('*').eq('batch_id', selectedBatch).eq('date', todayStrLocal).limit(1),
        supabase
          .from('batch_tasks')
          .select('*')
          .eq('batch_id', selectedBatch)
          .eq('farm_id', farmId)
          .order('due_date', { ascending: true }),
      ]);

      if (cancelled) return;

      const activeBatch = activeBatchRes.data;
      if (!activeBatch) return;

      const age = getBatchAge(activeBatch.start_date, activeBatch.species);
      const waterDone = (wResult.data ?? []).some((w: { date?: string }) => w.date === todayStrLocal);
      const feedDone = (flResult.data ?? []).length > 0;

      const {
        reconcileBatchTasksWithOps,
        sortBatchTasksForDisplay,
      } = await import('@/lib/ensure-daily-tasks');

      // Client-side complete flags so UI does not wait on write + re-fetch
      const reconciled = sortBatchTasksForDisplay(
        reconcileBatchTasksWithOps(btResult.data ?? [], {
          todayStr: todayStrLocal,
          waterDone,
          feedDone,
        })
      );

      // Single paint — never clear-then-fill (that caused flicker)
      setVaccinations(vResult.data ?? []);
      setHealthTasks(hResult.data ?? []);
      setWaterRecords(wResult.data ?? []);
      setBatchTasks(reconciled as BatchTask[]);
      setFeedLogs(flResult.data ?? []);
      void fetchWeeklySummary(selectedBatch, age.week);

      // 2) Background: ensure rows exist + persist complete flags (no intermediate blank)
      void (async () => {
        const {
          ensureDailyBatchTasksOnce,
          markBatchTaskComplete,
        } = await import('@/lib/ensure-daily-tasks');

        await ensureDailyBatchTasksOnce({
          farmId,
          batches: [activeBatch],
          todayStr: todayStrLocal,
        });
        if (cancelled) return;

        if (waterDone) {
          await markBatchTaskComplete({
            farmId, batchId: selectedBatch, taskType: 'water_log', date: todayStrLocal,
          });
        }
        if (feedDone) {
          await markBatchTaskComplete({
            farmId, batchId: selectedBatch, taskType: 'feed_log', date: todayStrLocal,
          });
        }
        if (cancelled) return;

        // Soft merge: only re-read if we had zero daily rows (ensure created them)
        const hasToday = reconciled.some((t) => t.due_date === todayStrLocal);
        if (!hasToday) {
          const { data: btData } = await supabase
            .from('batch_tasks')
            .select('*')
            .eq('batch_id', selectedBatch)
            .eq('farm_id', farmId)
            .order('due_date', { ascending: true });
          if (cancelled || !btData) return;
          setBatchTasks(
            sortBatchTasksForDisplay(
              reconcileBatchTasksWithOps(btData, {
                todayStr: todayStrLocal,
                waterDone,
                feedDone,
              })
            ) as BatchTask[]
          );
        }
      })();
    };

    void loadBatchData();
    return () => { cancelled = true; };
  }, [selectedBatch, farmId, fetchWeeklySummary]);

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
      // logWater already toasts success — avoid double toast flicker
      await logWater(task.amount, todayTemp, 'Protocol fulfilled via Task Orchestrator');
      const { markBatchTaskComplete } = await import('@/lib/ensure-daily-tasks');
      await markBatchTaskComplete({
        farmId,
        batchId: selectedBatch,
        taskType: 'water_log',
        date: todayStr,
      });
      setBatchTasks(prev =>
        prev.map(t =>
          t.task_type === 'water_log' && t.due_date === todayStr
            ? { ...t, completed: true, completed_at: new Date().toISOString() }
            : t
        )
      );
    } else if (task.task_type === 'feeding') {
      // F-C-F-006: shared intent — same writer as Feed Lab
      const { confirmDayFeedIntent } = await import('@/lib/feed-confirm');
      const active = batches.find(b => b.id === selectedBatch);

      const outcome = await confirmDayFeedIntent({
        farmId,
        batchId: selectedBatch,
        qty: task.amount,
        species: active?.species ?? null,
        productionSystem: (active?.production_system as string | null) ?? null,
        todayStr,
      });

      if (outcome.status === 'error' || outcome.status === 'blocked' || outcome.status === 'already_logged') {
        return;
      }

      setFeedLogs(prev => {
        const rest = prev.filter(f => f.date !== todayStr);
        return [{ id: 'temp', date: todayStr, quantity_kg: task.amount, batch_id: selectedBatch } as unknown as FeedLog, ...rest];
      });
      if (outcome.status === 'queued') return;
      const { markBatchTaskComplete } = await import('@/lib/ensure-daily-tasks');
      await markBatchTaskComplete({
        farmId,
        batchId: selectedBatch,
        taskType: 'feed_log',
        date: todayStr,
      });
      setBatchTasks(prev =>
        prev.map(t =>
          t.task_type === 'feed_log' && t.due_date === todayStr
            ? { ...t, completed: true, completed_at: new Date().toISOString() }
            : t
        )
      );
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
    // Fetch pending tasks BEFORE the RPC so we can run side-effects for each
    const { data: pendingTasks } = await supabase
      .from('health_tasks')
      .select('*')
      .eq('batch_id', batchId)
      .eq('completed', false);

    const success = await baseBulkCompleteWeekTasks(batchId, weekNumber);
    if (success) {
      // Run post-RPC side-effects for each task that was just completed
      if (farmId && pendingTasks) {
        const results = await Promise.allSettled(
          pendingTasks.map(task => runPostCompletionSideEffects({ farmId, task }))
        );
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.warn('Partial side-effect failures:', failures);
          toast.warning(`${failures.length} of ${results.length} post-completion side-effects failed`);
        }
      }

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
    feedAmountKg,
    fulfillOperationalTask,
  };
}
