import { describe, it, expect } from 'vitest';
import { canCollectEggs, canSellEggs, canSellBirds, canTerminateNormal } from '@/lib/safety-gates';

describe('egg-gates-full (safety-gates.ts)', () => {
  describe('canCollectEggs', () => {
    it('returns false when species is null', () => {
      expect(canCollectEggs({ species: null, week: 20, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(false);
    });

    it('returns false when species is undefined', () => {
      expect(canCollectEggs({ species: undefined, week: 20, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(false);
    });

    it('layer at week 19 can collect', () => {
      expect(canCollectEggs({ species: 'layer', week: 19, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(true);
    });

    it('layer at week 18 cannot collect', () => {
      expect(canCollectEggs({ species: 'layer', week: 18, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(false);
    });

    it('layer at week 25 can collect', () => {
      expect(canCollectEggs({ species: 'layer', week: 25, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(true);
    });

    it('duck layer type at week 20 can collect', () => {
      expect(canCollectEggs({ species: 'duck', duckType: 'layer', week: 20, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(true);
    });

    it('duck layer type at week 19 cannot collect', () => {
      expect(canCollectEggs({ species: 'duck', duckType: 'layer', week: 19, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(false);
    });

    it('meat duck (no duckType) cannot collect', () => {
      expect(canCollectEggs({ species: 'duck', duckType: null, week: 30, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(false);
    });

    it('turkey defaults to layerStartWeek gate', () => {
      expect(canCollectEggs({ species: 'turkey', week: 19, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(true);
      expect(canCollectEggs({ species: 'turkey', week: 18, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(false);
    });

    it('broiler defaults to layerStartWeek gate', () => {
      expect(canCollectEggs({ species: 'broiler', week: 19, layerStartWeek: 19, duckLayerStartWeek: 20 })).toBe(true);
    });
  });

  describe('canSellEggs', () => {
    it('returns true when no active withdrawal', () => {
      expect(canSellEggs({ has_active_withdrawal: false })).toBe(true);
    });

    it('returns false when active withdrawal', () => {
      expect(canSellEggs({ has_active_withdrawal: true })).toBe(false);
    });

    it('returns true when withdrawal is null', () => {
      expect(canSellEggs({ has_active_withdrawal: null })).toBe(true);
    });

    it('returns true for undefined batch (no withdrawal)', () => {
      expect(canSellEggs(undefined)).toBe(true);
    });
  });

  describe('canSellBirds', () => {
    it('returns true when no active withdrawal', () => {
      expect(canSellBirds({ has_active_withdrawal: false })).toBe(true);
    });

    it('returns false when active withdrawal', () => {
      expect(canSellBirds({ has_active_withdrawal: true })).toBe(false);
    });

    it('returns true for null batch', () => {
      expect(canSellBirds(null)).toBe(true);
    });
  });

  describe('canTerminateNormal', () => {
    it('returns true for normal mode when no withdrawal', () => {
      expect(canTerminateNormal({ has_active_withdrawal: false }, 'normal')).toBe(true);
    });

    it('returns false for normal mode when withdrawal active', () => {
      expect(canTerminateNormal({ has_active_withdrawal: true }, 'normal')).toBe(false);
    });

    it('always returns true for emergency mode', () => {
      expect(canTerminateNormal({ has_active_withdrawal: true }, 'emergency')).toBe(true);
      expect(canTerminateNormal(null, 'emergency')).toBe(true);
    });

    it('defaults to normal mode', () => {
      expect(canTerminateNormal({ has_active_withdrawal: true })).toBe(false);
    });
  });
});
