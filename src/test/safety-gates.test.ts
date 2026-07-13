import { describe, it, expect } from 'vitest';
import {
  canSellBirds,
  canSellEggs,
  canTerminateNormal,
  canCollectEggs,
} from '@/lib/safety-gates';
import { LAYER_EGG_START_WEEK, DUCK_EGG_START_WEEK } from '@/lib/canonical';

describe('safety-gates (withdrawal + egg weeks)', () => {
  it('blocks bird and egg sales during withdrawal', () => {
    expect(canSellBirds({ has_active_withdrawal: true })).toBe(false);
    expect(canSellEggs({ has_active_withdrawal: true })).toBe(false);
    expect(canSellBirds({ has_active_withdrawal: false })).toBe(true);
    expect(canSellEggs(null)).toBe(true);
  });

  it('blocks normal terminate during withdrawal but allows emergency', () => {
    expect(canTerminateNormal({ has_active_withdrawal: true }, 'normal')).toBe(false);
    expect(canTerminateNormal({ has_active_withdrawal: true }, 'emergency')).toBe(true);
    expect(canTerminateNormal({ has_active_withdrawal: false }, 'normal')).toBe(true);
  });

  it('enforces egg collection week gates', () => {
    expect(
      canCollectEggs({
        species: 'layer',
        week: 1,
        layerStartWeek: LAYER_EGG_START_WEEK,
        duckLayerStartWeek: DUCK_EGG_START_WEEK,
      })
    ).toBe(false);
    expect(
      canCollectEggs({
        species: 'layer',
        week: 19,
        layerStartWeek: LAYER_EGG_START_WEEK,
        duckLayerStartWeek: DUCK_EGG_START_WEEK,
      })
    ).toBe(true);
    expect(
      canCollectEggs({
        species: 'duck',
        duckType: 'layer',
        week: 19,
        layerStartWeek: LAYER_EGG_START_WEEK,
        duckLayerStartWeek: DUCK_EGG_START_WEEK,
      })
    ).toBe(false);
    expect(
      canCollectEggs({
        species: 'duck',
        duckType: 'meat',
        week: 30,
        layerStartWeek: LAYER_EGG_START_WEEK,
        duckLayerStartWeek: DUCK_EGG_START_WEEK,
      })
    ).toBe(false);
  });
});
