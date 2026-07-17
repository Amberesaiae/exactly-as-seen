/**
 * Stock matching helpers for dual-pattern feed/health consumption.
 */

/** Categories treated as feed for day-feed auto-deduct and formulation stock pickers. */
export function isFeedStockCategory(category: string | null | undefined): boolean {
  if (!category) return false;
  const c = category.toLowerCase().replace(/[_-]/g, ' ');
  return (
    c.includes('feed') ||
    c.includes('ingredient') ||
    c.includes('concentrate') ||
    c.includes('ration') ||
    c.includes('mash') ||
    c.includes('pellet')
  );
}

/** Prefer ready-made / named feed bags over pure raw ingredients when both exist. */
export function pickPreferredFeedStock<
  T extends {
    name: string;
    category: string;
    current_quantity?: number;
    unit_price_pesewas?: number | null;
    updated_at?: string | null;
  }
>(items: T[]): T | null {
  const feedish = items.filter((i) => isFeedStockCategory(i.category));
  if (feedish.length === 0) return null;
  const withQty = feedish.filter((i) => (i.current_quantity ?? 0) > 0);
  const pool = withQty.length > 0 ? withQty : feedish;
  // Prefer complete feed names, then priced lots, then highest qty, then most recently updated
  const ranked = [...pool].sort((a, b) => {
    const aName = /starter|grower|finisher|layer|feed/i.test(a.name) ? 1 : 0;
    const bName = /starter|grower|finisher|layer|feed/i.test(b.name) ? 1 : 0;
    if (bName !== aName) return bName - aName;
    const aPrice = Number(a.unit_price_pesewas || 0) > 0 ? 1 : 0;
    const bPrice = Number(b.unit_price_pesewas || 0) > 0 ? 1 : 0;
    if (bPrice !== aPrice) return bPrice - aPrice;
    const qtyDiff = Number(b.current_quantity || 0) - Number(a.current_quantity || 0);
    if (qtyDiff !== 0) return qtyDiff;
    return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
  });
  return ranked[0] ?? null;
}
