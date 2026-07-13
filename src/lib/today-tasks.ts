/**
 * Unified Today checklist — pure merge of virtual ops + due care.
 * Fixes dashboard glitch: no blanket task_type: 'medication' relabel.
 */

export type ChecklistItem = {
  id: string;
  batch_id: string;
  batch_name?: string;
  task_type: string;
  title?: string;
  product_name?: string;
  description?: string;
  scheduled_date?: string;
  completed?: boolean;
  amount?: number;
  unit?: string;
  estimated_cost?: number;
  [key: string]: unknown;
};

/**
 * Keep incomplete care only when scheduled_date <= today (local yyyy-MM-dd).
 * Preserve original task_type (vaccination, medication, supplement, …).
 */
export function filterDueHealthTasks<T extends {
  id: string;
  completed?: boolean | null;
  scheduled_date?: string | null;
  task_type?: string | null;
  product_name?: string | null;
  batch_id?: string | null;
  batches?: { name?: string } | null;
}>(
  healthTasks: T[],
  todayStr: string,
): ChecklistItem[] {
  return healthTasks
    .filter((t) => !t.completed && t.scheduled_date && t.scheduled_date <= todayStr)
    .map((t) => ({
      id: t.id,
      batch_id: t.batch_id ?? '',
      batch_name: t.batches?.name,
      task_type: t.task_type || 'care',
      product_name: t.product_name ?? undefined,
      title: t.product_name ?? 'Care task',
      scheduled_date: t.scheduled_date ?? undefined,
      completed: false,
    }));
}

export function buildTodayChecklist(args: {
  virtualOps: ChecklistItem[];
  healthTasks: Parameters<typeof filterDueHealthTasks>[0];
  todayStr: string;
  maxItems?: number;
}): ChecklistItem[] {
  const dueCare = filterDueHealthTasks(args.healthTasks, args.todayStr);
  const combined = [...args.virtualOps, ...dueCare];
  if (args.maxItems != null && args.maxItems > 0) {
    return combined.slice(0, args.maxItems);
  }
  return combined;
}
