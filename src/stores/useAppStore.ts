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

export const useAppStore = create<AppState>((set) => ({
  costPrivacyEnabled: true,
  setCostPrivacy: (enabled) => set({ costPrivacyEnabled: enabled }),
  toggleCostPrivacy: () => set((s) => ({ costPrivacyEnabled: !s.costPrivacyEnabled })),
  isOnline: navigator.onLine,
  setOnline: (online) => set({ isOnline: online }),
  isSyncing: false,
  setSyncing: (syncing) => set({ isSyncing: syncing }),
}));
