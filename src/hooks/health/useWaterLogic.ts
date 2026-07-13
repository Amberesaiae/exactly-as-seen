import { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { autoCreateExpense } from '@/lib/synergy';
import { shouldExpenseConsumption, shouldOfferBookNow } from '@/lib/ledger-policy';
import { LEDGER_SOURCES } from '@/lib/canonical';

export function useWaterLogic(farmId: string | null, selectedBatch: string, waterRatePesewas?: number | null) {
  const [waterSaving, setWaterSaving] = useState(false);
  const [waterRecords, setWaterRecords] = useState<any[]>([]);

  const logWater = async (gallons: number, temp?: number | null, notes?: string) => {
    if (!farmId || !selectedBatch) return;
    setWaterSaving(true);

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const { queueWrite } = await import('@/lib/sync');
      const id = crypto.randomUUID();
      const offlineRow = {
        id,
        batch_id: selectedBatch,
        farm_id: farmId,
        date: todayStr,
        gallons_consumed: gallons,
        temperature_c: temp ?? null,
        notes: notes || null,
      };
      await queueWrite('water_records', 'insert', id, offlineRow);
      setWaterRecords(prev => [offlineRow, ...prev.slice(0, 13)]);
      toast.warning('Offline — water log queued; will sync when online');
      setWaterSaving(false);
      return offlineRow as any;
    }

    const { data: batch } = await supabase
      .from('batches')
      .select('production_system')
      .eq('id', selectedBatch)
      .maybeSingle();

    const liters = gallons * 3.785;
    const hasRate = !!(waterRatePesewas && waterRatePesewas > 0);
    const amount = hasRate ? Math.round(liters * (waterRatePesewas as number)) / 100 : 0;
    const system = batch?.production_system as any;
    const ledger = hasRate && shouldExpenseConsumption(system);

    const { data: rpcData, error: rpcError } = await supabase.rpc('log_day_water' as any, {
      p_farm_id: farmId,
      p_batch_id: selectedBatch,
      p_gallons: gallons,
      p_temperature_c: temp ?? null,
      p_notes: notes || null,
      p_date: todayStr,
      p_ledger: ledger,
      p_rate_per_liter_pesewas: hasRate ? waterRatePesewas : 0,
    });

    let data: any = null;
    if (rpcError) {
      console.warn('log_day_water RPC failed, client fallback:', rpcError.message);
      const { data: inserted, error } = await supabase.from('water_records').insert({
        batch_id: selectedBatch,
        farm_id: farmId,
        date: todayStr,
        gallons_consumed: gallons,
        temperature_c: temp,
        notes: notes || null,
      }).select().single();

      if (error) { toast.error(error.message); setWaterSaving(false); return; }
      data = inserted;

      if (ledger && amount > 0) {
        await autoCreateExpense({
          farmId,
          batchId: selectedBatch,
          category: 'utilities_and_services',
          description: `Water consumption: ${gallons} gal (${liters.toFixed(1)}L)`,
          amount,
          source: LEDGER_SOURCES.water,
          sourceRef: `water:${data.id}`,
        });
      }
    } else {
      // Must include date — WaterTab + daily tasks gate on w.date === today
      data = {
        id: (rpcData as any)?.water_record_id,
        batch_id: selectedBatch,
        farm_id: farmId,
        date: todayStr,
        gallons_consumed: gallons,
        temperature_c: temp ?? null,
        notes: notes || null,
      };
    }

    setWaterRecords(prev => {
      // Dedupe same day rows so UI does not flicker dual state
      const rest = prev.filter(w => w.date !== todayStr);
      return [data, ...rest.slice(0, 13)];
    });

    // T6: sync batch_tasks daily water row (background, once-ensured)
    try {
      const { ensureDailyBatchTasksOnce, markBatchTaskComplete } = await import('@/lib/ensure-daily-tasks');
      await ensureDailyBatchTasksOnce({
        farmId,
        batches: [{ id: selectedBatch, name: 'flock' }],
        todayStr,
      });
      await markBatchTaskComplete({
        farmId,
        batchId: selectedBatch,
        taskType: 'water_log',
        date: todayStr,
      });
    } catch (e) {
      console.warn('batch_tasks water sync:', e);
    }

    setWaterSaving(false);

    if (temp && temp > 32) {
      toast.warning('High temperature detected — consider electrolytes and ventilation.', { duration: 6000 });
    }

    if (hasRate && shouldOfferBookNow(system) && amount > 0) {
      toast.message('Water logged (flexible — not auto-ledgered)', {
        duration: 8000,
        action: {
          label: 'Book now',
          onClick: async () => {
            await autoCreateExpense({
              farmId,
              batchId: selectedBatch,
              category: 'utilities_and_services',
              description: `Water consumption (booked): ${gallons} gal (${liters.toFixed(1)}L)`,
              amount,
              source: LEDGER_SOURCES.water,
              sourceRef: `water:${data.id}:book`,
            });
            toast.success('Water expense booked');
          },
        },
      });
    } else {
      toast.success('Water consumption logged');
    }
    return data;
  };

  return {
    waterSaving,
    waterRecords,
    setWaterRecords,
    logWater,
  };
}
