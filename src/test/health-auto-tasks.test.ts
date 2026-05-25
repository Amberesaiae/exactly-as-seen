import { describe, it, expect } from 'vitest';
import { generateInitialTasks } from '../lib/health-auto-tasks';

describe('health-auto-tasks', () => {
  it('should generate niacin and glucose tasks for duck species', () => {
    const tasks = generateInitialTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'duck',
      startDate: '2026-05-01',
      cycleLengthWeeks: 25,
    });

    // Duck should have 3 glucose tasks
    const glucoseTasks = tasks.filter(t => t.medication_id === 'glucose');
    expect(glucoseTasks).toHaveLength(3);
    expect(glucoseTasks.every(t => t.task_type === 'supplement' && t.product_name === 'Glucose/Sugar Water')).toBe(true);

    const niacinTasks = tasks.filter(t => t.medication_id === 'niacin');
    // Duck should have 28 daily niacin tasks
    const dailyNiacinTasks = niacinTasks.filter(t => t.scheduled_date >= '2026-05-01' && t.scheduled_date <= '2026-05-28');
    expect(dailyNiacinTasks).toHaveLength(28);
    expect(dailyNiacinTasks.every(t => t.task_type === 'supplement')).toBe(true);

    // And weekly niacin tasks from week 5 to 20
    const weeklyNiacinTasks = niacinTasks.filter(t => t.scheduled_date > '2026-05-28');
    expect(weeklyNiacinTasks).toHaveLength(16); // Week 5 to 20 = 16 tasks
    expect(weeklyNiacinTasks.every(t => t.medication_id === 'niacin')).toBe(true);
  });

  it('should generate metronidazole and glucose tasks for turkey species', () => {
    const tasks = generateInitialTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'turkey',
      startDate: '2026-05-01',
      cycleLengthWeeks: 12,
    });

    // Turkeys should have 3 glucose tasks
    const glucoseTasks = tasks.filter(t => t.medication_id === 'glucose');
    expect(glucoseTasks).toHaveLength(3);

    // Turkeys should have bi-weekly metronidazole tasks
    // Cycle length is 12 weeks, so tasks at weeks 1, 3, 5, 7, 9, 11
    const metroTasks = tasks.filter(t => t.medication_id === 'metronidazole');
    expect(metroTasks).toHaveLength(6);
    expect(metroTasks.every(t => t.task_type === 'medication')).toBe(true);
  });

  it('should generate day-1 arrival protocol glucose tasks for other species like broiler', () => {
    const tasks = generateInitialTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'broiler',
      startDate: '2026-05-01',
      cycleLengthWeeks: 8,
    });

    expect(tasks).toHaveLength(3);
    expect(tasks.every(t => t.medication_id === 'glucose' && t.task_type === 'supplement')).toBe(true);
  });
});
