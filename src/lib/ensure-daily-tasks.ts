/**
 * Client-side safety net: upsert today's feed/water batch_tasks when cron is unavailable.
 * Does not replace hosted generate-daily-tasks edge job — complements it.
 */
import { supabase } from '@/integrations/supabase/client';

export async function ensureDailyBatchTasks(args: {
  farmId: string;
  batches: Array<{ id: string; name: string; farm_id?: string }>;
  todayStr: string;
}): Promise<void> {
  const { farmId, batches, todayStr } = args;
  if (!batches.length) return;

  const rows = batches.flatMap((b) => [
    {
      batch_id: b.id,
      farm_id: farmId,
      title: 'Log feed',
      description: `Daily feed log for ${b.name}`,
      due_date: todayStr,
      task_type: 'feed_log',
      completed: false,
    },
    {
      batch_id: b.id,
      farm_id: farmId,
      title: 'Log water',
      description: `Daily water log for ${b.name}`,
      due_date: todayStr,
      task_type: 'water_log',
      completed: false,
    },
  ]);

  // Unique (batch_id, due_date, task_type) — ignore duplicates
  const { error } = await supabase.from('batch_tasks').upsert(rows as any, {
    onConflict: 'batch_id,due_date,task_type',
    ignoreDuplicates: true,
  });
  if (error) {
    console.warn('ensureDailyBatchTasks:', error.message);
  }
}
