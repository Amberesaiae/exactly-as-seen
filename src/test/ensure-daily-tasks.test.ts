import { describe, it, expect } from 'vitest';
import {
  buildDailyTaskRows,
  virtualTaskTypeToBatchTaskType,
  reconcileBatchTasksWithOps,
  sortBatchTasksForDisplay,
} from '@/lib/ensure-daily-tasks';
import { buildVaccinationSeedRows, countVaccinationTemplates } from '@/lib/vaccination-seed';

describe('ensure-daily-tasks (T6)', () => {
  it('builds feed + water for every batch', () => {
    const rows = buildDailyTaskRows({
      farmId: 'f1',
      todayStr: '2026-07-13',
      batches: [{ id: 'b1', name: 'Broilers', species: 'broiler' }],
    });
    expect(rows.map((r) => r.task_type).sort()).toEqual(['feed_log', 'water_log']);
    expect(rows.every((r) => r.due_date === '2026-07-13' && r.farm_id === 'f1')).toBe(true);
  });

  it('adds egg_collection for layers and layer ducks only', () => {
    const layer = buildDailyTaskRows({
      farmId: 'f1',
      todayStr: '2026-07-13',
      batches: [{ id: 'l1', name: 'Layers', species: 'layer' }],
    });
    expect(layer.some((r) => r.task_type === 'egg_collection')).toBe(true);

    const duckLayer = buildDailyTaskRows({
      farmId: 'f1',
      todayStr: '2026-07-13',
      batches: [{ id: 'd1', name: 'Ducks', species: 'duck', duck_type: 'layer' }],
    });
    expect(duckLayer.some((r) => r.task_type === 'egg_collection')).toBe(true);

    const duckMeat = buildDailyTaskRows({
      farmId: 'f1',
      todayStr: '2026-07-13',
      batches: [{ id: 'd2', name: 'Meat ducks', species: 'duck', duck_type: 'meat' }],
    });
    expect(duckMeat.some((r) => r.task_type === 'egg_collection')).toBe(false);
  });

  it('maps virtual task types to batch_tasks.task_type', () => {
    expect(virtualTaskTypeToBatchTaskType('feeding')).toBe('feed_log');
    expect(virtualTaskTypeToBatchTaskType('hydration')).toBe('water_log');
    expect(virtualTaskTypeToBatchTaskType('egg_collection')).toBe('egg_collection');
    expect(virtualTaskTypeToBatchTaskType('medication')).toBeNull();
  });

  it('reconciles completed flags from ops logs without network', () => {
    const tasks = [
      { id: '1', task_type: 'feed_log', due_date: '2026-07-13', completed: false },
      { id: '2', task_type: 'water_log', due_date: '2026-07-13', completed: false },
      { id: '3', task_type: 'water_log', due_date: '2026-07-12', completed: false },
    ];
    const next = reconcileBatchTasksWithOps(tasks, {
      todayStr: '2026-07-13',
      waterDone: true,
      feedDone: false,
    });
    expect(next[0].completed).toBe(false);
    expect(next[1].completed).toBe(true);
    expect(next[2].completed).toBe(false); // different day
  });

  it('sorts daily tasks feed → water → egg', () => {
    const sorted = sortBatchTasksForDisplay([
      { id: 'e', task_type: 'egg_collection', due_date: '2026-07-13', title: 'eggs' },
      { id: 'w', task_type: 'water_log', due_date: '2026-07-13', title: 'water' },
      { id: 'f', task_type: 'feed_log', due_date: '2026-07-13', title: 'feed' },
    ]);
    expect(sorted.map((t) => t.task_type)).toEqual(['feed_log', 'water_log', 'egg_collection']);
  });
});

describe('vaccination-seed (H4 single path)', () => {
  it('builds same schedule for broiler cycle', () => {
    const rows = buildVaccinationSeedRows({
      species: 'broiler',
      startDate: '2026-07-01',
      cycleLengthWeeks: 8,
    });
    expect(rows.length).toBe(countVaccinationTemplates('broiler', 8));
    expect(rows[0].vaccine_name).toBeTruthy();
    expect(rows[0].scheduled_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('respects cycle length filter', () => {
    const short = buildVaccinationSeedRows({
      species: 'layer',
      startDate: '2026-07-01',
      cycleLengthWeeks: 2,
    });
    const full = buildVaccinationSeedRows({
      species: 'layer',
      startDate: '2026-07-01',
      cycleLengthWeeks: 72,
    });
    expect(short.length).toBeLessThan(full.length);
    expect(short.every((r) => r.scheduled_week <= 2)).toBe(true);
  });
});
