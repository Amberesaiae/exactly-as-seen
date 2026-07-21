import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getBatchAge } from '@/lib/batch-utils';
import { getCurrentPhase } from '@/lib/feed-data';
import { getPrescriptiveFeedIntake, getForagingModifier } from '@/lib/health-data';
import { isSemiIntensiveSystem } from '@/lib/production-system';
import type { Database } from '@/integrations/supabase/types';

type ConfirmDayFeedReturn = Database['public']['Functions']['confirm_day_feed']['Returns'];
import { toast } from 'sonner';
import { resolvePreferredBatchId, setPreferredBatchId } from '@/lib/preferred-batch';

/**
 * Feed Lab data + today's confirm path.
 * Does NOT mount useHealthData (avoids dual selectedBatch + flicker).
 */
export function useFeedData() {
  const { user } = useAuth();
  const [farmId, setFarmId] = useState<string | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [formulations, setFormulations] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [feedLogs, setFeedLogs] = useState<any[]>([]);
  const [feedSaving, setFeedSaving] = useState(false);
  const hasLoadedRef = useRef(false);

  // Stable calendar day for session (avoid effect thrash from new Date() each render)
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Remember manual flock selection for Care / Eggs
  useEffect(() => {
    if (selectedBatch) setPreferredBatchId(selectedBatch);
  }, [selectedBatch]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      if (!hasLoadedRef.current) setLoading(true);
      const { data: farm } = await supabase
        .from('farms')
        .select('id')
        .eq('user_id', user.id)
        .order('setup_complete', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);

      const [batchResult, formulationResult, recipeResult, todayLogs] = await Promise.all([
        supabase
          .from('batches')
          .select('*')
          .eq('farm_id', farm.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase.from('feed_formulations').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('feed_recipes').select('*').eq('farm_id', farm.id).order('name'),
        supabase
          .from('feed_logs')
          .select('batch_id')
          .eq('farm_id', farm.id)
          .eq('date', todayStr),
      ]);

      if (cancelled) return;
      const batchList = batchResult.data ?? [];
      const fedToday = new Set((todayLogs.data ?? []).map((r) => r.batch_id).filter(Boolean));
      setBatches(batchList);
      setFormulations(formulationResult.data ?? []);
      setRecipes(recipeResult.data ?? []);
      const ids = batchList.map((b) => b.id);
      const preferred = resolvePreferredBatchId(ids);
      const pending = batchList.find((b) => !fedToday.has(b.id));
      // Preferred (just-created) always wins on load so multi-flock farms don't stick on old "complete" flocks
      const nextId = preferred || pending?.id || batchList[0]?.id || '';
      setSelectedBatch(nextId);
      hasLoadedRef.current = true;
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [user, todayStr]);

  const fetchSchedules = useCallback(async (batchId: string) => {
    const { data } = await supabase
      .from('feed_schedules')
      .select('*')
      .eq('batch_id', batchId)
      .order('day', { ascending: false })
      .limit(14);
    setSchedules(data ?? []);
  }, []);

  useEffect(() => {
    if (!selectedBatch || !farmId) return;
    let cancelled = false;
    const load = async () => {
      // Soft: keep previous schedules/logs until new batch data arrives
      const [schedRes, logRes] = await Promise.all([
        supabase
          .from('feed_schedules')
          .select('*')
          .eq('batch_id', selectedBatch)
          .order('day', { ascending: false })
          .limit(14),
        supabase
          .from('feed_logs')
          .select('*')
          .eq('batch_id', selectedBatch)
          .eq('date', todayStr)
          .limit(5),
      ]);
      if (cancelled) return;
      setSchedules(schedRes.data ?? []);
      setFeedLogs(logRes.data ?? []);
    };
    void load();
    return () => { cancelled = true; };
  }, [selectedBatch, farmId, todayStr]);

  const batch = useMemo(() => batches.find(b => b.id === selectedBatch), [batches, selectedBatch]);
  const dynamics = useMemo(
    () => (batch ? getBatchAge(batch.start_date, batch.species) : null),
    [batch]
  );
  const phase = useMemo(
    () => (batch && dynamics ? getCurrentPhase(batch.species, dynamics.week) : null),
    [batch, dynamics]
  );

  const isTodayCompleted = feedLogs.some(f => f.date === todayStr);

  const dailyTotalKg = useMemo(() => {
    if (!batch || !dynamics) return 0;
    let kgPerBird = getPrescriptiveFeedIntake(batch.species, dynamics.week);
    const foragingMod = getForagingModifier(batch.species, dynamics.week);
    if (isSemiIntensiveSystem(batch.production_system) && foragingMod > 0) {
      kgPerBird = kgPerBird * (1 - foragingMod);
    }
    return batch.current_population * kgPerBird;
  }, [batch, dynamics]);

  const feedTask = useMemo(() => {
    if (!batch || isTodayCompleted || dailyTotalKg <= 0) return null;
    return {
      id: `feed:${batch.id}:${todayStr}`,
      batch_id: batch.id,
      task_type: 'feeding' as const,
      amount: dailyTotalKg,
      unit: 'kg',
      batch_name: batch.name,
    };
  }, [batch, isTodayCompleted, dailyTotalKg, todayStr]);

  const confirmDayFeed = useCallback(async () => {
    if (!farmId || !selectedBatch || !batch || !feedTask) return;
    setFeedSaving(true);
    try {
      const { confirmDayFeedIntent } = await import('@/lib/feed-confirm');
      const qty = feedTask.amount;

      const outcome = await confirmDayFeedIntent({
        farmId,
        batchId: selectedBatch,
        qty,
        species: batch.species,
        productionSystem: batch.production_system as string,
        todayStr,
      });

      if (outcome.status === 'error' || outcome.status === 'blocked') return;
      if (outcome.status === 'already_logged') {
        setFeedLogs(prev => (prev.some(f => f.date === todayStr) ? prev : [{ id: 'temp', date: todayStr, quantity_kg: qty }, ...prev]));
        return;
      }

      setFeedLogs(prev => [{ id: 'temp', date: todayStr, quantity_kg: qty, batch_id: selectedBatch }, ...prev.filter(f => f.date !== todayStr)]);

      if (outcome.status === 'ok') {
        // T6: sync batch_tasks daily feed row (background-friendly, once-ensured)
        const { ensureDailyBatchTasksOnce, markBatchTaskComplete } = await import('@/lib/ensure-daily-tasks');
        await ensureDailyBatchTasksOnce({ farmId, batches: [batch], todayStr });
        await markBatchTaskComplete({ farmId, batchId: selectedBatch, taskType: 'feed_log', date: todayStr });
      }
    } finally {
      setFeedSaving(false);
    }
  }, [farmId, selectedBatch, batch, feedTask, todayStr]);

  return {
    farmId,
    batches,
    selectedBatch,
    setSelectedBatch,
    loading,
    formulations,
    schedules,
    setSchedules,
    recipes,
    batch,
    dynamics,
    phase,
    feedLogs,
    feedTask,
    dailyTotalKg,
    isTodayCompleted,
    feedSaving,
    confirmDayFeed,
    refreshSchedules: () => selectedBatch && fetchSchedules(selectedBatch),
  };
}
