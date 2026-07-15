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
 * Health Status Orchestrator
 * Computes prescriptions, projections, and alerts.
 * Operational tasks are sourced from batch_tasks DB rows — not computed here.
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
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const latestTemp = useMemo(() => {
    if (!waterRecords.length) return null;
    const todayRec = waterRecords.find(w => w.date === todayStr);
    return (todayRec ?? waterRecords[0])?.temperature_c ?? null;
  }, [waterRecords, todayStr]);

  // Water Cost Synergy
  const totalWaterCostPesewas = useMemo(() => {
    if (!waterRatePesewas || !waterRecords.length) return 0;
    return waterRecords.reduce((acc, w) => {
      const liters = Number(w.gallons_consumed) * 3.785;
      return acc + Math.round(liters * waterRatePesewas);
    }, 0);
  }, [waterRecords, waterRatePesewas]);

  // Withdrawal Period Verification
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
    const active = activeWithdrawals.filter(
      t => t.withdrawal_eggs_until && isAfter(new Date(t.withdrawal_eggs_until), now)
    );
    if (!active.length) return null;
    const furthestDate = new Date(
      Math.max(...active.map(t => new Date(t.withdrawal_eggs_until!).getTime()))
    );
    const products = active
      .map(t => t.product_name)
      .filter((n): n is string => !!n && n.trim().length > 0);
    const uniqueProducts = Array.from(new Set(products));
    const daysLeft = Math.max(
      0,
      Math.ceil((furthestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    const pop = batch?.current_population ?? 0;
    const estimatedEggs =
      batch?.species === 'layer' || (batch?.species === 'duck' && batch?.duck_type === 'layer')
        ? Math.round(pop * 0.8 * daysLeft)
        : 0;
    return {
      count: active.length,
      until: format(furthestDate, 'MMM d, yyyy'),
      products: uniqueProducts.length ? uniqueProducts : ['recent medication'],
      safeDate: furthestDate,
      daysLeft,
      estimatedEggs,
    };
  }, [activeWithdrawals, todayStr, batch]);

  // Species-Specific Projections
  const todayTemp = useMemo(() => {
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

  // Informational: feed amount based on batch age (not a task source)
  const feedAmountKg = useMemo(() => {
    if (!batch || !batchAge) return null;
    let kgPerBird = getPrescriptiveFeedIntake(batch.species, batchAge.week);
    const foragingMod = getForagingModifier(batch.species, batchAge.week);
    if (isSemiIntensiveSystem(batch.production_system) && foragingMod > 0) {
      kgPerBird = kgPerBird * (1 - foragingMod);
    }
    return batch.current_population * kgPerBird;
  }, [batch, batchAge]);

  // Feed-to-Water Ratio Logic
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
    feedAmountKg,
  };
}
