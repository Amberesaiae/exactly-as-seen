import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { getFailedItems, retryAllFailedItems } from '@/lib/sync';
import { toast } from 'sonner';

/**
 * Lean UX Utility: SyncIndicator
 * Refactored to 'Pulse Only' mode for a cleaner header interface.
 * Shows connectivity status via a minimal pulsing dot without text.
 * Displays a retry button when sync items have failed.
 */
export function SyncIndicator() {
  const { isOnline, isSyncing, setOnline } = useAppStore();
  const [failedCount, setFailedCount] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setFailedCount(getFailedItems().length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async () => {
    toast.info('Retrying failed sync items...');
    await retryAllFailedItems();
    setFailedCount(getFailedItems().length);
  };

  if (failedCount > 0) {
    return (
      <button
        onClick={handleRetry}
        className="relative flex items-center mr-1 group"
        title={`${failedCount} sync item${failedCount > 1 ? 's' : ''} failed — click to retry`}
      >
        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
      </button>
    );
  }

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
