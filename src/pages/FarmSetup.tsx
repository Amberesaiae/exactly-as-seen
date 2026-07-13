import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { GHANA_REGIONS, DISTRICTS_BY_REGION } from '@/lib/ghana-regions';
import { selectPrimaryFarm } from '@/lib/canonical';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ArrowRight, Plus, Trash2, Sprout, Check } from 'lucide-react';

interface House {
  name: string;
  capacity: string;
}

export default function FarmSetup() {
  const { user, loading, recheckFarm } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [farmId, setFarmId] = useState<string | null>(null);

  // Step 1
  const [farmName, setFarmName] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');

  // Step 2
  const [houses, setHouses] = useState<House[]>([{ name: 'House 1', capacity: '500' }]);

  // Step 3
  const [currency, setCurrency] = useState('GHS');
  const [costPrivacy, setCostPrivacy] = useState(true);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: farms } = await supabase
        .from('farms')
        .select('id, name, setup_complete, updated_at')
        .eq('user_id', user.id);

      const data = selectPrimaryFarm(farms);

      if (data?.setup_complete) {
        navigate('/dashboard', { replace: true });
        return;
      }
      if (data) {
        setFarmId(data.id);
        setFarmName(data.name);
        return;
      }

      // No farm yet (e.g. Google OAuth users) — create one now
      const { data: newFarm, error } = await supabase
        .from('farms')
        .insert({
          user_id: user.id,
          name: 'My Farm',
          farm_type: 'poultry',
          setup_complete: false,
        })
        .select('id, name')
        .single();
      if (!error && newFarm) {
        setFarmId(newFarm.id);
        setFarmName(newFarm.name);
        // Ensure prefs row exists for later update
        await supabase.from('user_preferences').insert({
          user_id: user.id,
          cost_privacy_enabled: true,
          theme: 'light',
          currency: 'GHS',
        });
      } else if (error) {
        toast.error('Failed to initialize farm', { description: error.message });
      }
    })();
  }, [user, navigate]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/welcome" replace />;

  const addHouse = () => {
    setHouses([...houses, { name: `House ${houses.length + 1}`, capacity: '500' }]);
  };

  const removeHouse = (i: number) => {
    if (houses.length <= 1) return;
    setHouses(houses.filter((_, idx) => idx !== i));
  };

  const updateHouse = (i: number, field: keyof House, value: string) => {
    const updated = [...houses];
    updated[i] = { ...updated[i], [field]: value };
    setHouses(updated);
  };

  const hasUniqueHouseNames = () => {
    const names = houses.map((h) => h.name.trim().toLowerCase());
    return new Set(names).size === names.length;
  };

  const canAdvance = () => {
    if (step === 1) return farmName.trim().length > 0;
    if (step === 2) {
      return (
        houses.every((h) => h.name.trim() && parseInt(h.capacity) > 0) &&
        hasUniqueHouseNames()
      );
    }
    return true;
  };

  const handleFinish = async () => {
    if (!farmId) return;
    setSubmitting(true);

    // 1) Save farm identity first — keep setup_complete false until houses land
    //    so a house insert failure never marks the farm "ready" with zero pens.
    const { error: farmError } = await supabase.from('farms').update({
      name: farmName,
      location_region: region || null,
      location_district: district || null,
      setup_complete: false,
    }).eq('id', farmId);

    if (farmError) {
      toast.error('Failed to save farm details', { description: farmError.message });
      setSubmitting(false);
      return;
    }

    // 2) Houses required for a usable farm
    const { error: houseError } = await supabase.from('houses').insert(
      houses.map((h) => ({
        farm_id: farmId,
        name: h.name,
        capacity: parseInt(h.capacity) || 0,
      }))
    );

    if (houseError) {
      toast.error('Failed to save houses', { description: houseError.message });
      setSubmitting(false);
      return;
    }

    // 3) Mark setup complete only after houses succeed
    const { error: completeError } = await supabase.from('farms').update({
      setup_complete: true,
    }).eq('id', farmId);

    if (completeError) {
      toast.error('Failed to complete farm setup', { description: completeError.message });
      setSubmitting(false);
      return;
    }

    // 4) Preferences (OAuth users may lack a prefs row)
    const { error: prefError } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      currency,
      cost_privacy_enabled: costPrivacy,
      theme,
    }, { onConflict: 'user_id' });

    if (prefError) {
      toast.error('Failed to save preferences', { description: prefError.message });
      setSubmitting(false);
      return;
    }

    // Soft side-effect — do not block entry if activity log fails
    await supabase.from('activity_log').insert({
      farm_id: farmId,
      event_type: 'farm_setup',
      description: `Farm "${farmName}" setup completed`,
    });

    await recheckFarm();
    toast.success('Farm setup complete! Welcome to your dashboard.');
    navigate('/dashboard', { replace: true });
    setSubmitting(false);
  };

  const districts = region ? DISTRICTS_BY_REGION[region] || [] : [];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Set Up Your Farm</CardTitle>
          <CardDescription>Step {step} of 3</CardDescription>
          <Progress value={(step / 3) * 100} className="mt-4 h-2" />
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="farmNameSetup">Farm Name</Label>
                <Input id="farmNameSetup" value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="My Poultry Farm" />
              </div>
              <div className="space-y-2">
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
                <div className="space-y-2">
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
              <div className="space-y-2">
                <Label>Farm Type</Label>
                <Input value="Poultry" disabled className="bg-muted" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Add at least one house/pen for your birds.</p>
              {!hasUniqueHouseNames() && (
                <p className="text-xs text-destructive">House names must be unique.</p>
              )}
              {houses.map((house, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label>Name</Label>
                    <Input value={house.name} onChange={(e) => updateHouse(i, 'name', e.target.value)} placeholder="House name" />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label>Capacity</Label>
                    <Input type="number" min="1" value={house.capacity} onChange={(e) => updateHouse(i, 'capacity', e.target.value)} />
                  </div>
                  {houses.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeHouse(i)} className="mb-0.5 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addHouse} className="w-fit gap-1.5">
                <Plus className="h-4 w-4" /> Add House
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GHS">GHS (Ghana Cedi)</SelectItem>
                    <SelectItem value="NGN">NGN (Naira)</SelectItem>
                    <SelectItem value="CFA">CFA (Franc)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Cost Privacy</p>
                  <p className="text-xs text-muted-foreground">Hide financial values from casual view</p>
                </div>
                <Switch checked={costPrivacy} onCheckedChange={setCostPrivacy} />
              </div>
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between gap-3">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1.5 rounded-full">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : <div />}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()} className="gap-1.5 rounded-full">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={submitting} className="gap-1.5 rounded-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Finish</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
