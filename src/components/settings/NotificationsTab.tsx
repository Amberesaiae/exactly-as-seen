import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BellRing, AlertTriangle, ClipboardCheck, UtensilsCrossed, LayoutList } from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationsTab() {
  const { user } = useAuth();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    prefs,
    subscribe,
    unsubscribe,
    savePrefs,
    notify,
  } = usePushNotifications(user?.id);

  const [testLoading, setTestLoading] = useState(false);

  const handleToggleSubscription = async () => {
    if (isSubscribed) {
      const ok = await unsubscribe();
      if (ok) toast.success('Push notifications disabled');
      else toast.error('Could not disable push notifications');
    } else {
      const ok = await subscribe();
      if (ok) toast.success('Push notifications enabled!');
      else if (permission === 'denied') {
        toast.error('Browser has blocked notifications — reset permission in site settings.');
      } else {
        toast.error('Could not enable push notifications');
      }
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    notify(
      '🐔 LampFarms Test Alert',
      'Push notifications are working correctly for your farm.',
      '/dashboard'
    );
    await new Promise(r => setTimeout(r, 800));
    setTestLoading(false);
    toast.success('Test notification fired!');
  };

  if (!isSupported) {
    return (
      <div className="space-y-4 mt-4">
        <Card className="bg-amber-950/20 border-amber-500/20">
          <CardContent className="p-5 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-300">Notifications Not Supported</p>
              <p className="text-xs text-muted-foreground">
                Your browser does not support the Push Notification API. Try Chrome, Edge, or Firefox on Android/Desktop.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Master toggle */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <BellRing className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-base">Push Notifications</CardTitle>
                <CardDescription className="text-xs">
                  Receive real-time farm alerts on this device
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={permission === 'granted' ? 'default' : permission === 'denied' ? 'destructive' : 'secondary'}
                className="text-xxs"
              >
                {permission === 'granted' ? 'Allowed' : permission === 'denied' ? 'Blocked' : 'Not set'}
              </Badge>
              <Switch
                id="push-master"
                checked={isSubscribed}
                onCheckedChange={handleToggleSubscription}
                disabled={isLoading || permission === 'denied'}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alert type preferences */}
      <Card>
        <CardHeader className="py-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Alert Preferences
          </CardTitle>
          <CardDescription className="text-xs">Choose which events trigger alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          {[
            {
              key: 'mortalityAlerts' as const,
              icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
              label: 'Mortality Spike Alerts',
              desc: 'Alert when daily mortality exceeds 2% of flock size',
            },
            {
              key: 'overdueTaskAlerts' as const,
              icon: <ClipboardCheck className="h-4 w-4 text-amber-400" />,
              label: 'Overdue Health Tasks',
              desc: 'Alert when a health task is past its due date',
            },
            {
              key: 'feedReminderAlerts' as const,
              icon: <UtensilsCrossed className="h-4 w-4 text-blue-400" />,
              label: 'Feed Schedule Reminders',
              desc: 'Remind when a scheduled feed event is due',
            },
            {
              key: 'batchCloseAlerts' as const,
              icon: <LayoutList className="h-4 w-4 text-green-400" />,
              label: 'Batch Close Reminders',
              desc: 'Alert when a flock is projected to be ready for close-out',
            },
          ].map(({ key, icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {icon}
                <div>
                  <Label className="text-xs font-medium cursor-pointer">{label}</Label>
                  <p className="text-xxs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <Switch
                id={`notif-pref-${key}`}
                checked={prefs[key]}
                onCheckedChange={(val) => savePrefs({ [key]: val })}
                disabled={!isSubscribed}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Test notification */}
      {isSubscribed && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Test Notification</p>
              <p className="text-xs text-muted-foreground">Send a sample alert to verify push is working</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full gap-1.5 shrink-0"
              onClick={handleTestNotification}
              disabled={testLoading}
            >
              <Bell className="h-3.5 w-3.5" />
              {testLoading ? 'Sending…' : 'Send Test'}
            </Button>
          </CardContent>
        </Card>
      )}

      {permission === 'denied' && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 flex gap-3 items-start">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Notifications are blocked by your browser. Open your browser's site settings
              and reset the notification permission to re-enable alerts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
