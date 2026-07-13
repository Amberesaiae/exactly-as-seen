import { describe, it, expect } from 'vitest';
import {
  getProtocolCourses,
  getProtocolCoursesForCycle,
  courseScheduledWeek,
} from '@/lib/species-protocol-courses';

describe('species-protocol-courses (research parity)', () => {
  it('seeds full broiler week courses including D36 fenbendazole and plain water', () => {
    const courses = getProtocolCourses('broiler');
    expect(courses.some((c) => c.product_name.includes('Anti-Stress') && c.startDay === 1)).toBe(true);
    expect(courses.some((c) => c.product_name.includes('Coccidiostat') && c.startDay === 4)).toBe(true);
    expect(courses.filter((c) => c.product_name.includes('Coccidiostat')).length).toBeGreaterThanOrEqual(4);
    const deworm = courses.find((c) => c.product_name.toLowerCase().includes('fenbendazole'));
    expect(deworm?.startDay).toBe(36);
    expect(courses.some((c) => c.product_name.includes('PLAIN WATER'))).toBe(true);
  });

  it('seeds turkey blackhead at day 8 (week 2)', () => {
    const courses = getProtocolCourses('turkey');
    const bh = courses.find((c) => c.product_name.includes('Blackhead') && c.startDay === 8);
    expect(bh).toBeDefined();
    expect(courseScheduledWeek(8)).toBe(2);
  });

  it('seeds duck arrival, multivitamins, and week-8 plain water', () => {
    const courses = getProtocolCourses('duck');
    expect(courses.some((c) => c.startDay === 1 && c.task_type === 'supplement')).toBe(true);
    expect(courses.filter((c) => c.product_name === 'Multivitamins').length).toBeGreaterThanOrEqual(2);
    expect(courses.some((c) => c.product_name.includes('PLAIN WATER'))).toBe(true);
  });

  it('seeds layer calcium pre-lay and production monthly deworm stubs', () => {
    const courses = getProtocolCourses('layer');
    const ca = courses.find((c) => c.product_name.toLowerCase().includes('calcium'));
    expect(ca?.startDay).toBe(98);
    expect(courses.some((c) => c.product_name.includes('Monthly Deworming'))).toBe(true);
  });

  it('filters courses by cycle length', () => {
    const short = getProtocolCoursesForCycle('broiler', 4);
    expect(short.every((c) => c.startDay <= 28)).toBe(true);
    expect(short.some((c) => c.product_name.toLowerCase().includes('fenbendazole'))).toBe(false);
    const full = getProtocolCoursesForCycle('broiler', 8);
    expect(full.some((c) => c.product_name.toLowerCase().includes('fenbendazole'))).toBe(true);
  });

  it('returns empty for unknown species', () => {
    expect(getProtocolCourses('quail')).toEqual([]);
  });
});

