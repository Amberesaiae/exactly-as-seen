import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  User, Home, Settings, LogOut, Trash2, Lock, Loader2, Plus, Pencil, Warehouse,
  Download, Shield, Info, CheckCircle2, MapPin, Phone, Mail, Globe, Eye, EyeOff,
  Sun, Moon, DollarSign, Bell, Activity, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { GHANA_REGIONS, DISTRICTS_BY_REGION } from '@/lib/ghana-regions';
import { isPasswordStrong } from '@/lib/password-validation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Farm = Database['public']['Tables']['farms']['Row'];
type House = Database['public']['Tables']['houses']['Row'];

const CURRENCIES = [
  { value: 'GHS', label: 'GHS', name: 'Ghana Cedi', symbol: '₵' },
  { value: 'USD', label: 'USD', name: 'US Dollar', symbol: '$' },
  { value: 'NGN', label: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { value: 'KES', label: 'KES', name: 'Kenya Shilling', symbol: 'KSh' },
  { value: 'GBP', label: 'GBP', name: 'British Pound', symbol: '£' },
  { value: 'EUR', label: 'EUR', name: 'Euro', symbol: '€' },
  { value: 'XOF', label: 'XOF', name: 'CFA Franc', symbol: 'CFA' },
  { value: 'ZAR', label: 'ZAR', name: 'South African Rand', symbol: 'R' },
];

const FARM_TYPES = [
  { value: 'poultry', label: 'Poultry' },
  { value: 'mixed', label: 'Mixed Farming' },
  { value: 'layers', label: 'Layers Only' },
  { value: 'broilers', label: 'Broilers Only' },
  { value: 'hatchery', label: 'Hatchery' },
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { costPrivacyEnabled, setCostPrivacy } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  // Profile
  const [fullName, setFullName] = useState('');

  // Farm
  const [farm, setFarm] = useState<Farm | null>(null);
  const [farmName, setFarmName] = useState('');
  const [farmType, setFarmType] = useState('poultry');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');

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
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Delete account
  const [showDelete, setShowDelete] = useState(false);

  // Activity log
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; event_type: string; description: string; created_at: string }>>([]);

  // Data export
  const [exporting, setExporting] = useState(false);

  // Stats
  const [stats, setStats] = useState({ batches: 0, totalBirds: 0, houses: 0, formulations: 0 });

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
        setFarm(farmResult.data);
        setFarmName(farmResult.data.name);
        setFarmType(farmResult.data.farm_type);
        setRegion(farmResult.data.location_region ?? '');
        setDistrict(farmResult.data.location_district ?? '');

        // Load houses, stats, activity in parallel
        const [housesRes, batchesRes, formulationsRes, activityRes] = await Promise.all([
          supabase.from('houses').select('*').eq('farm_id', farmResult.data.id).order('created_at', { ascending: true }),
          supabase.from('batches').select('id, current_population, status').eq('farm_id', farmResult.data.id),
          supabase.from('feed_formulations').select('id').eq('farm_id', farmResult.data.id),
          supabase.from('activity_log').select('id, event_type, description, created_at').eq('farm_id', farmResult.data.id).order('created_at', { ascending: false }).limit(10),
        ]);

        setHouses(housesRes.data ?? []);
        setRecentActivity(activityRes.data ?? []);

        const activeBatches = (batchesRes.data ?? []).filter(b => b.status === 'active');
        setStats({
          batches: activeBatches.length,
          totalBirds: activeBatches.reduce((sum, b) => sum + b.current_population, 0),
          houses: (housesRes.data ?? []).length,
          formulations: (formulationsRes.data ?? []).length,
        });
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

  const showSaved = (section: string) => {
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
  };

  // --- Profile ---
  const saveProfile = async () => {
    if (!user) return;
    setSaving('profile');
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else { toast.success('Profile updated'); showSaved('profile'); }
    setSaving(null);
  };

  // --- Farm ---
  const saveFarm = async () => {
    if (!farm) return;
    if (!farmName.trim()) { toast.error('Farm name is required'); return; }
    setSaving('farm');
    const { error } = await supabase.from('farms').update({
      name: farmName.trim(),
      farm_type: farmType,
      location_region: region || null,
      location_district: district || null,
    }).eq('id', farm.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Farm details updated');
      showSaved('farm');
      // Log activity
      await supabase.from('activity_log').insert({
        farm_id: farm.id,
        event_type: 'settings',
        description: 'Farm details updated',
      });
    }
    setSaving(null);
  };

  // --- Preferences ---
  const savePreferences = async () => {
    if (!user) return;
    setSaving('prefs');
    // Upsert to handle case where prefs don't exist yet
    const { error } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      currency,
      theme,
      cost_privacy_enabled: costPrivacyEnabled,
    }, { onConflict: 'user_id' });
    if (error) toast.error(error.message);
    else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      toast.success('Preferences saved');
      showSaved('prefs');
    }
    setSaving(null);
  };

  // --- Cost Privacy Toggle (instant save) ---
  const togglePrivacy = async (val: boolean) => {
    setCostPrivacy(val);
    if (user) {
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        cost_privacy_enabled: val,
        currency,
        theme,
      }, { onConflict: 'user_id' });
    }
  };

  // --- Theme Toggle (instant save) ---
  const toggleTheme = async (val: string) => {
    setTheme(val);
    document.documentElement.classList.toggle('dark', val === 'dark');
    if (user) {
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        theme: val,
        cost_privacy_enabled: costPrivacyEnabled,
        currency,
      }, { onConflict: 'user_id' });
    }
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
    if (!farm || !houseName.trim()) {
      toast.error('House name is required');
      return;
    }
    const capacity = parseInt(houseCapacity) || 0;
    setHouseSaving(true);

    if (editingHouse) {
      const { error } = await supabase.from('houses').update({ name: houseName.trim(), capacity }).eq('id', editingHouse.id);
      if (error) {
        toast.error(error.message);
      } else {
        setHouses(prev => prev.map(h => h.id === editingHouse.id ? { ...h, name: houseName.trim(), capacity } : h));
        toast.success('House updated');
        setShowHouseDialog(false);
      }
    } else {
      const { data, error } = await supabase.from('houses').insert({ farm_id: farm.id, name: houseName.trim(), capacity }).select().single();
      if (error) {
        toast.error(error.message);
      } else {
        setHouses(prev => [...prev, data]);
        setStats(prev => ({ ...prev, houses: prev.houses + 1 }));
        toast.success('House added');
        setShowHouseDialog(false);
        await supabase.from('activity_log').insert({
          farm_id: farm.id,
          event_type: 'settings',
          description: `Added house: ${houseName.trim()}`,
        });
      }
    }
    setHouseSaving(false);
  };

  const confirmDeleteHouse = async () => {
    if (!deleteHouseId || !farm) return;
    const house = houses.find(h => h.id === deleteHouseId);
    const { error } = await supabase.from('houses').delete().eq('id', deleteHouseId);
    if (error) {
      toast.error(error.message);
    } else {
      setHouses(prev => prev.filter(h => h.id !== deleteHouseId));
      setStats(prev => ({ ...prev, houses: prev.houses - 1 }));
      toast.success('House deleted');
      if (house) {
        await supabase.from('activity_log').insert({
          farm_id: farm.id,
          event_type: 'settings',
          description: `Deleted house: ${house.name}`,
        });
      }
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
      toast.success('Password updated successfully');
    }
  };

  // --- Data Export ---
  const exportData = async () => {
    if (!farm) return;
    setExporting(true);
    try {
      const [batchesRes, eggsRes, feedRes, healthRes, mortalityRes, expensesRes, revenueRes, stockRes] = await Promise.all([
        supabase.from('batches').select('*').eq('farm_id', farm.id),
        supabase.from('egg_records').select('*').eq('farm_id', farm.id),
        supabase.from('feed_schedules').select('*').eq('farm_id', farm.id),
        supabase.from('health_tasks').select('*').eq('farm_id', farm.id),
        supabase.from('mortality_records').select('*').eq('farm_id', farm.id),
        supabase.from('expenses').select('*').eq('farm_id', farm.id),
        supabase.from('revenue').select('*').eq('farm_id', farm.id),
        supabase.from('stock_items').select('*').eq('farm_id', farm.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        farm: { name: farm.name, type: farm.farm_type, region: farm.location_region, district: farm.location_district },
        batches: batchesRes.data ?? [],
        egg_records: eggsRes.data ?? [],
        feed_schedules: feedRes.data ?? [],
        health_tasks: healthRes.data ?? [],
        mortality_records: mortalityRes.data ?? [],
        expenses: expensesRes.data ?? [],
        revenue: revenueRes.data ?? [],
        stock_items: stockRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lampfarms-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Farm data exported successfully');

      await supabase.from('activity_log').insert({
        farm_id: farm.id,
        event_type: 'export',
        description: 'Full farm data exported',
      });
    } catch {
      toast.error('Failed to export data');
    }
    setExporting(false);
  };

  // CSV Export
  const exportCSV = async () => {
    if (!farm) return;
    setExporting(true);
    try {
      const [batchesRes, expensesRes, revenueRes] = await Promise.all([
        supabase.from('batches').select('name, species, status, initial_quantity, current_population, start_date, phase').eq('farm_id', farm.id),
        supabase.from('expenses').select('date, category, description, amount').eq('farm_id', farm.id).order('date', { ascending: false }),
        supabase.from('revenue').select('date, category, description, amount, buyer').eq('farm_id', farm.id).order('date', { ascending: false }),
      ]);

      // Build CSV for financial summary
      let csv = 'Type,Date,Category,Description,Amount,Buyer\n';
      (revenueRes.data ?? []).forEach(r => {
        csv += `Revenue,${r.date},${r.category},"${r.description}",${r.amount},${r.buyer || ''}\n`;
      });
      (expensesRes.data ?? []).forEach(e => {
        csv += `Expense,${e.date},${e.category},"${e.description}",-${e.amount},\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lampfarms-finance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Financial data exported as CSV');
    } catch {
      toast.error('Failed to export CSV');
    }
    setExporting(false);
  };

  const districts = region ? DISTRICTS_BY_REGION[region] || [] : [];

  const totalCapacity = useMemo(() => houses.reduce((sum, h) => sum + h.capacity, 0), [houses]);
  const capacityUsage = totalCapacity > 0 ? Math.round((stats.totalBirds / totalCapacity) * 100) : 0;

  const memberSince = user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : '';

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <Badge variant="outline" className="text-xs gap-1">
          <Activity className="h-3 w-3" />
          v1.0
        </Badge>
      </div>

      {/* Farm Overview Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.batches}</p>
              <p className="text-xs text-muted-foreground">Active Batches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalBirds.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Birds</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.houses}</p>
              <p className="text-xs text-muted-foreground">Houses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{capacityUsage}%</p>
              <p className="text-xs text-muted-foreground">Capacity Used</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="profile" className="text-xs py-2 gap-1">
            <User className="h-3.5 w-3.5 hidden sm:block" /> Profile
          </TabsTrigger>
          <TabsTrigger value="farm" className="text-xs py-2 gap-1">
            <Home className="h-3.5 w-3.5 hidden sm:block" /> Farm
          </TabsTrigger>
          <TabsTrigger value="prefs" className="text-xs py-2 gap-1">
            <Settings className="h-3.5 w-3.5 hidden sm:block" /> Prefs
          </TabsTrigger>
          <TabsTrigger value="account" className="text-xs py-2 gap-1">
            <Shield className="h-3.5 w-3.5 hidden sm:block" /> Account
          </TabsTrigger>
        </TabsList>

        {/* ═══════════ PROFILE TAB ═══════════ */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Information
              </CardTitle>
              <CardDescription>Manage your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <div className="flex gap-2 items-center">
                  <Input value={user?.email ?? ''} disabled className="bg-muted flex-1" />
                  <Badge variant="secondary" className="text-xs shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                </div>
              </div>
              {memberSince && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Member since {memberSince}
                </p>
              )}
              <Button
                size="sm"
                onClick={saveProfile}
                disabled={saving === 'profile'}
                className="rounded-full gap-1"
              >
                {saving === 'profile' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedSection === 'profile' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                {savedSection === 'profile' ? 'Saved!' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ FARM TAB ═══════════ */}
        <TabsContent value="farm" className="space-y-4 mt-4">
          {/* Farm Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-4 w-4" /> Farm Details
              </CardTitle>
              <CardDescription>Update your farm information and location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Farm Name</Label>
                <Input value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="My Farm" />
              </div>
              <div className="space-y-1">
                <Label>Farm Type</Label>
                <Select value={farmType} onValueChange={setFarmType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FARM_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Region</Label>
                <Select value={region} onValueChange={v => { setRegion(v); setDistrict(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {GHANA_REGIONS.map(r => (
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
                      {districts.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                size="sm"
                onClick={saveFarm}
                disabled={saving === 'farm'}
                className="rounded-full gap-1"
              >
                {saving === 'farm' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedSection === 'farm' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                {savedSection === 'farm' ? 'Saved!' : 'Save Farm'}
              </Button>
            </CardContent>
          </Card>

          {/* Houses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Warehouse className="h-4 w-4" /> Houses
                </CardTitle>
                <CardDescription>
                  {houses.length} house{houses.length !== 1 ? 's' : ''} · {totalCapacity.toLocaleString()} total capacity
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" className="rounded-full gap-1 shrink-0" onClick={openAddHouse}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {houses.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Warehouse className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No houses yet</p>
                  <p className="text-xs">Add your first poultry house to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {houses.map(house => {
                    const batchCount = stats.batches; // simplified
                    return (
                      <div
                        key={house.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{house.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Capacity: {house.capacity.toLocaleString()} birds
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditHouse(house)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteHouseId(house.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ PREFERENCES TAB ═══════════ */}
        <TabsContent value="prefs" className="space-y-4 mt-4">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="h-4 w-4" /> Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-amber-500" />}
                  <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={v => toggleTheme(v ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Financial Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.symbol} {c.label} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {costPrivacyEnabled ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-primary" />}
                  <div>
                    <p className="text-sm font-medium">Cost Privacy</p>
                    <p className="text-xs text-muted-foreground">
                      {costPrivacyEnabled ? 'Financial values are hidden' : 'Financial values are visible'}
                    </p>
                  </div>
                </div>
                <Switch checked={costPrivacyEnabled} onCheckedChange={togglePrivacy} />
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

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4" /> Data Export
              </CardTitle>
              <CardDescription>Download your farm data for backup or analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={exportData}
                disabled={exporting}
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export All Data (JSON)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={exportCSV}
                disabled={exporting}
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export Finances (CSV)
              </Button>
              <p className="text-xs text-muted-foreground">
                Includes batches, eggs, feed, health, mortality, expenses, revenue, and stock data.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ ACCOUNT TAB ═══════════ */}
        <TabsContent value="account" className="space-y-4 mt-4">
          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" /> Security
              </CardTitle>
              <CardDescription>Manage your password and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setShowPassword(true)}>
                <Lock className="h-4 w-4" /> Change Password
              </Button>
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Signed in as</span>
                  <span className="font-medium truncate">{user?.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent Activity
              </CardTitle>
              <CardDescription>Last 10 actions on your farm</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activity recorded yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentActivity.map(a => (
                    <div key={a.id} className="flex items-start gap-2 text-sm border-b border-border/50 pb-2 last:border-0">
                      <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{a.event_type}</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{a.description}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sign Out & Danger Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={signOut}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => setShowDelete(true)}>
                <Trash2 className="h-4 w-4" /> Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">LampFarms</p>
                <p className="text-xs text-muted-foreground">Poultry Farm Management System</p>
                <p className="text-xs text-muted-foreground">Version 1.0.0 · Built with Lovable</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <Input value={houseName} onChange={e => setHouseName(e.target.value)} placeholder="e.g. House A" />
            </div>
            <div className="space-y-1">
              <Label>Capacity (birds)</Label>
              <Input type="number" value={houseCapacity} onChange={e => setHouseCapacity(e.target.value)} placeholder="500" min={0} />
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
      <AlertDialog open={!!deleteHouseId} onOpenChange={open => !open && setDeleteHouseId(null)}>
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
              <div className="relative">
                <Input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10"
                  onClick={() => setShowNewPw(!showNewPw)}
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPassword(false)}>Cancel</Button>
            <Button onClick={changePassword} disabled={passwordSubmitting || newPassword !== confirmPassword}>
              {passwordSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Account Dialog ── */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your farm data, batches, records, and settings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive font-medium">You will lose:</p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
              <li>{stats.batches} active batch{stats.batches !== 1 ? 'es' : ''} and {stats.totalBirds.toLocaleString()} birds</li>
              <li>All egg, feed, health, and mortality records</li>
              <li>All financial data (expenses & revenue)</li>
              <li>Stock inventory and transaction history</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.info('Account deletion requires admin support. Please contact us.');
                setShowDelete(false);
              }}
            >
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
