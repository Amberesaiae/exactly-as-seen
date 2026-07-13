import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { syncScheduleForCompletedVaccinationTasks } from '@/lib/care-completion';

export type WeeklySummary = {
  health_tasks_total: number;
  health_tasks_completed: number;
  health_tasks_pending: number;
  batch_tasks_total: number;
  batch_tasks_completed: number;
  total_health_cost_pesewas: number | null;
  next_week_tasks: Array<{ product_name: string; task_type: string; scheduled_date: string; is_vaccination: boolean }>;
};

export function useWeeklyHealthSummary(farmId: string | null) {
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  // Stable identity — unstable deps here caused Health.tsx max update depth
  const fetchWeeklySummary = useCallback(async (batchId: string, weekNumber: number) => {
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
  }, [farmId]);

  const bulkCompleteWeekTasks = useCallback(async (batchId: string, weekNumber: number) => {
    if (!farmId) return;
    try {
      const { error } = await supabase.rpc('bulk_complete_health_tasks', {
        p_batch_id: batchId,
        p_week_number: weekNumber,
        p_farm_id: farmId,
        p_completed_at: new Date().toISOString()
      });
      if (error) throw error;

      // Dual writer: bulk only touches health_tasks — sync vaccination_schedule
      await syncScheduleForCompletedVaccinationTasks(batchId);

      toast.success('Successfully completed all pending weekly health tasks');
      await fetchWeeklySummary(batchId, weekNumber);
      return true;
    } catch (err: any) {
      console.error('Error in bulk complete:', err);
      toast.error('Failed to complete weekly tasks: ' + err.message);
      return false;
    }
  }, [farmId, fetchWeeklySummary]);

  return {
    weeklySummary,
    weeklyLoading,
    fetchWeeklySummary,
    bulkCompleteWeekTasks,
  };
}
