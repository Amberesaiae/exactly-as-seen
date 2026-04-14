import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FEED_PHASES, INGREDIENTS, SAFETY_RULES, type Ingredient } from '@/lib/feed-data';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

interface SelectedIngredient {
  ingredient: Ingredient;
  quantityKg: number;
  unitPrice: number;
}

export default function FeedFormulation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { costPrivacyEnabled } = useAppStore();
  const [farmId, setFarmId] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [species, setSpecies] = useState('broiler');
  const [phase, setPhase] = useState('starter');
  const [batchId, setBatchId] = useState('');
  const [bagsCount, setBagsCount] = useState('1');
  const [bagSize, setBagSize] = useState('50');
  const [selected, setSelected] = useState<SelectedIngredient[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFarmId(data.id);
        supabase.from('batches').select('*').eq('farm_id', data.id).eq('status', 'active').then(({ data: b }) => setBatches(b ?? []));
      }
    });
  }, [user]);

  const totalKg = parseInt(bagsCount) * parseInt(bagSize) || 0;
  const usedKg = selected.reduce((sum, s) => sum + s.quantityKg, 0);
  const remainingKg = totalKg - usedKg;

  const totalCost = selected.reduce((sum, s) => sum + s.quantityKg * s.unitPrice, 0);

  const weightedProtein = totalKg > 0 ? selected.reduce((sum, s) => sum + (s.quantityKg / totalKg) * s.ingredient.proteinPct, 0) : 0;
  const weightedEnergy = totalKg > 0 ? selected.reduce((sum, s) => sum + (s.quantityKg / totalKg) * s.ingredient.energyKcal, 0) : 0;
  const weightedCalcium = totalKg > 0 ? selected.reduce((sum, s) => sum + (s.quantityKg / totalKg) * s.ingredient.calciumPct, 0) : 0;

  const selectedNames = selected.map(s => s.ingredient.name);
  const warnings = SAFETY_RULES.map(rule => rule.check(species, selectedNames)).filter(Boolean);

  const toggleIngredient = (ingredient: Ingredient) => {
    const exists = selected.find(s => s.ingredient.name === ingredient.name);
    if (exists) {
      setSelected(selected.filter(s => s.ingredient.name !== ingredient.name));
    } else {
      setSelected([...selected, { ingredient, quantityKg: 0, unitPrice: ingredient.defaultPricePerKg }]);
    }
  };

  const updateSelected = (name: string, field: 'quantityKg' | 'unitPrice', value: number) => {
    setSelected(selected.map(s => s.ingredient.name === name ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    if (!farmId || selected.length === 0) return;
    setSubmitting(true);

    const { data: formulation, error } = await supabase.from('feed_formulations').insert({
      farm_id: farmId,
      batch_id: batchId || null,
      species,
      phase,
      population: batches.find(b => b.id === batchId)?.current_population ?? 0,
      bags_count: parseInt(bagsCount),
      bag_size_kg: parseInt(bagSize),
      total_kg: totalKg,
      formulation_type: 'guided',
    }).select('id').single();

    if (error) { toast.error(error.message); setSubmitting(false); return; }

    const { error: ingError } = await supabase.from('feed_ingredients').insert(
      selected.map(s => ({
        formulation_id: formulation.id,
        category: s.ingredient.category,
        name: s.ingredient.name,
        quantity_kg: s.quantityKg,
        unit_price: s.unitPrice,
        total_cost: s.quantityKg * s.unitPrice,
      }))
    );

    if (ingError) { toast.error(ingError.message); setSubmitting(false); return; }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batchId || null,
      event_type: 'feed_formulation',
      description: `Created ${species} ${phase} feed formulation — ${totalKg}kg`,
    });

    toast.success('Formulation saved!');
    navigate('/feed');
  };

  const phases = FEED_PHASES[species] ?? [];
  const mask = (v: string) => costPrivacyEnabled ? '****' : v;

  const categories = ['energy', 'protein', 'calcium', 'supplement'] as const;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/feed')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold text-foreground">Feed Formulation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Planning Target</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Species</Label>
                  <Select value={species} onValueChange={v => { setSpecies(v); setPhase(FEED_PHASES[v]?.[0]?.name.toLowerCase() ?? 'starter'); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broiler">Broiler</SelectItem>
                      <SelectItem value="layer">Layer</SelectItem>
                      <SelectItem value="duck">Duck</SelectItem>
                      <SelectItem value="turkey">Turkey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Phase</Label>
                  <Select value={phase} onValueChange={setPhase}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {phases.map(p => <SelectItem key={p.name} value={p.name.toLowerCase()}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Bags</Label>
                  <Input type="number" min="1" value={bagsCount} onChange={e => setBagsCount(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Bag Size (kg)</Label>
                  <Input type="number" min="1" value={bagSize} onChange={e => setBagSize(e.target.value)} />
                </div>
              </div>
              {batches.length > 0 && (
                <div className="space-y-1">
                  <Label>Link to Batch (optional)</Label>
                  <Select value={batchId} onValueChange={setBatchId}>
                    <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <p className="text-sm font-medium">Total: <span className="text-primary">{totalKg} kg</span> | Used: {usedKg.toFixed(1)} kg | Remaining: {remainingKg.toFixed(1)} kg</p>
            </CardContent>
          </Card>

          {categories.map(cat => (
            <Card key={cat}>
              <CardHeader><CardTitle className="text-base capitalize">{cat} Sources</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {INGREDIENTS.filter(i => i.category === cat).map(ingredient => {
                  const sel = selected.find(s => s.ingredient.name === ingredient.name);
                  return (
                    <div key={ingredient.name} className="flex items-center gap-3 text-sm">
                      <Checkbox checked={!!sel} onCheckedChange={() => toggleIngredient(ingredient)} />
                      <span className="flex-1 min-w-0 truncate">{ingredient.name}</span>
                      {sel && (
                        <>
                          <Input type="number" min="0" step="0.5" value={sel.quantityKg} onChange={e => updateSelected(ingredient.name, 'quantityKg', parseFloat(e.target.value) || 0)} className="w-20 h-8 text-xs" placeholder="kg" />
                          <Input type="number" min="0" step="0.1" value={sel.unitPrice} onChange={e => updateSelected(ingredient.name, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-20 h-8 text-xs" placeholder="₵/kg" />
                        </>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Nutrition Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Protein</span><span className="font-semibold">{weightedProtein.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>Energy</span><span className="font-semibold">{weightedEnergy.toFixed(0)} kcal</span></div>
              <div className="flex justify-between"><span>Calcium</span><span className="font-semibold">{weightedCalcium.toFixed(2)}%</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Cost</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Total Cost</span><span className="font-semibold">{mask(`GHS ${totalCost.toFixed(2)}`)}</span></div>
              {totalKg > 0 && <div className="flex justify-between"><span>Cost/kg</span><span className="font-semibold">{mask(`GHS ${(totalCost / totalKg).toFixed(2)}`)}</span></div>}
            </CardContent>
          </Card>

          {warnings.length > 0 && (
            <Card className="border-warning">
              <CardHeader><CardTitle className="text-base text-warning flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Safety Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {warnings.map((w, i) => (
                  <p key={i} className="text-sm text-warning">{w?.message}</p>
                ))}
              </CardContent>
            </Card>
          )}

          <Button onClick={handleSave} disabled={submitting || selected.length === 0} className="w-full rounded-full gap-1.5">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save Formulation</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
