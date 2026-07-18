import { vi } from 'vitest';
console.log('SETUP MOCK RUNNING');
vi.mock('@/stores/useAppStore', () => {
  console.log('SETUP useAppStore MOCK FACTORY CALLED');
  return {
    useAppStore: () => ({ costPrivacyEnabled: true }),
  };
});
