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
export function pickPreferredFeedStock<T extends { name: string; category: string; current_quantity?: number }>(
  items: T[]
): T | null {
  const feedish = items.filter((i) => isFeedStockCategory(i.category));
  if (feedish.length === 0) return null;
  const withQty = feedish.filter((i) => (i.current_quantity ?? 0) > 0);
  const pool = withQty.length > 0 ? withQty : feedish;
  // Prefer names that look like complete feed over single ingredients
  const complete = pool.find((i) => /starter|grower|finisher|layer|feed/i.test(i.name));
  return complete ?? pool[0];
}
