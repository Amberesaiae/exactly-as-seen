import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mortalityRate } from '@/lib/batch-utils';

export interface BatchPerformance {
  batchId: string;
  totalMortality: number;
  mortalityPct: string;
  totalFeedKg: number;
  totalEggs: number;
  totalExpenses: number;
  totalRevenue: number;
  costPerBird: string;
}

export function useRecordsPerformance(batchIds: string[], farmId: string | null) {
  const [data, setData] = useState<Record<string, BatchPerformance>>({});
  const [loading, setLoading] = useState(false);
  const fetchCount = useRef(0);

  useEffect(() => {
    if (!farmId || batchIds.length === 0) {
      setData({});
      setLoading(false);
      return;
    }

    const loadPerf = async () => {
      const currentFetchId = ++fetchCount.current;
      setLoading(true);

      const { data: resData, error } = await (supabase as any).rpc('get_batch_record_summary', {
        p_farm_id: farmId,
        p_batch_ids: batchIds,
      });

      if (currentFetchId !== fetchCount.current) return;

      if (error) {
        console.error('Error fetching batch record summary:', error);
        setLoading(false);
        return;
      }

      const perf: Record<string, BatchPerformance> = {};
      (resData ?? []).forEach((row: any) => {
        const totalExpenses = Number(row.total_expenses_pesewas || 0) / 100;
        const totalRevenue = Number(row.total_revenue_pesewas || 0) / 100;
        perf[row.batch_id] = {
          batchId: row.batch_id,
          totalMortality: row.total_mortality || 0,
          mortalityPct: mortalityRate(row.initial_quantity, row.current_population),
          totalFeedKg: Number(row.total_feed_kg || 0),
          totalEggs: row.total_eggs || 0,
          totalExpenses,
          totalRevenue,
          costPerBird: row.current_population > 0 ? (totalExpenses / row.current_population).toFixed(2) : '0.00',
        };
      });

      setData(perf);
      setLoading(false);
    };

    loadPerf();
  }, [farmId, batchIds.join(',')]);

  return { data, loading };
}
