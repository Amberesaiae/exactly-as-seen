import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { User, Home, Settings, LogOut, Trash2, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GHANA_REGIONS, DISTRICTS_BY_REGION } from '@/lib/ghana-regions';
import { isPasswordStrong } from '@/lib/password-validation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import type { Database } from '@/integrations/supabase/types';

type Farm = Database['public']['Tables']['farms']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { costPrivacyEnabled, setCostPrivacy } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [currency, setCurrency] = useState('GHS');
  const [theme, setTheme] = useState('light');
  const [farmId, setFarmId] = useState('');

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Delete account
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [profileResult, farmResult, prefResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('farms').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      setFullName(profileResult.data?.full_name ?? '');
      if (farmResult.data) {
        setFarmName(farmResult.data.name);
        setRegion(farmResult.data.location_region ?? '');
        setDistrict(farmResult.data.location_district ?? '');
        setFarmId(farmResult.data.id);
      }
      if (prefResult.data) {
        setCurrency(prefResult.data.currency);
        setTheme(prefResult.data.theme);
        setCostPrivacy(prefResult.data.cost_privacy_enabled);
      }
      setLoading(false);
    };
    load();
  }, [user, setCostPrivacy]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile updated');
    setSaving(false);
  };

  const saveFarm = async () => {
    if (!farmId) return;
    setSaving(true);
    const { error } = await supabase.from('farms').update({
      name: farmName,
      location_region: region || null,
      location_district: district || null,
    }).eq('id', farmId);
    if (error) toast.error(error.message);
    else toast.success('Farm details updated');
    setSaving(false);
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('user_preferences').update({
      currency,
      theme,
      cost_privacy_enabled: costPrivacyEnabled,
    }).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else {
      // Apply theme
      document.documentElement.classList.toggle('dark', theme === 'dark');
      toast.success('Preferences saved');
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!isPasswordStrong(newPassword)) { toast.error('Password does not meet strength requirements'); return; }
    setPasswordSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSubmitting(false);
    if (error) toast.error(error.message);
    else { setShowPassword(false); setNewPassword(''); setConfirmPassword(''); toast.success('Password updated'); }
  };

  const districts = region ? DISTRICTS_BY_REGION[region] || [] : [];

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="bg-muted" />
          </div>
          <Button size="sm" onClick={saveProfile} disabled={saving} className="rounded-full">Save Profile</Button>
        </CardContent>
      </Card>

      {/* Farm */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Home className="h-4 w-4" /> Farm</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Farm Name</Label>
            <Input value={farmName} onChange={e => setFarmName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Region</Label>
            <Select value={region} onValueChange={v => { setRegion(v); setDistrict(''); }}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{GHANA_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {region && (
            <div className="space-y-1">
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <Button size="sm" onClick={saveFarm} disabled={saving} className="rounded-full">Save Farm</Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" /> Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GHS">GHS (Ghana Cedi)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="NGN">NGN (Naira)</SelectItem>
                <SelectItem value="KES">KES (Kenya Shilling)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Cost Privacy</p>
              <p className="text-xs text-muted-foreground">Hide financial values</p>
            </div>
            <Switch checked={costPrivacyEnabled} onCheckedChange={v => setCostPrivacy(v)} />
          </div>
          <div className="space-y-1">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={savePreferences} disabled={saving} className="rounded-full">Save Preferences</Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setShowPassword(true)}>
            <Lock className="h-4 w-4" /> Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
          <Separator />
          <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={showPassword} onOpenChange={setShowPassword}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} /><PasswordStrengthIndicator password={newPassword} /></div>
            <div className="space-y-1"><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPassword(false)}>Cancel</Button>
            <Button onClick={changePassword} disabled={passwordSubmitting}>
              {passwordSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>This action cannot be undone. All your data will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { toast.info('Account deletion requires admin support. Please contact us.'); setShowDelete(false); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
