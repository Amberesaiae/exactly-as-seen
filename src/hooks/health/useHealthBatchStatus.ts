import { useMemo } from 'react';
import { isBefore, isAfter, format } from 'date-fns';
import { getActiveAlerts, getPrescriptiveFeedIntake, getForagingModifier } from '@/lib/health-data';
import { getWaterPrescription } from '@/lib/dosing-utils';
import { isSemiIntensiveSystem } from '@/lib/production-system';
import { resolveAmbientTempC } from '@/lib/ghana-regions';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type HealthTask = Database['public']['Tables']['health_tasks']['Row'];
type WaterRecord = Database['public']['Tables']['water_records']['Row'];
type FeedLog = Database['public']['Tables']['feed_logs']['Row'];

/**
 * Health Status Orchestrator (Spec-Aligned)
 * Calculates projections and Virtual House Tasks based on 100% accurate spec logic.
 */
export function useHealthBatchStatus(
  batch: Batch | undefined, 
  batchAge: any, 
  healthTasks: HealthTask[], 
  waterRecords: WaterRecord[], 
  farmRegion: string | null,
  waterRatePesewas: number | null = null,
  feedLogs: FeedLog[] = []
) {
  // Stable day key — never put `new Date()` object in useMemo deps (causes thrash)
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const latestTemp = useMemo(() => {
    if (!waterRecords.length) return null;
    // Prefer today's log temp, else most recent
    const todayRec = waterRecords.find(w => w.date === todayStr);
    return (todayRec ?? waterRecords[0])?.temperature_c ?? null;
  }, [waterRecords, todayStr]);

  // 1. Water Cost Synergy
  const totalWaterCostPesewas = useMemo(() => {
    if (!waterRatePesewas || !waterRecords.length) return 0;
    return waterRecords.reduce((acc, w) => {
      const liters = Number(w.gallons_consumed) * 3.785;
      return acc + Math.round(liters * waterRatePesewas);
    }, 0);
  }, [waterRecords, waterRatePesewas]);

  // 2. Withdrawal Period Verification
  const activeWithdrawals = useMemo(() => {
    const now = new Date();
    return healthTasks.filter(t =>
      t.completed &&
      ((t.withdrawal_meat_until && isAfter(new Date(t.withdrawal_meat_until), now)) ||
       (t.withdrawal_eggs_until && isAfter(new Date(t.withdrawal_eggs_until), now)))
    );
  }, [healthTasks, todayStr]);

  const eggDiscardInfo = useMemo(() => {
    const now = new Date();
    const active = activeWithdrawals.filter(t => t.withdrawal_eggs_until && isAfter(new Date(t.withdrawal_eggs_until), now));
    if (!active.length) return null;
    const furthestDate = new Date(Math.max(...active.map(t => new Date(t.withdrawal_eggs_until!).getTime())));
    return { count: active.length, until: format(furthestDate, 'MMM d, yyyy') };
  }, [activeWithdrawals, todayStr]);

  // 3. Species-Specific Projections (Tool Effect)
  const todayTemp = useMemo(() => {
    // Prefer last water-log sensor; else regional climatology (not always 28°C)
    return resolveAmbientTempC(latestTemp != null ? Number(latestTemp) : null, farmRegion);
  }, [latestTemp, farmRegion]);

  const waterPrescription = useMemo(() => {
    if (!batch || !batchAge) return null;
    return getWaterPrescription({
      species: batch.species,
      duckType: batch.duck_type,
      week: batchAge.week,
      population: batch.current_population,
      temperatureC: todayTemp,
    });
  }, [batch, batchAge, todayTemp]);

  // 4. Operational Task Orchestrator (Spec-Aligned)
  const dailyOperationalTasks = useMemo(() => {
    if (!batch || !batchAge) return [];
    
    const tasks = [];
    
    // 🚿 Hydration House Task
    if (waterPrescription) {
      const alreadyDone = waterRecords.some(w => w.date === todayStr);
      if (!alreadyDone) {
        tasks.push({
          id: `water:${batch.id}:${todayStr}`,
          batch_id: batch.id,
          task_type: 'hydration',
          title: 'Daily Hydration Protocol',
          description: `Provide ${waterPrescription.gallons} gal of water`,
          amount: waterPrescription.gallons,
          unit: 'gal',
          estimated_cost: waterRatePesewas ? (waterPrescription.liters * waterRatePesewas) / 100 : 0,
          batch_name: batch.name
        });
      }
    }
    
    // 🍲 Feeding House Task — single prescription: getPrescriptiveFeedIntake (+ foraging)
    const feedLoggedToday = feedLogs.some(f => f.date === todayStr);
    if (!feedLoggedToday) {
       let kgPerBird = getPrescriptiveFeedIntake(batch.species, batchAge.week);
       const foragingMod = getForagingModifier(batch.species, batchAge.week);

       if (isSemiIntensiveSystem(batch.production_system) && foragingMod > 0) {
         kgPerBird = kgPerBird * (1 - foragingMod);
       }

       const totalKg = batch.current_population * kgPerBird;
       
       tasks.push({
         id: `feed:${batch.id}:${todayStr}`,
         batch_id: batch.id,
         task_type: 'feeding',
         title: 'Daily Feeding Protocol',
         description: `Provide ${totalKg.toFixed(1)} kg of ${batch.species} feed`,
         amount: totalKg,
         unit: 'kg',
         batch_name: batch.name
       });
    }
    
    return tasks;
  }, [batch, batchAge, waterPrescription, waterRecords, waterRatePesewas, feedLogs, todayStr]);

  // 5. Feed-to-Water Ratio Logic (Lean Guidance)
  const fwRatioInfo = useMemo(() => {
    if (!waterRecords.length || !feedLogs.length) return null;
    
    const todayWater = waterRecords.find(w => w.date === todayStr);
    const todayFeed = feedLogs.find(f => f.date === todayStr);
    
    if (!todayWater || !todayFeed) return null;
    
    const waterLiters = Number(todayWater.gallons_consumed) * 3.785;
    const feedKg = Number(todayFeed.quantity_kg);
    
    if (feedKg <= 0) return null;
    
    const ratio = Number((waterLiters / feedKg).toFixed(2));
    
    let caution = null;
    if (ratio < 1.5) {
      caution = {
        type: 'low_ratio',
        message: `Low Feed-to-Water ratio (${ratio}). Birds may be dehydrated or show early signs of disease.`
      };
    } else if (ratio > 3.0) {
      caution = {
        type: 'high_ratio',
        message: `High Feed-to-Water ratio (${ratio}). Check for leaks or extreme heat.`
      };
    }
    
    return { ratio, caution };
  }, [waterRecords, feedLogs, todayStr]);

  const waterChartData = useMemo(() => {
    if (!waterRecords.length) return [];
    return [...waterRecords].reverse().map(w => {
      const gallons = Number(w.gallons_consumed);
      const liters = gallons * 3.785;
      const cost = waterRatePesewas ? (Math.round(liters * waterRatePesewas) / 100) : null;
      let dateLabel = '—';
      try {
        if (w.date) dateLabel = format(new Date(`${w.date}T12:00:00`), 'MMM d');
      } catch { /* ignore */ }
      return {
        date: dateLabel,
        gallons,
        temp: w.temperature_c != null ? Number(w.temperature_c) : null,
        cost,
      };
    });
  }, [waterRecords, waterRatePesewas]);

  const healthAlerts = useMemo(() => {
    if (!batch || !batchAge) return [];
    return getActiveAlerts(batch.species, batchAge.phase, batchAge.week, latestTemp ? Number(latestTemp) : null);
  }, [batch, batchAge, latestTemp]);

  return {
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
  };
}
