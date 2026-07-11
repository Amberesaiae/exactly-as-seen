/**
 * Canonical runtime contracts for LampFarms.
 *
 * These values MUST match Postgres CHECK constraints and migrations.
 * UI, synergy, and RPC callers import from here — do not hardcode slugs.
 *
 * Source of truth:
 * - supabase/migrations/20260526000000_fifth_sprint_finance_canonical.sql
 * - supabase/migrations/20260525000000_fourth_sprint.sql (stock quality)
 * - supabase/migrations/20260711000000_contract_alignment.sql
 * - specs/00_CONVENTIONS.md (domain rules; stack notes may lag)
 */

// ─── Finance ────────────────────────────────────────────────────────────────

/** Canonical 9 expense categories (DB CHECK). */
export const EXPENSE_CATEGORIES = [
  { value: 'feed_and_nutrition', label: 'Feed & Nutrition' },
  { value: 'health_and_medicine', label: 'Health & Medicine' },
  { value: 'labor_and_workers', label: 'Labor & Workers' },
  { value: 'utilities_and_services', label: 'Utilities & Services' },
  { value: 'equipment_and_tools', label: 'Equipment & Tools' },
  { value: 'transport_and_delivery', label: 'Transport & Delivery' },
  { value: 'housing_and_facilities', label: 'Housing & Facilities' },
  { value: 'chicks_and_birds', label: 'Chicks & Birds' },
  { value: 'other_expenses', label: 'Other Expenses' },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value'];

/** Canonical 5 revenue categories (DB CHECK). */
export const REVENUE_CATEGORIES = [
  { value: 'egg_sales', label: 'Egg Sales' },
  { value: 'bird_sales', label: 'Bird Sales (Live)' },
  { value: 'meat_sales', label: 'Meat Sales (Dressed)' },
  { value: 'manure_sales', label: 'Manure Sales' },
  { value: 'other_revenue', label: 'Other Revenue' },
] as const;

export type RevenueCategory = (typeof REVENUE_CATEGORIES)[number]['value'];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit', label: 'Credit' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

export const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial Payment' },
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]['value'];

/** Synergy source prefixes (unique with source_ref). */
export const LEDGER_SOURCES = {
  feed: 'auto:feed',
  health: 'auto:health',
  water: 'auto:water',
  vaccination: 'auto:vaccination',
  eggs: 'auto:eggs',
  sale: 'auto:sale',
  batch: 'auto:batch',
  stock: 'auto:stock',
} as const;

// ─── Stock ──────────────────────────────────────────────────────────────────

/** stock_lots.quality_grade CHECK */
export const STOCK_QUALITY_GRADES = [
  { value: 'A', label: 'Grade A (Best)' },
  { value: 'B', label: 'Grade B' },
  { value: 'C', label: 'Grade C' },
  { value: 'damaged', label: 'Damaged (manual only)' },
] as const;

export type StockQualityGrade = (typeof STOCK_QUALITY_GRADES)[number]['value'];

export const DEFAULT_STOCK_QUALITY: StockQualityGrade = 'A';

/** Map stock_items.category → expense category for purchase synergy. */
export function expenseCategoryForStockItem(itemCategory: string): ExpenseCategory {
  const cat = itemCategory.toLowerCase();
  if (cat.includes('feed') || cat.includes('ingredient') || cat.includes('supplement')) {
    return 'feed_and_nutrition';
  }
  if (cat.includes('medication') || cat.includes('vaccine') || cat.includes('medicine') || cat.includes('health')) {
    return 'health_and_medicine';
  }
  if (cat.includes('equipment') || cat.includes('tool')) {
    return 'equipment_and_tools';
  }
  return 'other_expenses';
}

// ─── Money ──────────────────────────────────────────────────────────────────

/** Convert major units (GHS/NGN) → integer pesewas/kobo. */
export function toPesewas(major: number): number {
  return Math.round(Number(major) * 100);
}

/** Convert pesewas/kobo → major units. */
export function fromPesewas(pesewas: number | null | undefined): number {
  return Number(pesewas ?? 0) / 100;
}

/** ISO date YYYY-MM-DD for ledger date columns. */
export function ledgerDate(d: Date = new Date()): string {
  return d.toISOString().split('T')[0];
}

// ─── Production system ──────────────────────────────────────────────────────

export {
  isIntensiveSystem,
  isSemiIntensiveSystem,
  shouldAutoLedger,
  productionSystemLabel,
  type ProductionSystem,
} from '@/lib/production-system';

// ─── Farm selection ─────────────────────────────────────────────────────────

export interface FarmPickRow {
  id: string;
  setup_complete?: boolean | null;
  updated_at?: string | null;
}

/**
 * Canonical farm picker when a user has multiple farms.
 * Prefers setup_complete, then most recently updated.
 */
export function selectPrimaryFarm<T extends FarmPickRow>(farms: T[] | null | undefined): T | null {
  if (!farms || farms.length === 0) return null;
  return [...farms].sort((a, b) => {
    if (a.setup_complete !== b.setup_complete) return a.setup_complete ? -1 : 1;
    return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
  })[0];
}

// ─── Payment method normalization ───────────────────────────────────────────

const PAYMENT_ALIASES: Record<string, PaymentMethod> = {
  momo: 'mobile_money',
  mobile: 'mobile_money',
  'mobile-money': 'mobile_money',
  cash: 'cash',
  bank: 'bank_transfer',
  bank_transfer: 'bank_transfer',
  credit: 'credit',
};

export function normalizePaymentMethod(raw: string | null | undefined): PaymentMethod {
  if (!raw) return 'cash';
  const key = raw.toLowerCase().trim();
  return PAYMENT_ALIASES[key] ?? (PAYMENT_METHODS.some((m) => m.value === key) ? (key as PaymentMethod) : 'cash');
}
