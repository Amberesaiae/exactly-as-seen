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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { User, Home, Settings, LogOut, Trash2, Lock, Loader2, Plus, Pencil, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { GHANA_REGIONS, DISTRICTS_BY_REGION } from '@/lib/ghana-regions';
import { isPasswordStrong } from '@/lib/password-validation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import type { Database } from '@/integrations/supabase/types';

type Farm = Database['public']['Tables']['farms']['Row'];
type House = Database['public']['Tables']['houses']['Row'];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { costPrivacyEnabled, setCostPrivacy } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile
  const [fullName, setFullName] = useState('');

  // Farm
  const [farmName, setFarmName] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [farmId, setFarmId] = useState('');

  // Preferences
  const [currency, setCurrency] = useState('GHS');
  const [theme, setTheme] = useState('light');

  // Houses
  const [houses, setHouses] = useState<House[]>([]);
  const [showHouseDialog, setShowHouseDialog] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [houseName, setHouseName] = useState('');
  const [houseCapacity, setHouseCapacity] = useState('');
  const [houseSaving, setHouseSaving] = useState(false);
  const [deleteHouseId, setDeleteHouseId] = useState<string | null>(null);

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

        // Load houses for this farm
        const { data: housesData } = await supabase
          .from('houses')
          .select('*')
          .eq('farm_id', farmResult.data.id)
          .order('created_at', { ascending: true });
        setHouses(housesData ?? []);
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

  // --- Profile ---
  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile updated');
    setSaving(false);
  };

  // --- Farm ---
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

  // --- Preferences ---
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
      document.documentElement.classList.toggle('dark', theme === 'dark');
      toast.success('Preferences saved');
    }
    setSaving(false);
  };

  // --- Houses ---
  const openAddHouse = () => {
    setEditingHouse(null);
    setHouseName('');
    setHouseCapacity('');
    setShowHouseDialog(true);
  };

  const openEditHouse = (house: House) => {
    setEditingHouse(house);
    setHouseName(house.name);
    setHouseCapacity(String(house.capacity));
    setShowHouseDialog(true);
  };

  const saveHouse = async () => {
    if (!farmId || !houseName.trim()) {
      toast.error('House name is required');
      return;
    }
    const capacity = parseInt(houseCapacity) || 0;
    setHouseSaving(true);

    if (editingHouse) {
      const { error } = await supabase
        .from('houses')
        .update({ name: houseName.trim(), capacity })
        .eq('id', editingHouse.id);
      if (error) {
        toast.error(error.message);
      } else {
        setHouses((prev) => prev.map((h) => h.id === editingHouse.id ? { ...h, name: houseName.trim(), capacity } : h));
        toast.success('House updated');
        setShowHouseDialog(false);
      }
    } else {
      const { data, error } = await supabase
        .from('houses')
        .insert({ farm_id: farmId, name: houseName.trim(), capacity })
        .select()
        .single();
      if (error) {
        toast.error(error.message);
      } else {
        setHouses((prev) => [...prev, data]);
        toast.success('House added');
        setShowHouseDialog(false);
      }
    }
    setHouseSaving(false);
  };

  const confirmDeleteHouse = async () => {
    if (!deleteHouseId) return;
    const { error } = await supabase.from('houses').delete().eq('id', deleteHouseId);
    if (error) {
      toast.error(error.message);
    } else {
      setHouses((prev) => prev.filter((h) => h.id !== deleteHouseId));
      toast.success('House deleted');
    }
    setDeleteHouseId(null);
  };

  // --- Password ---
  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      toast.error('Password does not meet strength requirements');
      return;
    }
    setPasswordSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      setShowPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    }
  };

  const districts = region ? DISTRICTS_BY_REGION[region] || [] : [];

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl pb-24">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* ── Profile ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="bg-muted" />
          </div>
          <Button size="sm" onClick={saveProfile} disabled={saving} className="rounded-full">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* ── Farm ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4" /> Farm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Farm Name</Label>
            <Input value={farmName} onChange={(e) => setFarmName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Region</Label>
            <Select value={region} onValueChange={(v) => { setRegion(v); setDistrict(''); }}>
              <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
              <SelectContent>
                {GHANA_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {region && (
            <div className="space-y-1">
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button size="sm" onClick={saveFarm} disabled={saving} className="rounded-full">
            Save Farm
          </Button>
        </CardContent>
      </Card>

      {/* ── Houses ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Warehouse className="h-4 w-4" /> Houses
          </CardTitle>
          <Button size="sm" variant="outline" className="rounded-full gap-1" onClick={openAddHouse}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {houses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No houses yet. Add your first poultry house.
            </p>
          ) : (
            <div className="space-y-2">
              {houses.map((house) => (
                <div
                  key={house.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{house.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Capacity: {house.capacity.toLocaleString()} birds
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditHouse(house)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteHouseId(house.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Preferences ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" /> Preferences
          </CardTitle>
        </CardHeader>
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
            <Switch checked={costPrivacyEnabled} onCheckedChange={(v) => setCostPrivacy(v)} />
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
          <Button size="sm" onClick={savePreferences} disabled={saving} className="rounded-full">
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* ── Account ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Account
          </CardTitle>
        </CardHeader>
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

      {/* ── House Add/Edit Dialog ── */}
      <Dialog open={showHouseDialog} onOpenChange={setShowHouseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHouse ? 'Edit House' : 'Add House'}</DialogTitle>
            <DialogDescription>
              {editingHouse ? 'Update the house details below.' : 'Add a new poultry house to your farm.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>House Name</Label>
              <Input value={houseName} onChange={(e) => setHouseName(e.target.value)} placeholder="e.g. House A" />
            </div>
            <div className="space-y-1">
              <Label>Capacity (birds)</Label>
              <Input type="number" value={houseCapacity} onChange={(e) => setHouseCapacity(e.target.value)} placeholder="500" min={0} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHouseDialog(false)}>Cancel</Button>
            <Button onClick={saveHouse} disabled={houseSaving}>
              {houseSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingHouse ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete House Confirm ── */}
      <AlertDialog open={!!deleteHouseId} onOpenChange={(open) => !open && setDeleteHouseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete House</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this house. Batches assigned to it will be unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteHouse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Password Dialog ── */}
      <Dialog open={showPassword} onOpenChange={setShowPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter a strong new password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
              <PasswordStrengthIndicator password={newPassword} />
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPassword(false)}>Cancel</Button>
            <Button onClick={changePassword} disabled={passwordSubmitting}>
              {passwordSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Account Dialog ── */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.info('Account deletion requires admin support. Please contact us.');
                setShowDelete(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
