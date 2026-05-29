import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { autoCreateExpense } from '@/lib/synergy';

export function useWaterLogic(farmId: string | null, selectedBatch: string, waterRatePesewas?: number | null) {
  const [waterSaving, setWaterSaving] = useState(false);
  const [waterRecords, setWaterRecords] = useState<any[]>([]);

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
    
    // Auto-calculate cost and create synergy expense if rate exists
    if (waterRatePesewas && waterRatePesewas > 0) {
      const liters = gallons * 3.785;
      const costPesewas = Math.round(liters * waterRatePesewas);
      const amount = costPesewas / 100;

      await autoCreateExpense({
        farmId,
        batchId: selectedBatch,
        category: 'utilities',
        description: `Water consumption: ${gallons} gal (${liters.toFixed(1)}L)`,
        amount,
        source: 'auto:water',
        sourceRef: `water:${data.id}`
      });
    }

    setWaterRecords(prev => [data, ...prev.slice(0, 13)]);
    setWaterSaving(false);

    if (temp && temp > 32) {
      toast.warning('⚠️ High temperature detected! Consider adding electrolytes to water and increasing ventilation.', { duration: 6000 });
    }
    toast.success('Water consumption logged');
    return data;
  };

  return {
    waterSaving,
    waterRecords,
    setWaterRecords,
    logWater,
  };
}
