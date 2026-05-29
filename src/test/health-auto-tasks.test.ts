import { describe, it, expect } from 'vitest';
import { generateInitialTasks } from '../lib/health-auto-tasks';

describe('health-auto-tasks', () => {
  it('should generate comprehensive protocols and glucose/niacin tasks for duck species', () => {
    const tasks = generateInitialTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'duck',
      startDate: '2026-05-01',
      cycleLengthWeeks: 25,
    });

    // Duck should have glucose/anti-stress tasks on Days 1-3 and Days 22-24
    const glucoseTasks = tasks.filter(t => t.medication_id === 'glucose');
    expect(glucoseTasks).toHaveLength(6);
    expect(glucoseTasks.every(t => t.task_type === 'supplement' && t.product_name === 'Glucose')).toBe(true);

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

  it('should generate comprehensive protocols for turkey species', () => {
    const tasks = generateInitialTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'turkey',
      startDate: '2026-05-01',
      cycleLengthWeeks: 12,
    });

    // Turkeys should have anti-stress / glucose tasks
    const glucoseTasks = tasks.filter(t => t.medication_id === 'glucose');
    expect(glucoseTasks).toHaveLength(6); // Days 1-3 and Days 22-24

    // Turkeys should have bi-weekly metronidazole tasks as part of the full weekly protocols
    const metroTasks = tasks.filter(t => t.medication_id === 'metronidazole');
    expect(metroTasks.length).toBeGreaterThan(0);
    expect(metroTasks.every(t => t.task_type === 'medication')).toBe(true);
  });

  it('should generate full 6-week protocol for broiler species', () => {
    const tasks = generateInitialTasks({
      batchId: 'batch-123',
      farmId: 'farm-456',
      species: 'broiler',
      startDate: '2026-05-01',
      cycleLengthWeeks: 8,
    });

    // Broiler should have tasks generated for coccidiostat, vitamins, and anti-stress
    const cocciTasks = tasks.filter(t => t.medication_id === 'amprolium');
    expect(cocciTasks.length).toBeGreaterThan(0);

    const vitTasks = tasks.filter(t => t.medication_id === 'multivitamins');
    expect(vitTasks.length).toBeGreaterThan(0);
  });
});
