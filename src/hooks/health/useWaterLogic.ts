import { useState } from 'react';
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

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const { queueWrite } = await import('@/lib/sync');
      const id = crypto.randomUUID();
      await queueWrite('water_records', 'insert', id, {
        id,
        batch_id: selectedBatch,
        farm_id: farmId,
        gallons_consumed: gallons,
        temperature_c: temp ?? null,
        notes: notes || null,
      });
      toast.warning('Offline — water log queued; will sync when online');
      setWaterSaving(false);
      return { id, batch_id: selectedBatch, farm_id: farmId, gallons_consumed: gallons } as any;
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

    // Atomic RPC preferred
    const { data: rpcData, error: rpcError } = await supabase.rpc('log_day_water' as any, {
      p_farm_id: farmId,
      p_batch_id: selectedBatch,
      p_gallons: gallons,
      p_temperature_c: temp ?? null,
      p_notes: notes || null,
      p_date: new Date().toISOString().slice(0, 10),
      p_ledger: ledger,
      p_rate_per_liter_pesewas: hasRate ? waterRatePesewas : 0,
    });

    let data: any = null;
    if (rpcError) {
      console.warn('log_day_water RPC failed, client fallback:', rpcError.message);
      const { data: inserted, error } = await supabase.from('water_records').insert({
        batch_id: selectedBatch,
        farm_id: farmId,
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
      data = {
        id: (rpcData as any)?.water_record_id,
        batch_id: selectedBatch,
        farm_id: farmId,
        gallons_consumed: gallons,
        temperature_c: temp,
        notes: notes || null,
      };
    }

    setWaterRecords(prev => [data, ...prev.slice(0, 13)]);
    setWaterSaving(false);

    if (temp && temp > 32) {
      toast.warning('⚠️ High temperature detected! Consider adding electrolytes to water and increasing ventilation.', { duration: 6000 });
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
