import { describe, it, expect } from 'vitest';
import { getExpectedRate, getActiveAlerts, getPrescriptiveFeedIntake, getForagingModifier } from '@/lib/health-data';

describe('health-data.ts', () => {
  describe('getExpectedRate', () => {
    it('returns null for unknown species', () => {
      expect(getExpectedRate('chicken', 20)).toBeNull();
    });

    it('layer rearing phase returns 0% rate', () => {
      const result = getExpectedRate('layer', 10);
      expect(result).toEqual({ min: 0, max: 0 });
    });

    it('layer pre-lay phase returns 0-5%', () => {
      const result = getExpectedRate('layer', 17);
      expect(result).toEqual({ min: 0, max: 5 });
    });

    it('layer early phase returns 60-80%', () => {
      const result = getExpectedRate('layer', 22);
      expect(result).toEqual({ min: 60, max: 80 });
    });

    it('layer peak phase returns 85-95%', () => {
      const result = getExpectedRate('layer', 30);
      expect(result).toEqual({ min: 85, max: 95 });
    });

    it('layer late phase returns 70-85%', () => {
      const result = getExpectedRate('layer', 55);
      expect(result).toEqual({ min: 70, max: 85 });
    });

    it('layer end phase returns 50-70%', () => {
      const result = getExpectedRate('layer', 70);
      expect(result).toEqual({ min: 50, max: 70 });
    });

    it('duck rearing phase returns 0%', () => {
      const result = getExpectedRate('duck', 10);
      expect(result).toEqual({ min: 0, max: 0 });
    });

    it('duck early phase returns 50-70%', () => {
      const result = getExpectedRate('duck', 24);
      expect(result).toEqual({ min: 50, max: 70 });
    });

    it('duck peak phase returns 80-90%', () => {
      const result = getExpectedRate('duck', 35);
      expect(result).toEqual({ min: 80, max: 90 });
    });

    it('turkey rearing phase returns 0%', () => {
      const result = getExpectedRate('turkey', 15);
      expect(result).toEqual({ min: 0, max: 0 });
    });

    it('turkey early phase returns 40-60%', () => {
      const result = getExpectedRate('turkey', 30);
      expect(result).toEqual({ min: 40, max: 60 });
    });

    it('turkey peak phase returns 60-75%', () => {
      const result = getExpectedRate('turkey', 40);
      expect(result).toEqual({ min: 60, max: 75 });
    });
  });

  describe('getActiveAlerts', () => {
    it('returns no alerts for broiler at week 1', () => {
      const alerts = getActiveAlerts('broiler', 'starter', 1);
      expect(alerts).toHaveLength(0);
    });

    it('returns heat stress alert when temperature exceeds 32', () => {
      const alerts = getActiveAlerts('broiler', 'starter', 1, 35);
      expect(alerts.some(a => a.id === 'heat-stress-general')).toBe(true);
    });

    it('does not return heat stress alert below 32°C', () => {
      const alerts = getActiveAlerts('broiler', 'starter', 1, 28);
      expect(alerts.some(a => a.id === 'heat-stress-general')).toBe(false);
    });

    it('returns duck niacin alert for all weeks', () => {
      const alerts = getActiveAlerts('duck', 'starter', 1);
      expect(alerts.some(a => a.id === 'duck-niacin')).toBe(true);
    });

    it('returns turkey blackhead alert for all weeks', () => {
      const alerts = getActiveAlerts('turkey', 'starter', 1);
      expect(alerts.some(a => a.id === 'turkey-blackhead')).toBe(true);
    });

    it('returns turkey starve-out alert in starter phase, week <= 2', () => {
      const alerts = getActiveAlerts('turkey', 'starter', 2);
      expect(alerts.some(a => a.id === 'turkey-starve-out')).toBe(true);
    });

    it('does not return turkey starve-out alert after week 2', () => {
      const alerts = getActiveAlerts('turkey', 'starter', 3);
      expect(alerts.some(a => a.id === 'turkey-starve-out')).toBe(false);
    });

    it('returns broiler ascites in finisher phase week 4+', () => {
      const alerts = getActiveAlerts('broiler', 'finisher', 4);
      expect(alerts.some(a => a.id === 'broiler-ascites')).toBe(true);
    });

    it('does not return broiler ascites in starter phase', () => {
      const alerts = getActiveAlerts('broiler', 'starter', 2);
      expect(alerts.some(a => a.id === 'broiler-ascites')).toBe(false);
    });

    it('returns coccidiosis risk for broiler in starter phase week 2-6', () => {
      const alerts = getActiveAlerts('broiler', 'starter', 4);
      expect(alerts.some(a => a.id === 'coccidiosis-risk')).toBe(true);
    });

    it('does not return coccidiosis risk after week 6', () => {
      const alerts = getActiveAlerts('broiler', 'grower', 7);
      expect(alerts.some(a => a.id === 'coccidiosis-risk')).toBe(false);
    });

    it('returns layer calcium alert in layer phase week 16+', () => {
      const alerts = getActiveAlerts('layer', 'layer', 20);
      expect(alerts.some(a => a.id === 'layer-calcium')).toBe(true);
    });

    it('returns layer pre-lay alert in grower phase week 14-18', () => {
      const alerts = getActiveAlerts('layer', 'grower', 16);
      expect(alerts.some(a => a.id === 'layer-prelay')).toBe(true);
    });

    it('filters alerts by phase correctly', () => {
      const alerts = getActiveAlerts('broiler', 'grower', 4);
      // broiler-ascites requires finisher phase
      expect(alerts.some(a => a.id === 'broiler-ascites')).toBe(false);
    });
  });

  describe('getPrescriptiveFeedIntake', () => {
    it('broiler week 1-3 returns 0.05 kg', () => {
      expect(getPrescriptiveFeedIntake('broiler', 1)).toBe(0.05);
      expect(getPrescriptiveFeedIntake('broiler', 3)).toBe(0.05);
    });

    it('broiler week 4-5 returns 0.09 kg', () => {
      expect(getPrescriptiveFeedIntake('broiler', 4)).toBe(0.09);
      expect(getPrescriptiveFeedIntake('broiler', 5)).toBe(0.09);
    });

    it('broiler week 6+ returns 0.15 kg', () => {
      expect(getPrescriptiveFeedIntake('broiler', 6)).toBe(0.15);
      expect(getPrescriptiveFeedIntake('broiler', 10)).toBe(0.15);
    });

    it('layer week 1-6 returns 0.06 kg', () => {
      expect(getPrescriptiveFeedIntake('layer', 1)).toBe(0.06);
      expect(getPrescriptiveFeedIntake('layer', 6)).toBe(0.06);
    });

    it('layer week 7-16 returns 0.09 kg', () => {
      expect(getPrescriptiveFeedIntake('layer', 7)).toBe(0.09);
      expect(getPrescriptiveFeedIntake('layer', 16)).toBe(0.09);
    });

    it('layer week 17-60 returns 0.12 kg', () => {
      expect(getPrescriptiveFeedIntake('layer', 17)).toBe(0.12);
      expect(getPrescriptiveFeedIntake('layer', 60)).toBe(0.12);
    });

    it('layer week 61+ returns 0.10 kg', () => {
      expect(getPrescriptiveFeedIntake('layer', 61)).toBe(0.10);
    });

    it('duck week 1-3 returns 0.06 kg', () => {
      expect(getPrescriptiveFeedIntake('duck', 1)).toBe(0.06);
      expect(getPrescriptiveFeedIntake('duck', 3)).toBe(0.06);
    });

    it('duck week 4-7 returns 0.11 kg', () => {
      expect(getPrescriptiveFeedIntake('duck', 4)).toBe(0.11);
      expect(getPrescriptiveFeedIntake('duck', 7)).toBe(0.11);
    });

    it('duck week 8+ returns 0.16 kg', () => {
      expect(getPrescriptiveFeedIntake('duck', 8)).toBe(0.16);
    });

    it('turkey week 1-4 returns 0.04 kg', () => {
      expect(getPrescriptiveFeedIntake('turkey', 1)).toBe(0.04);
      expect(getPrescriptiveFeedIntake('turkey', 4)).toBe(0.04);
    });

    it('turkey week 5-10 returns 0.08 kg', () => {
      expect(getPrescriptiveFeedIntake('turkey', 5)).toBe(0.08);
      expect(getPrescriptiveFeedIntake('turkey', 10)).toBe(0.08);
    });

    it('turkey week 11+ returns 0.14 kg', () => {
      expect(getPrescriptiveFeedIntake('turkey', 11)).toBe(0.14);
    });

    it('unknown species returns 0.05 default', () => {
      expect(getPrescriptiveFeedIntake('goose', 5)).toBe(0.05);
    });
  });

  describe('getForagingModifier', () => {
    it('duck week < 6 returns 0', () => {
      expect(getForagingModifier('duck', 5)).toBe(0);
    });

    it('duck week 6-7 returns 0.15', () => {
      expect(getForagingModifier('duck', 6)).toBe(0.15);
      expect(getForagingModifier('duck', 7)).toBe(0.15);
    });

    it('duck week 8+ returns 0.25', () => {
      expect(getForagingModifier('duck', 8)).toBe(0.25);
      expect(getForagingModifier('duck', 20)).toBe(0.25);
    });

    it('turkey week < 8 returns 0', () => {
      expect(getForagingModifier('turkey', 7)).toBe(0);
    });

    it('turkey week 8-12 returns 0.12', () => {
      expect(getForagingModifier('turkey', 8)).toBe(0.12);
      expect(getForagingModifier('turkey', 12)).toBe(0.12);
    });

    it('turkey week 13+ returns 0.22', () => {
      expect(getForagingModifier('turkey', 13)).toBe(0.22);
      expect(getForagingModifier('turkey', 25)).toBe(0.22);
    });

    it('broiler always returns 0', () => {
      expect(getForagingModifier('broiler', 5)).toBe(0);
      expect(getForagingModifier('broiler', 20)).toBe(0);
    });

    it('layer always returns 0', () => {
      expect(getForagingModifier('layer', 20)).toBe(0);
    });
  });
});
