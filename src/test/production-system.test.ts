import { describe, it, expect } from 'vitest';
import {
  isIntensiveSystem,
  isSemiIntensiveSystem,
  shouldAutoLedger,
  productionSystemLabel,
} from '@/lib/production-system';

describe('production-system dual pattern (research)', () => {
  it('treats deep_litter and cage as intensive for auto ledger', () => {
    expect(isIntensiveSystem('intensive')).toBe(true);
    expect(isIntensiveSystem('deep_litter')).toBe(true);
    expect(isIntensiveSystem('cage')).toBe(true);
    expect(shouldAutoLedger('deep_litter')).toBe(true);
    expect(shouldAutoLedger('cage')).toBe(true);
  });

  it('treats semi_intensive / free_range / pasture as flexible (no auto ledger)', () => {
    expect(isIntensiveSystem('semi_intensive')).toBe(false);
    expect(isIntensiveSystem('free_range')).toBe(false);
    expect(isIntensiveSystem('pasture')).toBe(false);
    expect(shouldAutoLedger('semi_intensive')).toBe(false);
    expect(shouldAutoLedger('free_range')).toBe(false);
    expect(isSemiIntensiveSystem('semi_intensive')).toBe(true);
    expect(isSemiIntensiveSystem('pasture')).toBe(true);
  });

  it('defaults unset production system to intensive (safe commercial default)', () => {
    expect(isIntensiveSystem(null)).toBe(true);
    expect(isIntensiveSystem(undefined)).toBe(true);
    expect(shouldAutoLedger(null)).toBe(true);
  });

  it('labels systems for UI', () => {
    expect(productionSystemLabel('deep_litter')).toMatch(/Deep Litter/i);
    expect(productionSystemLabel('semi_intensive')).toMatch(/Semi/i);
  });
});
