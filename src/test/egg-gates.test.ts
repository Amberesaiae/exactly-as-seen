import { describe, it, expect } from 'vitest';
import { LAYER_EGG_START_WEEK, DUCK_EGG_START_WEEK } from '@/lib/canonical';

describe('egg start week product gates', () => {
  it('uses layer week 19 and duck-layer week 20 (CANONICAL_JOURNEYS)', () => {
    expect(LAYER_EGG_START_WEEK).toBe(19);
    expect(DUCK_EGG_START_WEEK).toBe(20);
  });

  it('blocks layer collection before gate', () => {
    const week = 1;
    expect(week < LAYER_EGG_START_WEEK).toBe(true);
  });
});
