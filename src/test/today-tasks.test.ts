import { describe, it, expect } from 'vitest';
import { buildTodayChecklist, filterDueHealthTasks } from '@/lib/today-tasks';

describe('today-tasks', () => {
  const today = '2026-07-13';

  it('keeps only incomplete health tasks scheduled on or before today', () => {
    const due = filterDueHealthTasks(
      [
        { id: '1', completed: false, scheduled_date: '2026-07-10', task_type: 'vaccination', product_name: 'Gumboro', batch_id: 'b1' },
        { id: '2', completed: false, scheduled_date: '2026-07-20', task_type: 'vaccination', product_name: 'Lasota', batch_id: 'b1' },
        { id: '3', completed: true, scheduled_date: '2026-07-01', task_type: 'medication', product_name: 'CORID', batch_id: 'b1' },
      ],
      today,
    );
    expect(due).toHaveLength(1);
    expect(due[0].task_type).toBe('vaccination');
    expect(due[0].product_name).toBe('Gumboro');
  });

  it('formatTaskTypeLabel keeps vaccines distinct from medication', async () => {
    const { formatTaskTypeLabel } = await import('@/lib/today-tasks');
    expect(formatTaskTypeLabel({ task_type: 'vaccination', product_name: 'HB1' })).toBe('Vaccine');
    expect(formatTaskTypeLabel({ task_type: 'medication', product_name: 'Gumboro (IBD)' })).toBe('Vaccine');
    expect(formatTaskTypeLabel({ task_type: 'medication', product_name: 'Amprolium' })).toBe('Medication');
    expect(formatTaskTypeLabel({ task_type: 'feeding' })).toBe('Feeding');
  });

  it('does not relabel vaccinations as medication', () => {
    const list = buildTodayChecklist({
      todayStr: today,
      batchTasks: [
        { id: 'w1', batch_id: 'b1', task_type: 'water_log', title: 'Log water', due_date: '2026-07-13', completed: false },
      ],
      healthTasks: [
        { id: 'v1', completed: false, scheduled_date: '2026-07-13', task_type: 'vaccination', product_name: 'HB1', batch_id: 'b1', batches: { name: 'Flock A' } },
      ],
    });
    expect(list.some((i) => i.task_type === 'water_log')).toBe(true);
    expect(list.find((i) => i.id === 'v1')?.task_type).toBe('vaccination');
  });

  it('respects maxItems', () => {
    const list = buildTodayChecklist({
      todayStr: today,
      maxItems: 1,
      batchTasks: [
        { id: 'f1', batch_id: 'b', task_type: 'feed_log', title: 'Log feed', due_date: '2026-07-13', completed: false },
        { id: 'w1', batch_id: 'b', task_type: 'water_log', title: 'Log water', due_date: '2026-07-13', completed: false },
      ],
      healthTasks: [],
    });
    expect(list).toHaveLength(1);
  });
});
