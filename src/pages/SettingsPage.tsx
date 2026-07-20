import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Home, Settings, DollarSign, Download, Cpu, Activity, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { isOffline, queueWrite } from '@/lib/sync';

import ProfileTab from '@/components/settings/ProfileTab';
import FarmTab from '@/components/settings/FarmTab';
import PreferencesTab from '@/components/settings/PreferencesTab';
import MarketPricesTab from '@/components/settings/MarketPricesTab';
import SpeciesConfigTab from '@/components/settings/SpeciesConfigTab';
import SystemTab from '@/components/settings/SystemTab';
import DataTab from '@/components/settings/DataTab';
import NotificationsTab from '@/components/settings/NotificationsTab';

import type { Database } from '@/integrations/supabase/types';
type Farm = Database['public']['Tables']['farms']['Row'];

export default function SettingsPage() {
  const { user, signOut, recheckFarm } = useAuth();
  const { costPrivacyEnabled, setCostPrivacy } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  // States managed here for coordination across tabs
  const [fullName, setFullName] = useState('');
  const [farm, setFarm] = useState<Farm | null>(null);
  const [farmName, setFarmName] = useState('');
  const [farmType, setFarmType] = useState('poultry');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [waterSourceChlorinated, setWaterSourceChlorinated] = useState(false);
  const [eggLowInventoryCrates, setEggLowInventoryCrates] = useState('5');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('GHS');
  const [theme, setTheme] = useState('light');
  const [hasPin, setHasPin] = useState(false);
  const [configOverrides, setConfigOverrides] = useState<Array<{ id: string; key: string; value: string }>>([]);
  const [stats, setStats] = useState({ batches: 0, totalBirds: 0, houses: 0, formulations: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [profileResult, farmResult, prefResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('farms').select('*').eq('user_id', user.id).order('setup_complete', { ascending: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      setFullName(profileResult.data?.full_name ?? '');

      if (farmResult.data) {
        setFarm(farmResult.data);
        setFarmName(farmResult.data.name);
        setFarmType(farmResult.data.farm_type);
        setRegion(farmResult.data.location_region ?? '');
        setDistrict(farmResult.data.location_district ?? '');
        setWaterSourceChlorinated(farmResult.data.water_source_chlorinated ?? false);
        setEggLowInventoryCrates(String(farmResult.data.egg_low_inventory_crates ?? 5));
        setTimezone(farmResult.data.timezone ?? 'UTC');

        const [housesRes, batchesRes, formulationsRes, configsRes] = await Promise.all([
          supabase.from('houses').select('*').eq('farm_id', farmResult.data.id).order('created_at', { ascending: true }),
          supabase.from('batches').select('id, current_population, status').eq('farm_id', farmResult.data.id),
          supabase.from('feed_formulations').select('id').eq('farm_id', farmResult.data.id),
          supabase.from('config_overrides').select('*').eq('farm_id', farmResult.data.id).order('key'),
        ]);

        setConfigOverrides(configsRes.data ?? []);
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
        setHasPin(!!prefResult.data.cost_privacy_pin);
      }
      setLoading(false);
    };
    load();
  }, [user, setCostPrivacy]);

  const showSaved = (section: string) => {
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving('profile');

    if (isOffline()) {
      await queueWrite('profiles', 'update', user.id, { full_name: fullName } as unknown as Record<string, unknown>);
      toast.success('Profile updated (offline — will sync)');
      showSaved('profile');
      setSaving(null);
      return;
    }

    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else { toast.success('Profile updated'); showSaved('profile'); }
    setSaving(null);
  };

  const saveFarm = async () => {
    if (!farm) return;
    if (!farmName.trim()) { toast.error('Farm name is required'); return; }
    setSaving('farm');

    const updateData = {
      name: farmName.trim(),
      farm_type: farmType,
      location_region: region || null,
      location_district: district || null,
      water_source_chlorinated: waterSourceChlorinated,
      egg_low_inventory_crates: parseInt(eggLowInventoryCrates) || 5,
      timezone: timezone,
    };

    if (isOffline()) {
      await queueWrite('farms', 'update', farm.id, updateData as unknown as Record<string, unknown>);
      toast.success('Farm details updated (offline — will sync)');
      showSaved('farm');
      setSaving(null);
      return;
    }

    const { error } = await supabase.from('farms').update(updateData).eq('id', farm.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Farm details updated');
      showSaved('farm');
      await supabase.from('activity_log').insert({ farm_id: farm.id, event_type: 'settings', description: 'Farm details updated' });
    }
    setSaving(null);
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving('prefs');

    const prefsData = {
      user_id: user.id,
      currency,
      theme,
      cost_privacy_enabled: costPrivacyEnabled,
    };

    if (isOffline()) {
      await queueWrite('user_preferences', 'insert', user.id, prefsData as unknown as Record<string, unknown>);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      toast.success('Preferences saved (offline — will sync)');
      showSaved('prefs');
      recheckFarm();
      setSaving(null);
      return;
    }

    const { error } = await supabase.from('user_preferences').upsert(prefsData, { onConflict: 'user_id' });
    if (error) toast.error(error.message);
    else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      toast.success('Preferences saved');
      showSaved('prefs');
      recheckFarm();
    }
    setSaving(null);
  };

  const togglePrivacy = async (val: boolean) => {
    setCostPrivacy(val);
    if (user) {
      if (isOffline()) {
        await queueWrite('user_preferences', 'update', user.id, { user_id: user.id, cost_privacy_enabled: val, currency, theme } as unknown as Record<string, unknown>);
        return;
      }
      await supabase.from('user_preferences').upsert({ user_id: user.id, cost_privacy_enabled: val, currency, theme }, { onConflict: 'user_id' });
    }
  };

  const toggleTheme = async (val: string) => {
    setTheme(val);
    document.documentElement.classList.toggle('dark', val === 'dark');
    if (user) {
      if (isOffline()) {
        await queueWrite('user_preferences', 'update', user.id, { user_id: user.id, theme: val, cost_privacy_enabled: costPrivacyEnabled, currency } as unknown as Record<string, unknown>);
        return;
      }
      await supabase.from('user_preferences').upsert({ user_id: user.id, theme: val, cost_privacy_enabled: costPrivacyEnabled, currency }, { onConflict: 'user_id' });
    }
  };

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Farm Settings</h1>
        <Badge variant="outline" className="text-xs gap-1">
          <Activity className="h-3 w-3" /> v1.0
        </Badge>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div><p className="text-xl font-bold text-primary">{stats.batches}</p><p className="text-xxs text-muted-foreground">Active Batches</p></div>
            <div><p className="text-xl font-bold text-primary">{stats.totalBirds.toLocaleString()}</p><p className="text-xxs text-muted-foreground">Total Birds</p></div>
            <div><p className="text-xl font-bold text-primary">{stats.houses}</p><p className="text-xxs text-muted-foreground">Houses</p></div>
            <div><p className="text-xl font-bold text-primary">{stats.formulations}</p><p className="text-xxs text-muted-foreground">Formulations</p></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full grid grid-cols-4 sm:grid-cols-8 h-10 p-1 bg-secondary/50 rounded-full gap-0.5">
          <TabsTrigger value="profile" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><User className="h-3.5 w-3.5 hidden md:block" /> Profile</TabsTrigger>
          <TabsTrigger value="farm" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><Home className="h-3.5 w-3.5 hidden md:block" /> Farm</TabsTrigger>
          <TabsTrigger value="prefs" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><Settings className="h-3.5 w-3.5 hidden md:block" /> Prefs</TabsTrigger>
          <TabsTrigger value="prices" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><DollarSign className="h-3.5 w-3.5 hidden md:block" /> Prices</TabsTrigger>
          <TabsTrigger value="species" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><Activity className="h-3.5 w-3.5 hidden md:block" /> Species</TabsTrigger>
          <TabsTrigger value="system" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><Cpu className="h-3.5 w-3.5 hidden md:block" /> System</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><Bell className="h-3.5 w-3.5 hidden md:block" /> Alerts</TabsTrigger>
          <TabsTrigger value="data" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><Download className="h-3.5 w-3.5 hidden md:block" /> Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile"><ProfileTab user={user} fullName={fullName} setFullName={setFullName} saving={saving} savedSection={savedSection} saveProfile={saveProfile} signOut={signOut} /></TabsContent>
        <TabsContent value="farm"><FarmTab farm={farm} farmName={farmName} setFarmName={setFarmName} farmType={farmType} setFarmType={setFarmType} region={region} setRegion={setRegion} district={district} setDistrict={setDistrict} waterSourceChlorinated={waterSourceChlorinated} setWaterSourceChlorinated={setWaterSourceChlorinated} eggLowInventoryCrates={eggLowInventoryCrates} setEggLowInventoryCrates={setEggLowInventoryCrates} timezone={timezone} setTimezone={setTimezone} saving={saving} savedSection={savedSection} saveFarm={saveFarm} setStats={setStats} /></TabsContent>
        <TabsContent value="prefs"><PreferencesTab user={user} currency={currency} setCurrency={setCurrency} theme={theme} setTheme={setTheme} costPrivacyEnabled={costPrivacyEnabled} togglePrivacy={togglePrivacy} toggleTheme={toggleTheme} savePreferences={savePreferences} saving={saving} savedSection={savedSection} hasPin={hasPin} setHasPin={setHasPin} /></TabsContent>
        <TabsContent value="prices"><MarketPricesTab farm={farm} configOverrides={configOverrides} setConfigOverrides={setConfigOverrides} /></TabsContent>
        <TabsContent value="species"><SpeciesConfigTab /></TabsContent>
        <TabsContent value="system"><SystemTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="data"><DataTab farm={farm} signOut={signOut} /></TabsContent>
      </Tabs>
    </div>
  );
}
