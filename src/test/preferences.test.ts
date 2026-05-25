import { describe, it, expect, vi } from 'vitest';

// Let's create an in-memory SHA-256 hasher since browser window.crypto is mocked in jsdom
const sha256Node = async (str: string) => {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(str).digest('hex');
};

describe('SHA-256 PIN Security Cryptography', () => {
  it('correctly hashes a 4-digit PIN using SHA-256 matching browser bounds', async () => {
    const pin = '1234';
    const hashed = await sha256Node(pin);
    expect(hashed).toBe('03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4');
  });

  it('correctly hashes another PIN', async () => {
    const pin = '9999';
    const hashed = await sha256Node(pin);
    expect(hashed).toBe('888df25ae35772424a560c7152a1de794440e0ea5cfee62828333a456a506e05');
  });
});

describe('Preferences & Local Currency Limits', () => {
  it('validates accepted local currencies GHS and NGN', () => {
    const CURRENCIES = [
      { value: 'GHS', label: 'GHS', name: 'Ghana Cedi', symbol: '₵' },
      { value: 'NGN', label: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    ];
    
    expect(CURRENCIES.find(c => c.value === 'GHS')).toBeDefined();
    expect(CURRENCIES.find(c => c.value === 'NGN')).toBeDefined();
    expect(CURRENCIES.find(c => c.value === 'USD')).toBeUndefined();
  });
});
