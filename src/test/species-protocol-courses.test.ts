import { describe, it, expect } from 'vitest';
import {
  getProtocolCourses,
  courseScheduledWeek,
} from '@/lib/species-protocol-courses';

describe('species-protocol-courses (research parity)', () => {
  it('seeds broiler arrival, cocci, and D36 fenbendazole deworm', () => {
    const courses = getProtocolCourses('broiler');
    expect(courses.some((c) => c.product_name.includes('Anti-Stress') && c.startDay === 1)).toBe(true);
    expect(courses.some((c) => c.product_name.includes('Coccidiostat') && c.startDay === 4)).toBe(true);
    const deworm = courses.find((c) => c.product_name.toLowerCase().includes('fenbendazole'));
    expect(deworm?.startDay).toBe(36);
    expect(courses.some((c) => c.product_name.includes('PLAIN WATER'))).toBe(true);
  });

  it('seeds turkey blackhead at day 8 (week 2) before later biweekly loop', () => {
    const courses = getProtocolCourses('turkey');
    const bh = courses.find((c) => c.product_name.includes('Blackhead') && c.startDay === 8);
    expect(bh).toBeDefined();
    expect(courseScheduledWeek(8)).toBe(2);
  });

  it('seeds duck arrival and multivitamin blocks', () => {
    const courses = getProtocolCourses('duck');
    expect(courses.some((c) => c.startDay === 1 && c.task_type === 'supplement')).toBe(true);
    expect(courses.filter((c) => c.product_name === 'Multivitamins').length).toBeGreaterThanOrEqual(2);
  });

  it('seeds layer calcium pre-lay around day 98', () => {
    const courses = getProtocolCourses('layer');
    const ca = courses.find((c) => c.product_name.toLowerCase().includes('calcium'));
    expect(ca?.startDay).toBe(98);
  });

  it('returns empty for unknown species', () => {
    expect(getProtocolCourses('quail')).toEqual([]);
  });
});
