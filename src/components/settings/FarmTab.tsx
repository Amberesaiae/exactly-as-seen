import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Home, Plus, Pencil, Trash2, Warehouse, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { GHANA_REGIONS, DISTRICTS_BY_REGION } from '@/lib/ghana-regions';
import { isOffline, queueWrite } from '@/lib/sync';
import type { Database } from '@/integrations/supabase/types';

type Farm = Database['public']['Tables']['farms']['Row'];
type House = Database['public']['Tables']['houses']['Row'];

const FARM_TYPES = [
  { value: 'poultry', label: 'Poultry' },
  { value: 'mixed', label: 'Mixed Farming' },
  { value: 'layers', label: 'Layers Only' },
  { value: 'broilers', label: 'Broilers Only' },
  { value: 'hatchery', label: 'Hatchery' },
];

interface FarmTabProps {
  farm: Farm | null;
  farmName: string;
  setFarmName: (val: string) => void;
  farmType: string;
  setFarmType: (val: string) => void;
  region: string;
  setRegion: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  waterSourceChlorinated: boolean;
  setWaterSourceChlorinated: (val: boolean) => void;
  eggLowInventoryCrates: string;
  setEggLowInventoryCrates: (val: string) => void;
  timezone: string;
  setTimezone: (val: string) => void;
  saving: string | null;
  savedSection: string | null;
  saveFarm: () => Promise<void>;
  setStats: any;
}

export default function FarmTab({
  farm,
  farmName,
  setFarmName,
  farmType,
  setFarmType,
  region,
  setRegion,
  district,
  setDistrict,
  waterSourceChlorinated,
  setWaterSourceChlorinated,
  eggLowInventoryCrates,
  setEggLowInventoryCrates,
  timezone,
  setTimezone,
  saving,
  savedSection,
  saveFarm,
  setStats,
}: FarmTabProps) {
  const [houses, setHouses] = useState<House[]>([]);
  const [showHouseDialog, setShowHouseDialog] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [houseName, setHouseName] = useState('');
  const [houseCapacity, setHouseCapacity] = useState('');
  const [houseSaving, setHouseSaving] = useState(false);
  const [deleteHouseId, setDeleteHouseId] = useState<string | null>(null);

  // Load houses locally
  useEffect(() => {
    if (!farm) return;
    supabase
      .from('houses')
      .select('*')
      .eq('farm_id', farm.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setHouses(data);
      });
  }, [farm]);

  // House operations
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

    if (isOffline()) {
      if (editingHouse) {
        await queueWrite('houses', 'update', editingHouse.id, { name: houseName.trim(), capacity } as unknown as Record<string, unknown>);
        setHouses(prev => prev.map(h => h.id === editingHouse.id ? { ...h, name: houseName.trim(), capacity } : h));
        toast.success('House updated (offline — will sync)');
        setShowHouseDialog(false);
      } else {
        const tempId = crypto.randomUUID();
        await queueWrite('houses', 'insert', tempId, { farm_id: farm.id, name: houseName.trim(), capacity } as unknown as Record<string, unknown>);
        setHouses(prev => [...prev, { id: tempId, farm_id: farm.id, name: houseName.trim(), capacity } as any]);
        setStats((prev: any) => ({ ...prev, houses: prev.houses + 1 }));
        toast.success('House added (offline — will sync)');
        setShowHouseDialog(false);
      }
      setHouseSaving(false);
      return;
    }

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
        setStats((prev: any) => ({ ...prev, houses: prev.houses + 1 }));
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

  const confirmDeleteHouse = async (houseId: string) => {
    if (!farm) return;
    const house = houses.find(h => h.id === houseId);

    // Fail closed: never delete a house with an active flock (trigger also enforces)
    if (house?.occupied_by_batch_id) {
      toast.error('Cannot delete house while a flock occupies it');
      setDeleteHouseId(null);
      return;
    }
    const { count: activeOnHouse } = await supabase
      .from('batches')
      .select('id', { count: 'exact', head: true })
      .eq('house_id', houseId)
      .eq('status', 'active');
    if ((activeOnHouse || 0) > 0) {
      toast.error('Cannot delete house with an active flock');
      setDeleteHouseId(null);
      return;
    }

    if (isOffline()) {
      await queueWrite('houses', 'delete', houseId, {} as Record<string, unknown>);
      setHouses(prev => prev.filter(h => h.id !== houseId));
      setStats((prev: any) => ({ ...prev, houses: prev.houses - 1 }));
      toast.success('House deleted (offline — will sync)');
      setDeleteHouseId(null);
      return;
    }

    const { error } = await supabase.from('houses').delete().eq('id', houseId);
    if (error) {
      toast.error(error.message);
    } else {
      setHouses(prev => prev.filter(h => h.id !== houseId));
      setStats((prev: any) => ({ ...prev, houses: prev.houses - 1 }));
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

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" /> Farm Identity & Parameters
          </CardTitle>
          <CardDescription>Update your farm info, biosecurity parameters, and timezone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="farm-name-input">Farm Name</Label>
            <Input id="farm-name-input" value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="My Farm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Farm Type</Label>
              <Select value={farmType} onValueChange={setFarmType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FARM_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Africa/Accra">Accra (GMT)</SelectItem>
                  <SelectItem value="Africa/Lagos">Lagos (GMT+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Region</Label>
              <Select value={region} onValueChange={val => { setRegion(val); setDistrict(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {GHANA_REGIONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict} disabled={!region}>
                <SelectTrigger>
                  <SelectValue placeholder={region ? "Select District" : "Select Region First"} />
                </SelectTrigger>
                <SelectContent>
                  {(DISTRICTS_BY_REGION[region] ?? []).map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Chlorinated Water Source</Label>
              <p className="text-xs text-muted-foreground">Toggle if your farm uses chlorinated water</p>
            </div>
            <Switch checked={waterSourceChlorinated} onCheckedChange={setWaterSourceChlorinated} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="low-crate-crates">Egg Low Inventory Warning Threshold (Crates)</Label>
            <Input
              id="low-crate-crates"
              type="number"
              min="1"
              value={eggLowInventoryCrates}
              onChange={e => setEggLowInventoryCrates(e.target.value)}
              placeholder="5"
            />
          </div>

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

      {/* Houses Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-primary" /> Poultry Houses
            </CardTitle>
            <CardDescription>Manage and allocate your farm houses</CardDescription>
          </div>
          <Button size="sm" variant="outline" className="rounded-full gap-1" onClick={openAddHouse}>
            <Plus className="h-3.5 w-3.5" /> Add House
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {houses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No houses configured yet.</p>
          ) : (
            <div className="space-y-2">
              {houses.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 border rounded-xl bg-card">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {h.name}
                      {h.occupied_by_batch_id && (
                        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">Occupied</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Capacity: {h.capacity.toLocaleString()} birds</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditHouse(h)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => confirmDeleteHouse(h.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit House Dialog */}
      <Dialog open={showHouseDialog} onOpenChange={setShowHouseDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingHouse ? 'Edit House' : 'Add House'}</DialogTitle>
            <DialogDescription>Specify the house name and bird capacity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="house-name-input">House Name / Label</Label>
              <Input id="house-name-input" value={houseName} onChange={e => setHouseName(e.target.value)} placeholder="e.g. House 1" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="house-capacity-input">Max Capacity (Birds)</Label>
              <Input id="house-capacity-input" type="number" value={houseCapacity} onChange={e => setHouseCapacity(e.target.value)} placeholder="500" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowHouseDialog(false)} className="rounded-full">Cancel</Button>
            <Button onClick={saveHouse} disabled={houseSaving} className="rounded-full">
              {houseSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save House
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
