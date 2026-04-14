import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Check, Info, Loader2, Plus, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/useAppStore';
import { BatchContextCard } from './BatchContextCard';
import { IngredientPicker } from './IngredientPicker';
import { INGREDIENTS, SAFETY_RULES, getCompulsorySupplements, type Ingredient, type FeedPhase } from '@/lib/feed-data';
import { optimizeFormulation } from '@/lib/feed-optimizer';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

interface SelectedIngredient {
  ingredient: Ingredient;
  quantityKg: number;
  unitPrice: number;
  autoAdded?: boolean;
}

interface CustomFormulationProps {
  batch: Batch;
  phase: FeedPhase | undefined;
  week: number;
  farmId: string;
  onDone: () => void;
}

type Approach = 'quick' | 'flexible' | 'free';

export function CustomFormulation({ batch, phase, week, farmId, onDone }: CustomFormulationProps) {
  const { currency } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [approach, setApproach] = useState<Approach>('quick');
  const [bagsCount, setBagsCount] = useState('1');
  const [bagSize, setBagSize] = useState('50');
  const [selected, setSelected] = useState<SelectedIngredient[]>([]);
  const [pickerCategory, setPickerCategory] = useState<'energy' | 'protein' | 'calcium' | 'supplement' | null>(null);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);

  const totalKg = (parseInt(bagsCount) || 0) * (parseInt(bagSize) || 0);
  const usedKg = selected.reduce((sum, s) => sum + s.quantityKg, 0);
  const remainingKg = totalKg - usedKg;
  const usedPct = totalKg > 0 ? Math.min((usedKg / totalKg) * 100, 100) : 0;
  const totalCost = selected.reduce((sum, s) => sum + s.quantityKg * s.unitPrice, 0);

  const mask = (v: string) => costPrivacyEnabled ? '••••' : v;

  // Nutrition analysis
  const nutrition = useMemo(() => {
    if (usedKg === 0) return { protein: 0, energy: 0, calcium: 0 };
    return {
      protein: selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.proteinPct, 0),
      energy: selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.energyKcal, 0),
      calcium: selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.calciumPct, 0),
    };
  }, [selected, usedKg]);

  // Safety warnings
  const selectedNames = selected.map(s => s.ingredient.name);
  const warnings = SAFETY_RULES.map(r => r.check(batch.species, selectedNames)).filter(Boolean);

  // Auto-add compulsory supplements
  const handleAddIngredient = (ingredient: Ingredient, quantityKg: number, unitPrice: number) => {
    // For calcium — replace existing (single-select)
    if (ingredient.category === 'calcium') {
      setSelected(prev => [
        ...prev.filter(s => s.ingredient.category !== 'calcium'),
        { ingredient, quantityKg, unitPrice },
      ]);
    } else {
      setSelected(prev => [...prev, { ingredient, quantityKg, unitPrice }]);
    }

    // Check for compulsory supplements after adding
    setTimeout(() => {
      const names = [...selectedNames, ingredient.name];
      const compulsory = getCompulsorySupplements(batch.species, names);
      setSelected(prev => {
        const existing = prev.map(s => s.ingredient.name);
        const toAdd = compulsory.filter(c => !existing.includes(c.name));
        return [...prev, ...toAdd.map(c => ({ ingredient: c, quantityKg: 0, unitPrice: c.defaultPricePerKg, autoAdded: true }))];
      });
    }, 0);
  };

  const removeIngredient = (name: string) => {
    const ing = selected.find(s => s.ingredient.name === name);
    if (ing?.autoAdded) {
      toast.error('This supplement is compulsory and cannot be removed');
      return;
    }
    setSelected(prev => prev.filter(s => s.ingredient.name !== name));
  };

  const updateIngredient = (name: string, field: 'quantityKg' | 'unitPrice', value: number) => {
    setSelected(prev => prev.map(s => s.ingredient.name === name ? { ...s, [field]: value } : s));
  };

  // LP Optimization (Quick Recipe approach)
  const handleOptimize = () => {
    if (!phase) { toast.error('Phase not determined'); return; }
    if (selected.length === 0) { toast.error('Select at least one ingredient'); return; }

    setOptimizing(true);
    setTimeout(() => {
      const result = optimizeFormulation(
        selected.map(s => ({ ingredient: s.ingredient, unitPrice: s.unitPrice })),
        totalKg,
        phase
      );

      if (result.success) {
        setSelected(result.ingredients.map(r => ({
          ingredient: r.ingredient,
          quantityKg: r.quantityKg,
          unitPrice: r.unitPrice,
          autoAdded: selected.find(s => s.ingredient.name === r.ingredient.name)?.autoAdded,
        })));
        setOptimized(true);
        toast.success('Recipe optimized — cost minimized while meeting nutritional targets');
      } else {
        toast.error(result.message || 'Optimization failed');
      }
      setOptimizing(false);
    }, 800); // small delay for UX
  };

  const handleSave = async () => {
    if (selected.length === 0) { toast.error('Select at least one ingredient'); return; }
    if (approach !== 'free' && selected.some(s => s.quantityKg <= 0)) {
      toast.error('All ingredients must have quantity > 0');
      return;
    }

    setSaving(true);
    const { data: formulation, error } = await supabase.from('feed_formulations').insert({
      farm_id: farmId,
      batch_id: batch.id,
      species: batch.species,
      phase: phase?.name.toLowerCase() ?? 'unknown',
      population: batch.current_population,
      bags_count: parseInt(bagsCount) || 1,
      bag_size_kg: parseInt(bagSize) || 50,
      total_kg: totalKg,
      formulation_type: approach === 'quick' ? 'optimized' : approach === 'flexible' ? 'guided' : 'free',
    }).select('id').single();

    if (error) { toast.error(error.message); setSaving(false); return; }

    await supabase.from('feed_ingredients').insert(
      selected.filter(s => s.quantityKg > 0).map(s => ({
        formulation_id: formulation.id,
        category: s.ingredient.category,
        name: s.ingredient.name,
        quantity_kg: s.quantityKg,
        unit_price: s.unitPrice,
        total_cost: s.quantityKg * s.unitPrice,
      }))
    );

    // Auto-create expense for intensive; prompt for semi-intensive
    const isIntensive = batch.production_system === 'intensive';
    if (totalCost > 0 && isIntensive) {
      await supabase.from('expenses').insert({
        farm_id: farmId,
        batch_id: batch.id,
        category: 'feed',
        description: `Custom feed (${approach}): ${batch.species} ${phase?.name ?? ''} — ${totalKg}kg`,
        amount: totalCost,
        source: 'feed_formulation',
        source_ref: formulation.id,
      });
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'feed_formulation',
      description: `Created custom ${approach} formulation — ${totalKg}kg for ${batch.name}`,
    });

    if (!isIntensive && totalCost > 0) {
      toast.success('Formulation saved! Remember to record the expense manually in Finance.');
    } else {
      toast.success('Formulation saved & expense auto-created!');
    }
    setSaving(false);
    onDone();
  };

  const categories: { key: 'energy' | 'protein' | 'calcium' | 'supplement'; label: string; hint: string }[] = [
    { key: 'energy', label: 'Energy Sources', hint: 'Multiple allowed' },
    { key: 'protein', label: 'Protein Sources', hint: 'Primary protein required first' },
    { key: 'calcium', label: 'Calcium Source', hint: 'Only 1 allowed — replaces existing' },
    { key: 'supplement', label: 'Supplements', hint: 'Compulsory ones auto-added' },
  ];

  return (
    <div className="space-y-4">
      <BatchContextCard batch={batch} phase={phase} week={week} />

      {/* Approach tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'quick' as Approach, label: 'Quick Recipe (LP Optimize)', desc: 'System minimizes cost' },
          { key: 'flexible' as Approach, label: 'Flexible Mix (Guided)', desc: 'You set quantities, system validates' },
          { key: 'free' as Approach, label: 'Free Mix (Warnings Only)', desc: 'Full control, warnings only' },
        ]).map(a => (
          <Button
            key={a.key}
            variant={approach === a.key ? 'default' : 'outline'}
            className="rounded-full text-xs"
            onClick={() => { setApproach(a.key); setOptimized(false); }}
          >
            {a.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Planning target */}
          <Card>
            <CardHeader><CardTitle className="text-base">Planning Target</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Number of Bags</Label>
                  <Input type="number" min="1" value={bagsCount} onChange={e => setBagsCount(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bag Size (kg)</Label>
                  <Input type="number" min="1" value={bagSize} onChange={e => setBagSize(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Target Quantity</Label>
                  <Input value={`${totalKg} kg`} readOnly className="bg-muted text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Used: {usedKg.toFixed(1)} kg</span>
                  <span className={remainingKg < 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {remainingKg < 0 ? `Over by ${Math.abs(remainingKg).toFixed(1)} kg` : `Remaining: ${remainingKg.toFixed(1)} kg`}
                  </span>
                </div>
                <Progress value={usedPct} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Ingredient sections */}
          {categories.map(cat => {
            const catItems = selected.filter(s => s.ingredient.category === cat.key);
            return (
              <Card key={cat.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{cat.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">{cat.hint}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {catItems.map(item => (
                    <div key={item.ingredient.name} className="p-3 rounded-lg bg-muted/30 border space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{item.ingredient.name}</span>
                          {item.autoAdded && <Badge variant="secondary" className="text-[10px]">AUTO-ADDED</Badge>}
                        </div>
                        {!item.autoAdded && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeIngredient(item.ingredient.name)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {approach !== 'quick' || !optimized ? (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">Qty (kg)</Label>
                            <Input
                              type="number" min="0" step="0.5"
                              value={item.quantityKg || ''}
                              onChange={e => updateIngredient(item.ingredient.name, 'quantityKg', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                              disabled={approach === 'quick'}
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">Price/kg (GH₵)</Label>
                            <Input
                              type="number" min="0" step="0.1"
                              value={item.unitPrice || ''}
                              onChange={e => updateIngredient(item.ingredient.name, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">Subtotal</Label>
                            <p className="h-8 flex items-center text-sm font-medium">
                              {mask(`GH₵${(item.quantityKg * item.unitPrice).toFixed(2)}`)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm">
                          <span>{item.quantityKg.toFixed(1)} kg ({totalKg > 0 ? ((item.quantityKg / totalKg) * 100).toFixed(0) : 0}%)</span>
                          <span className="font-medium">{mask(`GH₵${(item.quantityKg * item.unitPrice).toFixed(2)}`)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full rounded-lg border-dashed gap-2 text-muted-foreground hover:text-primary hover:border-primary"
                    onClick={() => setPickerCategory(cat.key)}
                  >
                    <Plus className="h-4 w-4" /> Add {cat.label.replace('Sources', 'Source').replace('Supplements', 'Supplement')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Nutrition */}
          <Card>
            <CardHeader><CardTitle className="text-base">Nutrition Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: 'Protein', value: nutrition.protein, target: phase?.proteinPct ?? 0, unit: '%' },
                { label: 'Energy', value: nutrition.energy, target: phase?.energyKcal ?? 0, unit: ' kcal' },
                { label: 'Calcium', value: nutrition.calcium, target: phase?.calciumPct ?? 0, unit: '%' },
              ].map(n => (
                <div key={n.label}>
                  <div className="flex justify-between mb-1">
                    <span>{n.label}</span>
                    <span className="font-semibold">{n.label === 'Energy' ? n.value.toFixed(0) : n.value.toFixed(1)}{n.unit}</span>
                  </div>
                  {n.target > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Progress value={Math.min((n.value / n.target) * 100, 100)} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground">Target: {n.label === 'Energy' ? n.target : n.target}{n.unit}</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cost */}
          <Card>
            <CardHeader><CardTitle className="text-base">Cost Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {selected.filter(s => s.quantityKg > 0).map(s => (
                <div key={s.ingredient.name} className="flex justify-between">
                  <span className="truncate max-w-[140px]">{s.ingredient.name}</span>
                  <span>{mask(`GH₵${(s.quantityKg * s.unitPrice).toFixed(2)}`)}</span>
                </div>
              ))}
              {selected.some(s => s.quantityKg > 0) && (
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{mask(`GH₵${totalCost.toFixed(2)}`)}</span>
                </div>
              )}
              {totalKg > 0 && totalCost > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Per kg</span>
                  <span>{mask(`GH₵${(totalCost / totalKg).toFixed(2)}`)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safety */}
          {warnings.length > 0 && (
            <Card className="border-yellow-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" /> Safety Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    {w?.warning ? <AlertTriangle className="h-3 w-3 text-yellow-600 shrink-0 mt-0.5" /> : <Info className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />}
                    <span>{w?.message}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {approach === 'quick' && !optimized && (
              <Button
                className="w-full rounded-full gap-1.5"
                onClick={handleOptimize}
                disabled={optimizing || selected.length === 0}
              >
                {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Optimize Recipe</>}
              </Button>
            )}
            {(approach !== 'quick' || optimized) && (
              <Button
                className="w-full rounded-full gap-1.5"
                onClick={handleSave}
                disabled={saving || selected.length === 0}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Confirm Formulation</>}
              </Button>
            )}
            {optimized && approach === 'quick' && (
              <Button variant="outline" className="w-full rounded-full" onClick={() => setOptimized(false)}>
                ← Adjust Ingredients
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Ingredient picker dialog */}
      {pickerCategory && (
        <IngredientPicker
          open={!!pickerCategory}
          onClose={() => setPickerCategory(null)}
          category={pickerCategory}
          ingredients={INGREDIENTS}
          species={batch.species}
          alreadySelected={selectedNames}
          singleSelect={pickerCategory === 'calcium'}
          onSelect={handleAddIngredient}
        />
      )}
    </div>
  );
}
