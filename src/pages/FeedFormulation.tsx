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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, AlertTriangle, Check, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { FEED_PHASES, INGREDIENTS, SAFETY_RULES, getCurrentPhase, type Ingredient } from '@/lib/feed-data';
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
  const [batchId, setBatchId] = useState('none');
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

  const totalKg = (parseInt(bagsCount) || 0) * (parseInt(bagSize) || 0);
  const usedKg = selected.reduce((sum, s) => sum + s.quantityKg, 0);
  const remainingKg = totalKg - usedKg;
  const usedPct = totalKg > 0 ? Math.min((usedKg / totalKg) * 100, 100) : 0;

  const totalCost = selected.reduce((sum, s) => sum + s.quantityKg * s.unitPrice, 0);

  const weightedProtein = usedKg > 0 ? selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.proteinPct, 0) : 0;
  const weightedEnergy = usedKg > 0 ? selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.energyKcal, 0) : 0;
  const weightedCalcium = usedKg > 0 ? selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.calciumPct, 0) : 0;

  // Get target values for this phase
  const phases = FEED_PHASES[species] ?? [];
  const targetPhase = phases.find(p => p.name.toLowerCase() === phase);

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
    if (!farmId || selected.length === 0) {
      toast.error('Select at least one ingredient');
      return;
    }
    if (selected.some(s => s.quantityKg <= 0)) {
      toast.error('All selected ingredients must have a quantity > 0');
      return;
    }
    if (remainingKg < -0.1) {
      toast.error(`Total ingredient weight (${usedKg.toFixed(1)} kg) exceeds target (${totalKg} kg)`);
      return;
    }

    setSubmitting(true);
    const resolvedBatchId = batchId !== 'none' ? batchId : null;

    const { data: formulation, error } = await supabase.from('feed_formulations').insert({
      farm_id: farmId,
      batch_id: resolvedBatchId,
      species,
      phase,
      population: batches.find(b => b.id === resolvedBatchId)?.current_population ?? 0,
      bags_count: parseInt(bagsCount) || 1,
      bag_size_kg: parseInt(bagSize) || 50,
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

    // Log expense if cost > 0
    if (totalCost > 0) {
      await supabase.from('expenses').insert({
        farm_id: farmId,
        batch_id: resolvedBatchId,
        category: 'feed',
        description: `Feed formulation: ${species} ${phase} — ${totalKg}kg`,
        amount: totalCost,
        source: 'feed_formulation',
        source_ref: formulation.id,
      });
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: resolvedBatchId,
      event_type: 'feed_formulation',
      description: `Created ${species} ${phase} feed formulation — ${totalKg}kg`,
    });

    toast.success('Formulation saved!');
    navigate('/feed');
  };

  const mask = (v: string) => costPrivacyEnabled ? '••••' : v;

  const categories = ['energy', 'protein', 'calcium', 'supplement'] as const;
  const categoryLabels = { energy: 'Energy Sources', protein: 'Protein Sources', calcium: 'Calcium Sources', supplement: 'Supplements' };

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/feed')} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Feed Formulation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Inputs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Planning target */}
          <Card>
            <CardHeader><CardTitle className="text-base">Planning Target</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Species</Label>
                  <Select value={species} onValueChange={v => {
                    setSpecies(v);
                    const firstPhase = FEED_PHASES[v]?.[0];
                    setPhase(firstPhase?.name.toLowerCase() ?? 'starter');
                  }}>
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
                      {phases.map(p => (
                        <SelectItem key={p.name} value={p.name.toLowerCase()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Number of Bags</Label>
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
                      <SelectItem value="none">None</SelectItem>
                      {batches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name} ({b.current_population} birds)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Weight progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    Target: <span className="text-primary">{totalKg} kg</span>
                  </span>
                  <span className={remainingKg < 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {remainingKg < 0 ? `Over by ${Math.abs(remainingKg).toFixed(1)} kg` : `Remaining: ${remainingKg.toFixed(1)} kg`}
                  </span>
                </div>
                <Progress value={usedPct} className="h-2" />
                <p className="text-xs text-muted-foreground">Used: {usedKg.toFixed(1)} kg / {totalKg} kg</p>
              </div>
            </CardContent>
          </Card>

          {/* Ingredient categories */}
          {categories.map(cat => {
            const catIngredients = INGREDIENTS.filter(i => i.category === cat);
            return (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{categoryLabels[cat]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {catIngredients.map(ingredient => {
                    const sel = selected.find(s => s.ingredient.name === ingredient.name);
                    return (
                      <div key={ingredient.name} className="space-y-1">
                        <div className="flex items-center gap-3 text-sm">
                          <Checkbox
                            checked={!!sel}
                            onCheckedChange={() => toggleIngredient(ingredient)}
                          />
                          <span className="flex-1 min-w-0 truncate">{ingredient.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            CP:{ingredient.proteinPct}% E:{ingredient.energyKcal}
                          </span>
                        </div>
                        {sel && (
                          <div className="ml-8 flex gap-2">
                            <div className="flex-1 space-y-0.5">
                              <Label className="text-xs">Qty (kg)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={sel.quantityKg || ''}
                                onChange={e => updateSelected(ingredient.name, 'quantityKg', parseFloat(e.target.value) || 0)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <Label className="text-xs">Price/kg (₵)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={sel.unitPrice || ''}
                                onChange={e => updateSelected(ingredient.name, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <Label className="text-xs">Subtotal</Label>
                              <p className="h-8 flex items-center text-sm font-medium">
                                {mask(`₵${(sel.quantityKg * sel.unitPrice).toFixed(2)}`)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right: Analysis sidebar */}
        <div className="space-y-4">
          {/* Nutrition analysis */}
          <Card>
            <CardHeader><CardTitle className="text-base">Nutrition Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Protein</span>
                  <span className="font-semibold">{weightedProtein.toFixed(1)}%</span>
                </div>
                {targetPhase && (
                  <div className="flex items-center gap-1.5">
                    <Progress value={Math.min((weightedProtein / targetPhase.proteinPct) * 100, 100)} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">Target: {targetPhase.proteinPct}%</span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Energy</span>
                  <span className="font-semibold">{weightedEnergy.toFixed(0)} kcal</span>
                </div>
                {targetPhase && (
                  <div className="flex items-center gap-1.5">
                    <Progress value={Math.min((weightedEnergy / targetPhase.energyKcal) * 100, 100)} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">Target: {targetPhase.energyKcal}</span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Calcium</span>
                  <span className="font-semibold">{weightedCalcium.toFixed(2)}%</span>
                </div>
                {targetPhase && (
                  <div className="flex items-center gap-1.5">
                    <Progress value={Math.min((weightedCalcium / targetPhase.calciumPct) * 100, 100)} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">Target: {targetPhase.calciumPct}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cost breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base">Cost Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {selected.filter(s => s.quantityKg > 0).map(s => (
                <div key={s.ingredient.name} className="flex justify-between">
                  <span className="truncate max-w-[150px]">{s.ingredient.name}</span>
                  <span>{mask(`₵${(s.quantityKg * s.unitPrice).toFixed(2)}`)}</span>
                </div>
              ))}
              {selected.length > 0 && (
                <>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{mask(`₵${totalCost.toFixed(2)}`)}</span>
                  </div>
                  {totalKg > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Per kg</span>
                      <span>{mask(`₵${(totalCost / totalKg).toFixed(2)}`)}</span>
                    </div>
                  )}
                  {totalKg > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Per bag ({bagSize}kg)</span>
                      <span>{mask(`₵${(totalCost / (parseInt(bagsCount) || 1)).toFixed(2)}`)}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Safety alerts */}
          {warnings.length > 0 && (
            <Card className="border-yellow-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" /> Safety Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {w?.warning ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <span className={w?.warning ? 'text-yellow-700' : 'text-muted-foreground'}>{w?.message}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={submitting || selected.length === 0}
            className="w-full rounded-full gap-1.5"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save Formulation</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
