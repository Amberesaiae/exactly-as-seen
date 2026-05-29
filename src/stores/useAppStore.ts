import { create } from 'zustand';

interface AppState {
  costPrivacyEnabled: boolean;
  setCostPrivacy: (enabled: boolean) => void;
  toggleCostPrivacy: () => void;
  isOnline: boolean;
  setOnline: (online: boolean) => void;
  isSyncing: boolean;
  setSyncing: (syncing: boolean) => void;
}

/**
 * Global application state.
 * Refactored for Phase 4: costPrivacyEnabled is now initialized to true
 * but can be overridden by user preferences on load.
 */
export const useAppStore = create<AppState>((set) => ({
  costPrivacyEnabled: true, 
  setCostPrivacy: (enabled) => set({ costPrivacyEnabled: enabled }),
  toggleCostPrivacy: () => set((s) => ({ costPrivacyEnabled: !s.costPrivacyEnabled })),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnline: (online) => set({ isOnline: online }),
  isSyncing: false,
  setSyncing: (syncing) => set({ isSyncing: syncing }),
}));
