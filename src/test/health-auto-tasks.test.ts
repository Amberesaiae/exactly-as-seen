import { describe, it, expect } from 'vitest';
import { generateAutoTasks } from '../lib/health-auto-tasks';

describe('health-auto-tasks', () => {
  it('should seed vaccination + duck niacin protocol tasks', () => {
    const tasks = generateAutoTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'duck',
      startDate: '2026-05-01',
      cycleLengthWeeks: 25,
    });

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => t.batch_id === 'batch-123' && t.farm_id === 'farm-456')).toBe(true);

    const niacinTasks = tasks.filter((t) => t.medication_id === 'niacin');
    expect(niacinTasks.length).toBeGreaterThan(0);
    expect(niacinTasks.every((t) => t.product_name.toLowerCase().includes('niacin'))).toBe(true);

    const vaxTasks = tasks.filter((t) => t.task_type === 'vaccination');
    expect(vaxTasks.length).toBeGreaterThan(0);
  });

  it('should generate turkey protocol tasks', () => {
    const tasks = generateAutoTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'turkey',
      startDate: '2026-05-01',
      cycleLengthWeeks: 12,
    });

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.some((t) => t.task_type === 'vaccination' || t.task_type === 'medication')).toBe(true);
  });

  it('should generate broiler vaccination protocol within cycle', () => {
    const tasks = generateAutoTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'broiler',
      startDate: '2026-05-01',
      cycleLengthWeeks: 8,
    });

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => t.scheduled_week <= 8)).toBe(true);
    expect(tasks.some((t) => t.task_type === 'vaccination')).toBe(true);
  });

  it('seeds broiler arrival course and D36 fenbendazole deworm', () => {
    const tasks = generateAutoTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'broiler',
      startDate: '2026-05-01',
      cycleLengthWeeks: 8,
    });
    expect(tasks.some((t) => t.product_name.includes('Anti-Stress'))).toBe(true);
    expect(tasks.some((t) => t.product_name.toLowerCase().includes('fenbendazole'))).toBe(true);
    expect(tasks.some((t) => t.product_name.includes('PLAIN WATER'))).toBe(true);
  });

  it('seeds turkey blackhead at week 2 via course (day 8)', () => {
    const tasks = generateAutoTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'turkey',
      startDate: '2026-05-01',
      cycleLengthWeeks: 16,
    });
    const early = tasks.filter((t) => t.product_name.includes('Blackhead'));
    expect(early.some((t) => t.scheduled_week === 2)).toBe(true);
    expect(early.some((t) => t.scheduled_week >= 4)).toBe(true);
  });
});

