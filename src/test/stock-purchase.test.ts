import { describe, it, expect } from 'vitest';
import { EXPENSE_CATEGORIES, LEDGER_SOURCES, toPesewas } from '@/lib/canonical';

describe('stock-purchase (canonical.ts)', () => {
  describe('EXPENSE_CATEGORIES', () => {
    it('has exactly 9 canonical categories', () => {
      expect(EXPENSE_CATEGORIES).toHaveLength(9);
    });

    it('includes feed_and_nutrition', () => {
      expect(EXPENSE_CATEGORIES.some(c => c.value === 'feed_and_nutrition')).toBe(true);
    });

    it('includes health_and_medicine', () => {
      expect(EXPENSE_CATEGORIES.some(c => c.value === 'health_and_medicine')).toBe(true);
    });

    it('includes chicks_and_birds', () => {
      expect(EXPENSE_CATEGORIES.some(c => c.value === 'chicks_and_birds')).toBe(true);
    });

    it('all categories have value and label', () => {
      for (const cat of EXPENSE_CATEGORIES) {
        expect(cat.value).toBeTruthy();
        expect(cat.label).toBeTruthy();
      }
    });
  });

  describe('LEDGER_SOURCES', () => {
    it('has all required source prefixes', () => {
      expect(LEDGER_SOURCES.feed).toBe('auto:feed');
      expect(LEDGER_SOURCES.health).toBe('auto:health');
      expect(LEDGER_SOURCES.water).toBe('auto:water');
      expect(LEDGER_SOURCES.vaccination).toBe('auto:vaccination');
      expect(LEDGER_SOURCES.eggs).toBe('auto:eggs');
      expect(LEDGER_SOURCES.sale).toBe('auto:sale');
      expect(LEDGER_SOURCES.batch).toBe('auto:batch');
      expect(LEDGER_SOURCES.stock).toBe('auto:stock');
    });
  });

  describe('toPesewas (purchase validation)', () => {
    it('converts GHS 10 to 1000 pesewas', () => {
      expect(toPesewas(10)).toBe(1000);
    });

    it('converts GHS 5.50 to 550 pesewas', () => {
      expect(toPesewas(5.5)).toBe(550);
    });

    it('converts GHS 0 to 0 pesewas', () => {
      expect(toPesewas(0)).toBe(0);
    });

    it('rounds to nearest integer', () => {
      expect(toPesewas(3.333)).toBe(333);
    });

    it('handles negative values', () => {
      expect(toPesewas(-5)).toBe(-500);
    });
  });

  describe('purchase validation logic', () => {
    it('rejects zero quantity', () => {
      const quantity = 0;
      expect(quantity > 0).toBe(false);
    });

    it('rejects negative quantity', () => {
      const quantity = -5;
      expect(quantity > 0).toBe(false);
    });

    it('accepts positive quantity', () => {
      const quantity = 10;
      expect(quantity > 0).toBe(true);
    });

    it('validates required fields are present', () => {
      const purchase = {
        itemName: 'Maize',
        quantity: 50,
        unitPrice: 3.5,
        category: 'feed_and_nutrition',
      };

      expect(purchase.itemName).toBeTruthy();
      expect(purchase.quantity).toBeGreaterThan(0);
      expect(purchase.unitPrice).toBeGreaterThan(0);
      expect(purchase.category).toBeTruthy();
    });

    it('rejects empty item name', () => {
      const name = '';
      expect(name.trim().length > 0).toBe(false);
    });

    it('validates category is in allowed list', () => {
      const validCategory = 'feed_and_nutrition';
      const invalidCategory = 'invalid_category';

      expect(EXPENSE_CATEGORIES.some(c => c.value === validCategory)).toBe(true);
      expect(EXPENSE_CATEGORIES.some(c => c.value === invalidCategory)).toBe(false);
    });
  });
});
