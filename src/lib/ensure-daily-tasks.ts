/**
 * Client-side safety net: upsert today's operational batch_tasks when cron is unavailable.
 * Complements hosted generate-daily-tasks; does not replace it.
 *
 * T6: single completion path — virtual feed/water/egg CTAs mark matching batch_tasks done.
 */
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { isOffline, queueWrite } from '@/lib/sync';

export type DailyTaskType = 'feed_log' | 'water_log' | 'egg_collection';

export type BatchForDailyTasks = {
  id: string;
  name: string;
  species?: string;
  duck_type?: string | null;
  farm_id?: string;
};

function needsEggCollection(b: BatchForDailyTasks): boolean {
  if (b.species === 'layer') return true;
  if (b.species === 'duck' && b.duck_type === 'layer') return true;
  return false;
}

export type DailyTaskRow = {
  batch_id: string;
  farm_id: string;
  title: string;
  description: string;
  due_date: string;
  task_type: DailyTaskType;
  completed: boolean;
};

export function buildDailyTaskRows(args: {
  farmId: string;
  batches: BatchForDailyTasks[];
  todayStr: string;
}): DailyTaskRow[] {
  const { farmId, batches, todayStr } = args;
  return batches.flatMap((b) => {
    const rows: DailyTaskRow[] = [
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
    ];
    if (needsEggCollection(b)) {
      rows.push({
        batch_id: b.id,
        farm_id: farmId,
        title: 'Collect eggs',
        description: `Daily egg collection for ${b.name}`,
        due_date: todayStr,
        task_type: 'egg_collection',
        completed: false,
      });
    }
    return rows;
  });
}

export async function ensureDailyBatchTasks(args: {
  farmId: string;
  batches: BatchForDailyTasks[];
  todayStr: string;
}): Promise<void> {
  const { farmId, batches, todayStr } = args;
  if (!batches.length) return;

  const rows = buildDailyTaskRows({ farmId, batches, todayStr });

  if (isOffline()) {
    for (const row of rows) {
      const tempId = crypto.randomUUID();
      await queueWrite('batch_tasks', 'insert', tempId, row as unknown as Record<string, unknown>);
    }
    console.log('ensureDailyBatchTasks: queued', rows.length, 'tasks offline');
    return;
  }

  // Unique (batch_id, due_date, task_type) — ignore duplicates
  const { error } = await supabase.from('batch_tasks').upsert(rows, {
    onConflict: 'batch_id,due_date,task_type',
    ignoreDuplicates: true,
  });
  if (error) {
    console.warn('ensureDailyBatchTasks:', error.message);
  }
}

/** Map virtual operational task_type → batch_tasks.task_type */
export function virtualTaskTypeToBatchTaskType(
  virtualType: string
): DailyTaskType | null {
  if (virtualType === 'feeding' || virtualType === 'feed_log') return 'feed_log';
  if (virtualType === 'hydration' || virtualType === 'water_log') return 'water_log';
  if (virtualType === 'egg_collection' || virtualType === 'eggs') return 'egg_collection';
  return null;
}

/**
 * Mark today's batch_task complete after virtual CTA (feed/water/egg) succeeds.
 * Idempotent: only updates incomplete rows for that day/type.
 */
export async function markBatchTaskComplete(args: {
  farmId: string;
  batchId: string;
  taskType: DailyTaskType | string;
  date?: string;
}): Promise<void> {
  const mapped =
    virtualTaskTypeToBatchTaskType(args.taskType) ||
    (['feed_log', 'water_log', 'egg_collection'].includes(args.taskType)
      ? (args.taskType as DailyTaskType)
      : null);
  if (!mapped) return;

  const due = args.date ?? format(new Date(), 'yyyy-MM-dd');

  if (isOffline()) {
    await queueWrite('batch_tasks', 'update', `${args.batchId}:${due}:${mapped}`, {
      completed: true,
      completed_at: new Date().toISOString(),
      farm_id: args.farmId,
      batch_id: args.batchId,
      task_type: mapped,
      due_date: due,
    });
    console.log('markBatchTaskComplete: queued offline');
    return;
  }

  const { error } = await supabase
    .from('batch_tasks')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('farm_id', args.farmId)
    .eq('batch_id', args.batchId)
    .eq('task_type', mapped)
    .eq('due_date', due)
    .eq('completed', false);

  if (error) {
    console.warn('markBatchTaskComplete:', error.message);
  }
}

export type OpsCompletionFlags = {
  waterDone?: boolean;
  feedDone?: boolean;
  eggDone?: boolean;
  todayStr: string;
};

/**
 * Pure UI reconcile: reflect feed/water/egg logs on batch_tasks without waiting on network.
 * Prevents flicker (pending → done) after cron ensure or when logs already exist.
 */
export function reconcileBatchTasksWithOps<
  T extends { task_type: string; due_date: string; completed?: boolean | null }
>(tasks: T[], flags: OpsCompletionFlags): T[] {
  const { todayStr, waterDone, feedDone, eggDone } = flags;
  return tasks.map((t) => {
    if (t.due_date !== todayStr || t.completed) return t;
    if (t.task_type === 'water_log' && waterDone) {
      return { ...t, completed: true };
    }
    if (t.task_type === 'feed_log' && feedDone) {
      return { ...t, completed: true };
    }
    if (t.task_type === 'egg_collection' && eggDone) {
      return { ...t, completed: true };
    }
    return t;
  });
}

/** Stable display order for daily ops cards (feed → water → eggs → other). */
const TASK_TYPE_ORDER: Record<string, number> = {
  feed_log: 0,
  water_log: 1,
  egg_collection: 2,
};

export function sortBatchTasksForDisplay<
  T extends { task_type: string; due_date: string; id?: string; title?: string | null }
>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const da = a.due_date.localeCompare(b.due_date);
    if (da !== 0) return da;
    const oa = TASK_TYPE_ORDER[a.task_type] ?? 9;
    const ob = TASK_TYPE_ORDER[b.task_type] ?? 9;
    if (oa !== ob) return oa - ob;
    return (a.id || a.title || '').localeCompare(b.id || b.title || '');
  });
}

/** Session de-dupe so ensure is not re-run on every page navigation (reduces list thrash). */
const ensuredSessionKeys = new Set<string>();

export async function ensureDailyBatchTasksOnce(args: {
  farmId: string;
  batches: BatchForDailyTasks[];
  todayStr: string;
}): Promise<void> {
  const key = `${args.farmId}:${args.todayStr}:${args.batches.map((b) => b.id).sort().join(',')}`;
  if (ensuredSessionKeys.has(key)) return;
  await ensureDailyBatchTasks(args);
  ensuredSessionKeys.add(key);
}
