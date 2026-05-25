import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface PushPreferences {
  mortalityAlerts: boolean;
  overdueTaskAlerts: boolean;
  feedReminderAlerts: boolean;
  batchCloseAlerts: boolean;
}

const DEFAULT_PREFS: PushPreferences = {
  mortalityAlerts: true,
  overdueTaskAlerts: true,
  feedReminderAlerts: false,
  batchCloseAlerts: true,
};

function prefsKey(userId: string) {
  return `lampfarms_notify_prefs_${userId}`;
}

export function usePushNotifications(userId?: string) {
  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? (Notification.permission as NotificationPermission) : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prefs, setPrefs] = useState<PushPreferences>(() => {
    if (!userId) return DEFAULT_PREFS;
    try {
      const stored = localStorage.getItem(prefsKey(userId));
      return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  // Sync prefs from storage when userId changes
  useEffect(() => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(prefsKey(userId));
      if (stored) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
    } catch { /* ignore */ }
  }, [userId]);

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    }).catch(() => {});
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    return result as NotificationPermission;
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId) return false;
    setIsLoading(true);
    try {
      let perm = permission;
      if (perm === 'default') {
        perm = await requestPermission();
      }
      if (perm !== 'granted') {
        setIsLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;

      // Use a deterministic VAPID public key placeholder; replace with real VAPID key in production
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const subscriptionOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      };
      if (vapidPublicKey) {
        subscriptionOptions.applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      }

      const pushSub = await reg.pushManager.subscribe(subscriptionOptions);
      const subJson = pushSub.toJSON();

      // Persist to Supabase (best-effort; table may not exist in all envs)
      try {
        await supabase.from('push_subscriptions' as any).upsert({
          user_id: userId,
          endpoint: subJson.endpoint,
          p256dh: (subJson.keys as any)?.p256dh ?? null,
          auth: (subJson.keys as any)?.auth ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch { /* ignore if table missing */ }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('[Push] subscription error', err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, userId, permission, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        if (userId) {
          await supabase.from('push_subscriptions' as any).delete().eq('user_id', userId);
        }
      }
      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('[Push] unsubscribe error', err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, userId]);

  const savePrefs = useCallback((newPrefs: Partial<PushPreferences>) => {
    const merged = { ...prefs, ...newPrefs };
    setPrefs(merged);
    if (userId) {
      localStorage.setItem(prefsKey(userId), JSON.stringify(merged));
    }
  }, [prefs, userId]);

  /** Fire an immediate local notification (no push server needed) */
  const notify = useCallback((title: string, body: string, url?: string) => {
    if (!isSupported || permission !== 'granted') return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: '/placeholder.svg',
        badge: '/placeholder.svg',
        data: { url: url ?? '/' },
        tag: title,
      });
    }).catch(() => {});
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    prefs,
    requestPermission,
    subscribe,
    unsubscribe,
    savePrefs,
    notify,
  };
}

// Utility: convert VAPID public key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
