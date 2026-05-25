import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Settings, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const CURRENCIES = [
  { value: 'GHS', label: 'GHS', name: 'Ghana Cedi', symbol: '₵' },
  { value: 'NGN', label: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
];

interface PreferencesTabProps {
  user: SupabaseUser | null;
  currency: string;
  setCurrency: (val: string) => void;
  theme: string;
  setTheme: (val: string) => void;
  costPrivacyEnabled: boolean;
  togglePrivacy: (val: boolean) => Promise<void>;
  toggleTheme: (val: string) => Promise<void>;
  savePreferences: () => Promise<void>;
  saving: string | null;
  savedSection: string | null;
  hasPin: boolean;
  setHasPin: (val: boolean) => void;
}

export default function PreferencesTab({
  user,
  currency,
  setCurrency,
  theme,
  setTheme,
  costPrivacyEnabled,
  togglePrivacy,
  toggleTheme,
  savePreferences,
  saving,
  savedSection,
  hasPin,
  setHasPin,
}: PreferencesTabProps) {
  // Local PIN states
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [showClearPinDialog, setShowClearPinDialog] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);

  const sha256 = async (str: string) => {
    const utf8 = new TextEncoder().encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSavePin = async () => {
    if (!user) return;
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    setPinSaving(true);
    try {
      const hashedPin = await sha256(pin);
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        cost_privacy_pin: hashedPin,
        cost_privacy_enabled: costPrivacyEnabled,
        currency,
        theme,
      }, { onConflict: 'user_id' });

      if (error) {
        toast.error(error.message);
      } else {
        setHasPin(true);
        setPin('');
        setConfirmPin('');
        toast.success('Privacy PIN set successfully!');
      }
    } catch (e) {
      toast.error('Failed to hash PIN');
    } finally {
      setPinSaving(false);
    }
  };

  const handleClearPin = async () => {
    if (!user) return;
    setPinSaving(true);
    try {
      const hashedOld = await sha256(oldPin);
      
      const { data: currentPrefs } = await supabase
        .from('user_preferences')
        .select('cost_privacy_pin')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (currentPrefs?.cost_privacy_pin !== hashedOld) {
        toast.error('Incorrect current PIN');
        setPinSaving(false);
        return;
      }
      
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        cost_privacy_pin: null,
        cost_privacy_enabled: costPrivacyEnabled,
        currency,
        theme,
      }, { onConflict: 'user_id' });

      if (error) {
        toast.error(error.message);
      } else {
        setHasPin(false);
        setOldPin('');
        setShowClearPinDialog(false);
        toast.success('Privacy PIN cleared successfully');
      }
    } catch (e) {
      toast.error('Failed to clear PIN');
    } finally {
      setPinSaving(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Cost Privacy switch */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Cost Privacy Security
          </CardTitle>
          <CardDescription>Mask cost-related metrics on public dashboard dashboards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Cost Privacy Protection</Label>
              <p className="text-xs text-muted-foreground">Hide financial information in weekly summaries</p>
            </div>
            <Switch checked={costPrivacyEnabled} onCheckedChange={togglePrivacy} />
          </div>

          {/* Security PIN setup */}
          <div className="border rounded-xl p-4 space-y-4 bg-primary/5 border-primary/10">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-primary" /> {hasPin ? 'PIN Enabled' : 'Configure Security PIN'}
            </h3>
            {hasPin ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Financial actions are secured by a 4-digit PIN.</p>
                <Button size="sm" variant="outline" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => setShowClearPinDialog(true)}>
                  Clear PIN
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Setup a security PIN to unlock financial dashboards instantly.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="pref-pin">Enter PIN</Label>
                    <Input
                      id="pref-pin"
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="4 digits"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pref-confirm-pin">Confirm PIN</Label>
                    <Input
                      id="pref-confirm-pin"
                      type="password"
                      maxLength={4}
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Repeat PIN"
                    />
                  </div>
                </div>
                <Button size="sm" onClick={handleSavePin} disabled={pinSaving} className="rounded-full">
                  {pinSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Set PIN
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theme and Currency selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Display & Localization
          </CardTitle>
          <CardDescription>Set theme, localization variables, and currencies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label} ({c.symbol})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>UI Theme</Label>
              <Select value={theme} onValueChange={toggleTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            size="sm"
            onClick={savePreferences}
            disabled={saving === 'prefs'}
            className="rounded-full gap-1"
          >
            {saving === 'prefs' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedSection === 'prefs' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
            {savedSection === 'prefs' ? 'Saved!' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>

      {/* Clear PIN Dialog */}
      <Dialog open={showClearPinDialog} onOpenChange={setShowClearPinDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Clear Security PIN</DialogTitle>
            <DialogDescription>Please enter your current 4-digit PIN to disable security shielding.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="pref-old-pin">Current PIN</Label>
            <Input
              id="pref-old-pin"
              type="password"
              maxLength={4}
              value={oldPin}
              onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))}
              placeholder="4 digits"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowClearPinDialog(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleClearPin} disabled={pinSaving} className="rounded-full">
              {pinSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Clear PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
