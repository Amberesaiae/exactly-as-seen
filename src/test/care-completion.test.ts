import { describe, it, expect } from 'vitest';
import { isVaccinationHealthTask } from '@/lib/care-completion';

describe('care-completion', () => {
  it('detects vaccination health tasks', () => {
    expect(isVaccinationHealthTask({ task_type: 'vaccination', product_name: 'Gumboro (IBD)' })).toBe(true);
    expect(isVaccinationHealthTask({ task_type: 'medication', product_name: 'CORID' })).toBe(false);
    expect(isVaccinationHealthTask({ task_type: 'supplement', product_name: 'Vitamins' })).toBe(false);
  });
});
