import { describe, it, expect } from 'vitest';
import { isFeedStockCategory, pickPreferredFeedStock } from '@/lib/stock-match';

describe('stock-match', () => {
  it('recognizes feed_ingredient and related categories', () => {
    expect(isFeedStockCategory('feed_ingredient')).toBe(true);
    expect(isFeedStockCategory('feed')).toBe(true);
    expect(isFeedStockCategory('FEED_INGREDIENT')).toBe(true);
    expect(isFeedStockCategory('concentrate')).toBe(true);
    expect(isFeedStockCategory('medication')).toBe(false);
    expect(isFeedStockCategory('equipment')).toBe(false);
  });

  it('prefers complete feed names with quantity over empty raw lots', () => {
    const pick = pickPreferredFeedStock([
      { name: 'Maize', category: 'feed_ingredient', current_quantity: 0 },
      { name: 'Broiler Starter Feed', category: 'feed_ingredient', current_quantity: 50 },
      { name: 'Vaccine X', category: 'vaccine', current_quantity: 10 },
    ]);
    expect(pick?.name).toBe('Broiler Starter Feed');
  });

  it('returns null when no feed categories', () => {
    expect(pickPreferredFeedStock([
      { name: 'Syringe', category: 'equipment', current_quantity: 5 },
    ])).toBeNull();
  });

  it('prefers priced starter lots over unpriced when both have qty', () => {
    const pick = pickPreferredFeedStock([
      { name: 'Broiler Starter A', category: 'feed_ingredient', current_quantity: 100, unit_price_pesewas: 0 },
      { name: 'Broiler Starter B', category: 'feed_ingredient', current_quantity: 50, unit_price_pesewas: 500 },
    ]);
    expect(pick?.name).toBe('Broiler Starter B');
  });
});
