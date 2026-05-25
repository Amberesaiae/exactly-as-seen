import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, differenceInDays, isAfter, isBefore, isToday } from 'date-fns';
import {
  VACCINATION_TEMPLATES, getActiveAlerts, getExpectedRate,
} from '@/lib/health-data';
import { getBatchAge } from '@/lib/batch-utils';
import type { Database } from '@/integrations/supabase/types';
import { detectConflicts } from '@/lib/medication-conflicts';
import { computeDose } from '@/lib/dosing';

type Batch = Database['public']['Tables']['batches']['Row'];
type HealthTask = Database['public']['Tables']['health_tasks']['Row'];
type VaccinationRow = Database['public']['Tables']['vaccination_schedule']['Row'];
type WaterRecord = Database['public']['Tables']['water_records']['Row'];

export type WeeklySummary = {
  health_tasks_total: number;
  health_tasks_completed: number;
  health_tasks_pending: number;
  batch_tasks_total: number;
  batch_tasks_completed: number;
  total_health_cost_pesewas: number | null;
  next_week_tasks: Array<{ product_name: string; task_type: string; scheduled_date: string; is_vaccination: boolean }>;
};

export function useHealthData() {
  const { user, farmId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [vaccinations, setVaccinations] = useState<VaccinationRow[]>([]);
  const [healthTasks, setHealthTasks] = useState<HealthTask[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterRecord[]>([]);
  const [generatingVaccines, setGeneratingVaccines] = useState(false);
  const [medSubmitting, setMedSubmitting] = useState(false);
  const [waterSaving, setWaterSaving] = useState(false);

  // New state variables for BC-2
  const [medications, setMedications] = useState<any[]>([]);
  const [containerTypes, setContainerTypes] = useState<any[]>([]);
  const [waterSourceChlorinated, setWaterSourceChlorinated] = useState(false);

  // Weekly Health summary and batch tasks states
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [batchTasks, setBatchTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !farmId) return;
    const load = async () => {
      setLoading(true);
      const { data: b } = await supabase.from('batches').select('*').eq('farm_id', farmId).eq('status', 'active');
      setBatches(b ?? []);
      if (b?.length) setSelectedBatch(b[0].id);

      // Load medications, container types, and farm chlorinated flag
      const [medsRes, containersRes, farmRes] = await Promise.all([
        supabase.from('medications').select('*'),
        supabase.from('container_types').select('*'),
        supabase.from('farms').select('water_source_chlorinated').eq('id', farmId).maybeSingle()
      ]);

      setMedications(medsRes.data ?? []);
      setContainerTypes(containersRes.data ?? []);
      setWaterSourceChlorinated(farmRes.data?.water_source_chlorinated ?? false);

      setLoading(false);
    };
    load();
  }, [user, farmId]);

  // Load batch-specific data
  useEffect(() => {
    if (!selectedBatch || !farmId) {
      setVaccinations([]);
      setHealthTasks([]);
      setWaterRecords([]);
      setBatchTasks([]);
      setWeeklySummary(null);
      return;
    }

    const activeBatch = batches.find(b => b.id === selectedBatch);
    if (!activeBatch) return;
    const age = getBatchAge(activeBatch.start_date, activeBatch.species);

    const startDate = new Date(activeBatch.start_date);
    const weekStart = addDays(startDate, (age.week - 1) * 7);
    const weekEnd = addDays(weekStart, 7);
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

    Promise.all([
      supabase.from('vaccination_schedule').select('*').eq('batch_id', selectedBatch).order('scheduled_date'),
      supabase.from('health_tasks').select('*').eq('batch_id', selectedBatch).order('scheduled_date', { ascending: false }),
      supabase.from('water_records').select('*').eq('batch_id', selectedBatch).order('date', { ascending: false }).limit(14),
      supabase.from('batch_tasks').select('*').eq('batch_id', selectedBatch).eq('farm_id', farmId).gte('due_date', weekStartStr).lt('due_date', weekEndStr),
    ]).then(([vResult, hResult, wResult, btResult]) => {
      setVaccinations(vResult.data ?? []);
      setHealthTasks(hResult.data ?? []);
      setWaterRecords(wResult.data ?? []);
      setBatchTasks(btResult.data ?? []);
    });

    fetchWeeklySummary(selectedBatch, age.week);
  }, [selectedBatch, farmId, batches]);

  const batch = batches.find(b => b.id === selectedBatch);
  const batchAge = batch ? getBatchAge(batch.start_date, batch.species) : null;
  const today = new Date();

  // Derived data
  const pendingVaccines = vaccinations.filter(v => !v.administered && isBefore(new Date(v.scheduled_date), addDays(today, 7)));
  const overdueVaccines = vaccinations.filter(v => !v.administered && isBefore(new Date(v.scheduled_date), today) && !isToday(new Date(v.scheduled_date)));
  const activeMeds = healthTasks.filter(t => !t.completed && t.task_type === 'medication');
  const latestTemp = waterRecords.length > 0 ? waterRecords[0].temperature_c : null;

  const healthAlerts = useMemo(() => {
    if (!batch || !batchAge) return [];
    return getActiveAlerts(batch.species, batchAge.phase, batchAge.week, latestTemp ? Number(latestTemp) : null);
  }, [batch, batchAge, latestTemp]);

  const activeWithdrawals = useMemo(() => {
    return healthTasks.filter(t => {
      if (t.completed) {
        return (t.withdrawal_meat_until && isBefore(today, new Date(t.withdrawal_meat_until))) ||
               (t.withdrawal_eggs_until && isBefore(today, new Date(t.withdrawal_eggs_until)));
      }
      const startDate = new Date(t.scheduled_date);
      const endDate = addDays(startDate, t.duration_days);
      const meatSafe = addDays(endDate, t.withdrawal_meat_days);
      const eggSafe = addDays(endDate, t.withdrawal_egg_days);
      return (isBefore(today, meatSafe) && t.withdrawal_meat_days > 0) ||
             (isBefore(today, eggSafe) && t.withdrawal_egg_days > 0);
    });
  }, [healthTasks]);

  const eggDiscardInfo = useMemo(() => {
    if (!batch || !batchAge) return null;
    if (!['layer', 'duck', 'turkey'].includes(batch.species)) return null;

    const eggWithdrawalTasks = healthTasks.filter(t => {
      if (t.completed) {
        return t.withdrawal_eggs_until && isBefore(today, new Date(t.withdrawal_eggs_until));
      }
      const startDate = new Date(t.scheduled_date);
      const endDate = addDays(startDate, t.duration_days);
      const eggSafe = addDays(endDate, t.withdrawal_egg_days);
      return t.withdrawal_egg_days > 0 && isBefore(today, eggSafe);
    });

    if (eggWithdrawalTasks.length === 0) return null;

    let latestEggSafe = today;
    for (const t of eggWithdrawalTasks) {
      let eggSafe = today;
      if (t.completed && t.withdrawal_eggs_until) {
        eggSafe = new Date(t.withdrawal_eggs_until);
      } else {
        const endDate = addDays(new Date(t.scheduled_date), t.duration_days);
        eggSafe = addDays(endDate, t.withdrawal_egg_days);
      }
      if (isAfter(eggSafe, latestEggSafe)) latestEggSafe = eggSafe;
    }

    const daysLeft = Math.max(0, differenceInDays(latestEggSafe, today));
    const expectedRate = getExpectedRate(batch.species, batchAge.week);
    const dailyRate = expectedRate ? (expectedRate.min + expectedRate.max) / 200 : 0;
    const estimatedEggs = Math.round(batch.current_population * dailyRate * daysLeft);

    return {
      daysLeft,
      safeDate: latestEggSafe,
      estimatedEggs,
      products: eggWithdrawalTasks.map(t => t.product_name),
    };
  }, [healthTasks, batch, batchAge]);

  const waterChartData = useMemo(() => {
    if (!waterRecords.length) return [];
    return [...waterRecords].reverse().map(w => ({
      date: format(new Date(w.date), 'MMM d'),
      gallons: Number(w.gallons_consumed),
      temp: w.temperature_c ? Number(w.temperature_c) : null,
    }));
  }, [waterRecords]);

  const waterGuideline = batch ? Number((batch.current_population * 0.06).toFixed(1)) : 0;
  const todayWaterLogged = waterRecords.some(w => w.date === format(today, 'yyyy-MM-dd'));

  // Actions
  const generateVaccinationSchedule = async () => {
    if (!farmId || !batch) return;
    setGeneratingVaccines(true);
    const templates = VACCINATION_TEMPLATES.filter(t => t.species.includes(batch.species));
    const startDate = new Date(batch.start_date);
    const records = templates.map(t => ({
      batch_id: batch.id,
      farm_id: farmId,
      vaccine_name: t.name,
      scheduled_week: t.scheduledWeek,
      scheduled_date: format(addDays(startDate, t.scheduledWeek * 7), 'yyyy-MM-dd'),
    }));

    const { data, error } = await supabase.from('vaccination_schedule').insert(records).select();
    if (error) {
      toast.error(error.message);
      setGeneratingVaccines(false);
      return;
    }

    setVaccinations(data ?? []);
    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'vaccination',
      description: `Generated ${records.length} vaccination schedule entries for ${batch.name}`,
    });

    toast.success(`Generated ${records.length} vaccinations`);
    setGeneratingVaccines(false);
  };

  const markVaccineAdministered = async (vId: string) => {
    const { error } = await supabase.from('vaccination_schedule')
      .update({ administered: true, administered_at: new Date().toISOString() })
      .eq('id', vId);
    if (error) { toast.error(error.message); return; }
    setVaccinations(prev => prev.map(v => v.id === vId ? { ...v, administered: true, administered_at: new Date().toISOString() } : v));

    if (farmId) {
      const vaccine = vaccinations.find(v => v.id === vId);
      await supabase.from('activity_log').insert({
        farm_id: farmId,
        batch_id: selectedBatch,
        event_type: 'vaccination',
        description: `Administered ${vaccine?.vaccine_name ?? 'vaccine'}`,
      });
    }
    toast.success('Vaccine marked as administered');
  };

  const addMedication = async (params: {
    medicationId: string;
    taskType: string;
    durationDays: number;
    withdrawalMeatDays: number;
    withdrawalEggDays: number;
    dosePerGallon?: string;
    indication?: string;
    containerTypeId?: string;
    containerCount?: number;
    waterVolumeL?: number;
    computedDoseAmount?: number;
    computedDoseUnit?: string;
    birdCount?: number;
    costPesewas?: number;
    notes?: string;
    scheduledDate?: string;
  }) => {
    if (!farmId || !selectedBatch) return;

    const newMed = medications.find(m => m.id === params.medicationId);
    if (!newMed) {
      toast.error("Invalid medication selected");
      return;
    }

    const newDate = params.scheduledDate || format(new Date(), 'yyyy-MM-dd');
    const newDuration = params.durationDays;

    const neighborhood = healthTasks
      .map(t => {
        const med = medications.find(m => m.id === t.medication_id);
        return { task: t, med };
      })
      .filter((item): item is { task: any; med: any } => item.med !== undefined);

    const conflicts = detectConflicts({
      newMed,
      newDate,
      newDuration,
      neighborhood,
      waterSourceChlorinated,
    });

    const blocks = conflicts.filter(c => c.severity === 'BLOCK');
    const warnings = conflicts.filter(c => c.severity === 'WARN');

    if (blocks.length > 0) {
      blocks.forEach(b => toast.error(b.message));
      return;
    }

    if (warnings.length > 0) {
      warnings.forEach(w => toast.warning(w.message));
    }

    setMedSubmitting(true);
    const dosingInfo = params.dosePerGallon ? `${params.dosePerGallon} | ${params.indication || ''}` : '';

    const { data: task, error } = await supabase.from('health_tasks').insert({
      batch_id: selectedBatch,
      farm_id: farmId,
      task_type: params.taskType,
      product_name: newMed.name,
      medication_id: params.medicationId,
      delivery_method: newMed.delivery_method,
      container_type_id: params.containerTypeId || null,
      container_count: params.containerCount || null,
      water_volume_l: params.waterVolumeL || null,
      computed_dose_amount: params.computedDoseAmount || null,
      computed_dose_unit: params.computedDoseUnit || null,
      bird_count: params.birdCount || null,
      duration_days: params.durationDays,
      withdrawal_meat_days: params.withdrawalMeatDays,
      withdrawal_egg_days: params.withdrawalEggDays,
      cost_pesewas: params.costPesewas || null,
      scheduled_date: newDate,
      notes: params.notes ? `${dosingInfo}\n${params.notes}` : dosingInfo,
    }).select().single();

    if (error) { toast.error(error.message); setMedSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: selectedBatch,
      event_type: 'health_task',
      description: `Started ${newMed.name} — ${params.durationDays}d course`,
    });

    setHealthTasks(prev => [task, ...prev]);
    setMedSubmitting(false);
    toast.success('Medication recorded');
  };

  const markTaskComplete = async (taskId: string, costPesewas: number = 0) => {
    const task = healthTasks.find(t => t.id === taskId);
    if (!task) return;

    const completedAt = new Date();
    const completedAtISO = completedAt.toISOString();

    let withdrawalMeatUntil: string | null = null;
    let withdrawalEggsUntil: string | null = null;
    let hasWithdrawal = false;

    if (task.withdrawal_meat_days && task.withdrawal_meat_days > 0) {
      withdrawalMeatUntil = format(addDays(completedAt, task.withdrawal_meat_days), 'yyyy-MM-dd');
      hasWithdrawal = true;
    }
    if (task.withdrawal_egg_days && task.withdrawal_egg_days > 0) {
      withdrawalEggsUntil = format(addDays(completedAt, task.withdrawal_egg_days), 'yyyy-MM-dd');
      hasWithdrawal = true;
    }

    const { error } = await supabase.from('health_tasks')
      .update({ 
        completed: true, 
        completed_at: completedAtISO,
        withdrawal_meat_until: withdrawalMeatUntil,
        withdrawal_eggs_until: withdrawalEggsUntil,
        cost_pesewas: costPesewas || null
      })
      .eq('id', taskId);

    if (error) { toast.error(error.message); return; }

    setHealthTasks(prev => prev.map(t => t.id === taskId ? { 
      ...t, 
      completed: true, 
      completed_at: completedAtISO,
      withdrawal_meat_until: withdrawalMeatUntil,
      withdrawal_eggs_until: withdrawalEggsUntil,
      cost_pesewas: costPesewas || null
    } : t));

    if (hasWithdrawal && selectedBatch) {
      const { error: batchErr } = await supabase.from('batches')
        .update({ has_active_withdrawal: true })
        .eq('id', selectedBatch);
      
      if (batchErr) {
        console.error("Failed to update batch active withdrawal flag:", batchErr);
      } else {
        setBatches(prev => prev.map(b => b.id === selectedBatch ? { ...b, has_active_withdrawal: true } : b));
      }
    }

    if (farmId && task && task.task_type === 'medication') {
      // Fetch batch details to check production system
      const { data: activeBatch } = await supabase
        .from('batches')
        .select('production_system')
        .eq('id', task.batch_id)
        .maybeSingle();

      const isIntensive = activeBatch?.production_system === 'intensive';

      if (isIntensive && task.product_name) {
        // Find the stock item matching task.product_name
        const { data: matchedStock } = await supabase
          .from('stock_items')
          .select('*')
          .eq('farm_id', farmId)
          .ilike('name', task.product_name)
          .maybeSingle();

        if (matchedStock) {
          const qtyToDeduct = Number(task.computed_dose_amount || task.container_count || 1);
          const { error: allocError } = await (supabase as any).rpc('allocate_fifo_by_quality', {
            p_farm_id: farmId,
            p_stock_item_id: matchedStock.id,
            p_qty_needed: qtyToDeduct,
            p_batch_id: task.batch_id,
            p_reason: `Auto-deduction for medication: ${task.product_name}`,
            p_source_ref: taskId
          });

          if (allocError) {
            console.error('Failed to allocate inventory for health task:', allocError);
            toast.error(`Stock allocation failed: ${allocError.message}`);
          } else {
            // Explicitly update stock item quantity
            const newStockQty = Math.max(0, Number(matchedStock.current_quantity) - qtyToDeduct);
            await supabase.from('stock_items')
              .update({
                current_quantity: newStockQty,
                updated_at: new Date().toISOString()
              })
              .eq('id', matchedStock.id);
          }
        }
      }

      await supabase.from('expenses').upsert({
        farm_id: farmId,
        batch_id: selectedBatch,
        category: 'medication',
        description: `${task.product_name} — ${task.duration_days}d course`,
        amount_pesewas: costPesewas,
        date: new Date().toISOString(),
        source: 'auto:health',
        source_ref: taskId,
      }, { onConflict: 'source,source_ref', ignoreDuplicates: true });
    }
    toast.success('Task completed');
  };

  const logWater = async (gallons: number, temp?: number | null, notes?: string) => {
    if (!farmId || !selectedBatch) return;
    setWaterSaving(true);

    const { data, error } = await supabase.from('water_records').insert({
      batch_id: selectedBatch,
      farm_id: farmId,
      gallons_consumed: gallons,
      temperature_c: temp,
      notes: notes || null,
    }).select().single();

    if (error) { toast.error(error.message); setWaterSaving(false); return; }
    setWaterRecords(prev => [data, ...prev.slice(0, 13)]);
    setWaterSaving(false);

    if (temp && temp > 32) {
      toast.warning('⚠️ High temperature detected! Consider adding electrolytes to water and increasing ventilation.', { duration: 6000 });
    }
    toast.success('Water consumption logged');
  };

  const fetchWeeklySummary = async (batchId: string, weekNumber: number) => {
    if (!farmId) return;
    setWeeklyLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_weekly_health_summary', {
        p_batch_id: batchId,
        p_week_number: weekNumber,
        p_farm_id: farmId
      });
      if (error) throw error;
      setWeeklySummary(data as WeeklySummary);
    } catch (err: any) {
      console.error('Error fetching weekly summary:', err);
    } finally {
      setWeeklyLoading(false);
    }
  };

  const bulkCompleteWeekTasks = async (batchId: string, weekNumber: number) => {
    if (!farmId) return;
    try {
      const { error } = await supabase.rpc('bulk_complete_health_tasks', {
        p_batch_id: batchId,
        p_week_number: weekNumber,
        p_farm_id: farmId,
        p_completed_at: new Date().toISOString()
      });
      if (error) throw error;

      toast.success('Successfully completed all pending weekly health tasks');

      // Refresh health tasks & weekly summary
      const { data: refreshedTasks } = await supabase
        .from('health_tasks')
        .select('*')
        .eq('batch_id', batchId)
        .order('scheduled_date', { ascending: false });
      if (refreshedTasks) {
        setHealthTasks(refreshedTasks);
      }

      await fetchWeeklySummary(batchId, weekNumber);
    } catch (err: any) {
      console.error('Error in bulk complete:', err);
      toast.error('Failed to complete weekly tasks: ' + err.message);
    }
  };

  return {
    batches,
    selectedBatch,
    setSelectedBatch,
    vaccinations,
    healthTasks,
    waterRecords,
    loading,
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
    waterGuideline,
    todayWaterLogged,
    generateVaccinationSchedule,
    markVaccineAdministered,
    addMedication,
    markTaskComplete,
    logWater,
    medications,
    containerTypes,
    waterSourceChlorinated,
    weeklySummary,
    weeklyLoading,
    batchTasks,
    fetchWeeklySummary,
    bulkCompleteWeekTasks,
  };
}
