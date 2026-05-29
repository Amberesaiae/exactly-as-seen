import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Lean UX Utility: SyncIndicator
 * Refactored to 'Pulse Only' mode for a cleaner header interface.
 * Shows connectivity status via a minimal pulsing dot without text.
 */
export function SyncIndicator() {
  const { isOnline, isSyncing, setOnline } = useAppStore();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  if (isSyncing) {
    return (
      <div className="relative flex h-2 w-2 mr-1" title="Syncing data...">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="relative flex h-2 w-2 mr-1" title="Offline mode">
        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </div>
    );
  }

  return (
    <div className="relative flex h-2 w-2 mr-1" title="Connected & Online">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    </div>
  );
}
