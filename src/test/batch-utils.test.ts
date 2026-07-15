import { describe, it, expect, vi } from 'vitest';
import { getBatchAge, mortalityRate } from '@/lib/batch-utils';

describe('batch-utils.ts', () => {
  describe('getBatchAge', () => {
    it('calculates age from creation date (same day = day 1, week 1)', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = getBatchAge(today, 'broiler');
      expect(result.day).toBe(1);
      expect(result.week).toBe(1);
    });

    it('calculates age after 7 days (day 8, week 2)', () => {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const result = getBatchAge(start.toISOString().split('T')[0], 'broiler');
      expect(result.day).toBe(8);
      expect(result.week).toBe(2);
    });

    it('calculates age after 21 days (day 22, week 4)', () => {
      const start = new Date();
      start.setDate(start.getDate() - 21);
      const result = getBatchAge(start.toISOString().split('T')[0], 'layer');
      expect(result.day).toBe(22);
      expect(result.week).toBe(4);
    });

    it('assigns starter phase for broiler weeks 1-3', () => {
      const start = new Date();
      start.setDate(start.getDate() - 14); // week 3
      const result = getBatchAge(start.toISOString().split('T')[0], 'broiler');
      expect(result.phase).toBe('starter');
    });

    it('assigns grower phase for broiler weeks 4-5', () => {
      const start = new Date();
      start.setDate(start.getDate() - 28); // week 5
      const result = getBatchAge(start.toISOString().split('T')[0], 'broiler');
      expect(result.phase).toBe('grower');
    });

    it('assigns finisher phase for broiler week 6+', () => {
      const start = new Date();
      start.setDate(start.getDate() - 42); // week 7
      const result = getBatchAge(start.toISOString().split('T')[0], 'broiler');
      expect(result.phase).toBe('finisher');
    });

    it('assigns chick phase for layer weeks 1-8', () => {
      const start = new Date();
      start.setDate(start.getDate() - 21); // week 4
      const result = getBatchAge(start.toISOString().split('T')[0], 'layer');
      expect(result.phase).toBe('chick');
    });

    it('assigns grower phase for layer weeks 9-18', () => {
      const start = new Date();
      start.setDate(start.getDate() - 84); // week 13
      const result = getBatchAge(start.toISOString().split('T')[0], 'layer');
      expect(result.phase).toBe('grower');
    });

    it('assigns layer phase for layer week 19+', () => {
      const start = new Date();
      start.setDate(start.getDate() - 140); // week 21
      const result = getBatchAge(start.toISOString().split('T')[0], 'layer');
      expect(result.phase).toBe('layer');
    });

    it('assigns starter phase for duck weeks 1-3', () => {
      const start = new Date();
      start.setDate(start.getDate() - 14); // week 3
      const result = getBatchAge(start.toISOString().split('T')[0], 'duck');
      expect(result.phase).toBe('starter');
    });

    it('assigns grower phase for duck weeks 4-7', () => {
      const start = new Date();
      start.setDate(start.getDate() - 35); // week 6
      const result = getBatchAge(start.toISOString().split('T')[0], 'duck');
      expect(result.phase).toBe('grower');
    });

    it('assigns finisher phase for duck week 8+', () => {
      const start = new Date();
      start.setDate(start.getDate() - 56); // week 9
      const result = getBatchAge(start.toISOString().split('T')[0], 'duck');
      expect(result.phase).toBe('finisher');
    });

    it('assigns starter phase for turkey weeks 1-4', () => {
      const start = new Date();
      start.setDate(start.getDate() - 21); // week 4
      const result = getBatchAge(start.toISOString().split('T')[0], 'turkey');
      expect(result.phase).toBe('starter');
    });

    it('assigns grower phase for turkey weeks 5-12', () => {
      const start = new Date();
      start.setDate(start.getDate() - 56); // week 9
      const result = getBatchAge(start.toISOString().split('T')[0], 'turkey');
      expect(result.phase).toBe('grower');
    });

    it('assigns finisher phase for turkey week 13+', () => {
      const start = new Date();
      start.setDate(start.getDate() - 98); // week 15
      const result = getBatchAge(start.toISOString().split('T')[0], 'turkey');
      expect(result.phase).toBe('finisher');
    });

    it('defaults to broiler phases for unknown species', () => {
      const start = new Date();
      start.setDate(start.getDate() - 14);
      const result = getBatchAge(start.toISOString().split('T')[0], 'unknown_species');
      expect(result.phase).toBe('starter');
    });
  });

  describe('mortalityRate', () => {
    it('returns 0.0 when initial is 0', () => {
      expect(mortalityRate(0, 0)).toBe('0.0');
    });

    it('returns 0.0 when initial is negative', () => {
      expect(mortalityRate(-5, 0)).toBe('0.0');
    });

    it('returns 0.0 when no mortality', () => {
      expect(mortalityRate(100, 100)).toBe('0.0');
    });

    it('calculates 10% mortality', () => {
      expect(mortalityRate(100, 90)).toBe('10.0');
    });

    it('calculates 100% mortality', () => {
      expect(mortalityRate(100, 0)).toBe('100.0');
    });

    it('calculates 50% mortality from 10 birds', () => {
      expect(mortalityRate(10, 5)).toBe('50.0');
    });

    it('formats to one decimal place', () => {
      expect(mortalityRate(3, 1)).toBe('66.7');
    });
  });
});
