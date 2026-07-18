import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GHS: 'GH₵',
  NGN: '₦',
  CFA: 'CFA',
  USD: '$',
  KES: 'KSh',
  UGX: 'USh',
  ZAR: 'R',
  GBP: '£',
  EUR: '€',
};

/**
 * Lean Utility: getCurrencySymbol
 * Returns the appropriate symbol for a currency code.
 */
export function getCurrencySymbol(code: string = 'GHS'): string {
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code;
}

/**
 * Lean Utility: formatCurrency
 * Standardized currency formatting for Lampfarms.
 */
export function formatCurrency(amount: number, currency: string = 'GHS'): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
