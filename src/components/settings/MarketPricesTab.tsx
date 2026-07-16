import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, DollarSign, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { isOffline, queueWrite } from '@/lib/sync';
import type { Database } from '@/integrations/supabase/types';

type Farm = Database['public']['Tables']['farms']['Row'];

interface MarketPricesTabProps {
  farm: Farm | null;
  configOverrides: Array<{ id: string; key: string; value: string }>;
  setConfigOverrides: React.Dispatch<React.SetStateAction<Array<{ id: string; key: string; value: string }>>>;
}

export default function MarketPricesTab({
  farm,
  configOverrides,
  setConfigOverrides,
}: MarketPricesTabProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [overridesSaving, setOverridesSaving] = useState(false);

  const saveOverride = async () => {
    if (!farm) return;
    const cleanKey = newKey.trim();
    const cleanVal = newValue.trim();

    if (!cleanKey || !cleanVal) {
      toast.error('Key and value cannot be empty');
      return;
    }

    // Safety-critical key block list (Rule 27)
    const lowerKey = cleanKey.toLowerCase();
    const safetyKeywords = ['safety', 'sys', 'admin', 'system', 'niacin', 'requirement', 'baseline', 'limit', 'bound'];
    const isSafetyCritical = safetyKeywords.some(keyword => lowerKey.includes(keyword));

    if (isSafetyCritical) {
      toast.error('Code: 422. SAFETY_KEY_NOT_OVERRIDABLE - Cannot override safety, system or administrative configuration parameters.', {
        icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
        duration: 5000,
      });
      return;
    }

    setOverridesSaving(true);

    if (isOffline()) {
      const tempId = crypto.randomUUID();
      await queueWrite('config_overrides', 'insert', tempId, {
        farm_id: farm.id,
        key: cleanKey,
        value: cleanVal,
      } as unknown as Record<string, unknown>);
      setConfigOverrides(prev => {
        const idx = prev.findIndex(c => c.key === cleanKey);
        if (idx !== -1) {
          return prev.map((c, i) => i === idx ? { ...c, value: cleanVal } : c);
        } else {
          return [...prev, { id: tempId, key: cleanKey, value: cleanVal }];
        }
      });
      setOverridesSaving(false);
      toast.success(`Config override '${cleanKey}' saved (offline — will sync)`);
      setNewKey('');
      setNewValue('');
      return;
    }

    const { data, error } = await supabase.from('config_overrides').upsert({
      farm_id: farm.id,
      key: cleanKey,
      value: cleanVal,
    }, { onConflict: 'farm_id,key' }).select().single();

    setOverridesSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Config override '${cleanKey}' saved successfully!`);
      setConfigOverrides(prev => {
        const idx = prev.findIndex(c => c.key === cleanKey);
        if (idx !== -1) {
          return prev.map((c, i) => i === idx ? { ...c, value: cleanVal } : c);
        } else {
          return [...prev, data];
        }
      });
      setNewKey('');
      setNewValue('');
    }
  };

  const deleteOverride = async (id: string, key: string) => {
    if (!farm) return;
    const { error } = await supabase.from('config_overrides').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Config override '${key}' deleted`);
      setConfigOverrides(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Overview notice */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-primary">Market Prices Overrides (L3 Runtime)</p>
            <p className="text-xs text-muted-foreground">
              Define ingredient unit prices (e.g. Maize, Soybean) to dynamically adapt feed optimizer calculations. Safety parameters are fully locked and cannot be overridden.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add new override */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Add Override
          </CardTitle>
          <CardDescription>Configure custom key-value pairs for market overrides</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="override-key">Config Key</Label>
              <Input
                id="override-key"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="e.g. maize_price_per_kg"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="override-value">Value (Decimal)</Label>
              <Input
                id="override-value"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="e.g. 4.5"
              />
            </div>
          </div>
          <Button size="sm" onClick={saveOverride} disabled={overridesSaving} className="rounded-full">
            {overridesSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save Price Override
          </Button>
        </CardContent>
      </Card>

      {/* Existing list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Active Price overrides
          </CardTitle>
          <CardDescription>Current runtime price lists active on your farm</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {configOverrides.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No price overrides active. Standard defaults are loaded.</p>
          ) : (
            <div className="space-y-2">
              {configOverrides.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-xl bg-card">
                  <div>
                    <p className="text-sm font-semibold text-foreground font-mono">{c.key}</p>
                    <p className="text-xs text-muted-foreground">Value: {c.value}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => deleteOverride(c.id, c.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
