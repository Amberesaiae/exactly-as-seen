import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Sparkles, X, Plus, Lightbulb, AlertTriangle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { WeightCard } from './formulation/WeightCard';
import { SolverAdviceCard } from './formulation/SolverAdviceCard';
import { SafetyAlertsCard } from './formulation/SafetyAlertsCard';
import { NutrientComplianceCard } from './formulation/NutrientComplianceCard';
import { CostAnalysisCard } from './formulation/CostAnalysisCard';
import { BatchContextCard } from './BatchContextCard';
import { IngredientPicker } from './IngredientPicker';
import { BatchLeanTips } from './formulation/BatchLeanTips';
import { type FeedPhase, normalizeIngredient } from '@/lib/feed-data';
import { useCustomFormulationSolver } from './hooks/useCustomFormulationSolver';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { autoCreateExpense, autoDeductStock } from '@/lib/synergy';
import { isIntensiveSystem } from '@/lib/production-system';
import { isOffline, queueWrite } from '@/lib/sync';
import type { Database } from '@/integrations/supabase/types';

type FeedIngredientInsert = Database['public']['Tables']['feed_ingredients']['Insert'];
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PrivacyMask } from '@/components/ui/PrivacyMask';

interface CustomFormulationProps {
  batch: any;
  phase: FeedPhase | undefined;
  week: number;
  farmId: string;
  onDone: () => void;
  targetKg?: number;
  recipes?: any[];
}

type Approach = 'quick' | 'flexible' | 'free';

export function CustomFormulation({ batch, phase, week, farmId, onDone, targetKg, recipes = [] }: CustomFormulationProps) {
  const [approach, setApproach] = useState<Approach>('quick');
  const [bagSize, setBagSize] = useState('50');
  const [bagsCount, setBagsCount] = useState(() => {
    if (targetKg) return Math.ceil(targetKg / 50).toString();
    return '1';
  });
  const [pickerCategory, setPickerCategory] = useState<'energy' | 'protein' | 'calcium' | 'supplement' | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSaveRecipe, setShowSaveRecipe] = useState(false);
  const [recipeName, setRecipeName] = useState('');

  const totalKg = (parseInt(bagsCount) || 0) * (parseInt(bagSize) || 0);

  const {
    selected, setSelected,
    dbIngredients, dbRequirements, stockItems, dbLoading,
    nutrition, preprocessData,
    optimizing, optimized, setOptimized,
    solverStatus, setSolverStatus,
    fallbackReason, solverAdvice,
    handleOptimize, saveAsRecipe
  } = useCustomFormulationSolver(batch, phase, totalKg);

  const loadRecipe = (recipe: any) => {
    const newSelected = recipe.ingredients.map((ri: any) => {
      const ing = dbIngredients.find(i => i.name === ri.name);
      if (!ing) return null;
      return {
        ingredient: {
          id: ing.id, name: ing.name, category: ing.category,
          proteinPct: Number(ing.protein_pct), energyKcal: Number(ing.energy_kcal_per_kg),
          calciumPct: Number(ing.calcium_pct), phosphorusPct: Number(ing.phosphorus_pct),
          lysinePct: Number(ing.lysine_pct), methioninePct: Number(ing.methionine_pct),
          containsGossypol: ing.contains_gossypol, containsAflatoxinRisk: ing.contains_aflatoxin_risk,
          maxSharePct: Number(ing.max_share_pct),
        },
        quantityKg: ri.quantity_kg,
        unitPrice: ri.unit_price
      };
    }).filter(Boolean);

    setSelected(newSelected);
    toast.success(`Loaded recipe: ${recipe.name}`);
  };

  const usedKg = selected.reduce((sum, s) => sum + s.quantityKg, 0);
  const remainingKg = totalKg - usedKg;
  const usedPct = totalKg > 0 ? Math.min((usedKg / totalKg) * 100, 100) : 0;
  const totalCost = selected.reduce((sum, s) => sum + s.quantityKg * s.unitPrice, 0);

  const handleAddIngredient = (ingredient: any, quantityKg: number, unitPrice: number, stockItemId?: string) => {
    setSelected(prev => [...prev, { ingredient, quantityKg, unitPrice, stockItemId }]);
  };

  const removeIngredient = (name: string) => {
    setSelected(prev => prev.filter(s => s.ingredient.name !== name));
  };

  /** Keep number fields editable — parse safely so intermediate typing works. */
  const updateIngredient = (name: string, field: 'quantityKg' | 'unitPrice', raw: string) => {
    const trimmed = raw.trim();
    // Allow empty while typing; treat as 0 for calc until a valid number is entered
    let n = 0;
    if (trimmed !== '' && trimmed !== '.' && trimmed !== '-') {
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) return; // ignore invalid keystrokes (e, ++, etc.)
      n = parsed;
    }
    setSelected(prev => prev.map(s => (s.ingredient.name === name ? { ...s, [field]: n } : s)));
    // Reset optimized lock when user edits so inputs stay visible/editable
    if (optimized) setOptimized(false);
  };

  const qtyDisplay = (n: number) => (n === 0 ? '' : String(n));
  const priceDisplay = (n: number) => (n === 0 ? '' : String(n));

  const addSuggestedIngredient = (suggestId: string) => {
    const ing = dbIngredients.find(i => i.id === suggestId);
    if (!ing) return;
    const qty = suggestId === 'toxin_binder' ? Number((totalKg * 0.005).toFixed(2)) : 0.1;
    handleAddIngredient({
      id: ing.id, name: ing.name, category: ing.category,
      proteinPct: Number(ing.protein_pct), energyKcal: Number(ing.energy_kcal_per_kg),
      calciumPct: Number(ing.calcium_pct), phosphorusPct: Number(ing.phosphorus_pct),
      lysinePct: Number(ing.lysine_pct), methioninePct: Number(ing.methionine_pct),
      containsGossypol: ing.contains_gossypol, containsAflatoxinRisk: ing.contains_aflatoxin_risk,
      maxSharePct: Number(ing.max_share_pct),
    }, qty, Number(ing.price_per_kg || 12));
    toast.success(`Added ${ing.name} to recipe`);
  };

  const handleSave = async () => {
    if (selected.length === 0) { toast.error('Select at least one ingredient'); return; }
    if (approach !== 'free' && selected.some(s => s.quantityKg <= 0)) {
      toast.error('All ingredients must have quantity > 0');
      return;
    }

    setSaving(true);

    if (isOffline()) {
      const tempId = crypto.randomUUID();
      await queueWrite('feed_formulations', 'insert', tempId, {
        farm_id: farmId,
        batch_id: batch.id,
        species: batch.species,
        phase: phase?.name.toLowerCase() ?? 'unknown',
        population: batch.current_population,
        bags_count: parseInt(bagsCount) || 1,
        bag_size_kg: parseInt(bagSize) || 50,
        total_kg: totalKg,
        formulation_type: solverStatus === 'optimal' ? 'optimized' : solverStatus === 'fallback' ? 'guided' : 'free',
      } as unknown as Record<string, unknown>);
      for (const s of selected.filter(s => s.quantityKg > 0)) {
        await queueWrite('feed_ingredients', 'insert', crypto.randomUUID(), {
          formulation_id: tempId,
          category: s.ingredient.category,
          name: s.ingredient.name,
          quantity_kg: s.quantityKg,
          unit_price_pesewas: Math.round(s.unitPrice * 100),
          total_cost_pesewas: Math.round(s.quantityKg * s.unitPrice * 100),
          ...(s.stockItemId ? { stock_item_id: s.stockItemId } : {}),
        } as unknown as Record<string, unknown>);
      }
      toast.success('Formulation saved (offline — will sync)');
      setSaving(false);
      onDone();
      return;
    }

    const { data: formulation, error } = await supabase.from('feed_formulations').insert({
      farm_id: farmId,
      batch_id: batch.id,
      species: batch.species,
      phase: phase?.name.toLowerCase() ?? 'unknown',
      population: batch.current_population,
      bags_count: parseInt(bagsCount) || 1,
      bag_size_kg: parseInt(bagSize) || 50,
      total_kg: totalKg,
      formulation_type: solverStatus === 'optimal' ? 'optimized' : solverStatus === 'fallback' ? 'guided' : 'free',
    }).select('id').single();

    if (error) { toast.error(error.message); setSaving(false); return; }

    await supabase.from('feed_ingredients').insert(
      selected.filter(s => s.quantityKg > 0).map(s => ({
        formulation_id: formulation.id,
        category: s.ingredient.category,
        name: s.ingredient.name,
        quantity_kg: s.quantityKg,
        unit_price_pesewas: Math.round(s.unitPrice * 100),
        total_cost_pesewas: Math.round(s.quantityKg * s.unitPrice * 100),
        ...(s.stockItemId ? { stock_item_id: s.stockItemId } : {}),
      })) as FeedIngredientInsert[]
    );

    const isIntensive = isIntensiveSystem(batch.production_system);
    if (isIntensive) {
      for (const s of selected) {
        if (s.quantityKg > 0) {
          await autoDeductStock({
            farmId, itemName: s.ingredient.name, quantity: s.quantityKg, batchId: batch.id,
            reason: `Feed formulation auto-deduction: ${s.ingredient.name}`, sourceRef: formulation.id
          });
        }
      }
      if (totalCost > 0) {
        await autoCreateExpense({
          farmId, batchId: batch.id, category: 'feed_and_nutrition',
          description: `Custom feed (${approach}): ${batch.species} ${phase?.name ?? ''} — ${totalKg}kg`,
          amount: totalCost, source: 'auto:feed', sourceRef: formulation.id,
        });
      }
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId, batch_id: batch.id, event_type: 'feed_formulation',
      description: `Created custom ${approach} formulation — ${totalKg}kg for ${batch.name}`,
    });

    toast.success('Formulation saved!');
    setSaving(false);
    onDone();
  };

  if (dbLoading) return <div className="space-y-4"><BatchContextCard batch={batch} phase={phase} week={week} /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="space-y-4">
      <BatchContextCard batch={batch} phase={phase} week={week} />

      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['quick', 'flexible', 'free'] as Approach[]).map(a => (
            <Button
              key={a}
              variant={approach === a ? 'default' : 'outline'}
              className="rounded-full text-xs"
              onClick={() => { setApproach(a); setOptimized(false); setSolverStatus('manual'); }}
            >
              {a === 'quick' ? 'Optimal Recipe (LP WASM)' : a === 'flexible' ? 'Flexible Mix' : 'Free Mix'}
            </Button>
          ))}
        </div>
        
        {recipes.length > 0 && (
          <Select onValueChange={(v) => loadRecipe(recipes.find(r => r.id === v))}>
            <SelectTrigger className="w-48 h-8 rounded-full text-xs border-dashed"><SelectValue placeholder="Load from library..." /></SelectTrigger>
            <SelectContent>
              {recipes.filter(r => r.species === batch.species).map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <WeightCard
            bagsCount={bagsCount} setBagsCount={setBagsCount}
            bagSize={bagSize} setBagSize={setBagSize}
            totalKg={totalKg} usedKg={usedKg}
            remainingKg={remainingKg} usedPct={usedPct}
            solverStatus={solverStatus}
          />

          <SolverAdviceCard status={solverStatus} fallbackReason={fallbackReason} advice={solverAdvice} />

          {preprocessData.suggestions.length > 0 && (
            <div className="space-y-2">
              {preprocessData.suggestions.map(s => (
                <div key={s.id} className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-3 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-2.5">
                    <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Lean Logic Suggestion: {s.name}</span>
                      <p className="mt-0.5 text-blue-800 opacity-90">{s.reason}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full h-7 bg-white border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => addSuggestedIngredient(s.id)}>
                    Quick Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          {([
            { key: 'energy', label: 'Energy Grains', hint: 'Grains & energy sources' },
            { key: 'protein', label: 'Protein Meals', hint: 'Fish, soy, groundnut' },
            { key: 'calcium', label: 'Calcium Supplement', hint: 'Recommended: 1 source' },
            { key: 'supplement', label: 'Supplements', hint: 'Premixes, binders, etc.' },
          ] as const).map(cat => (
            <Card key={cat.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{cat.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">{cat.hint}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selected.filter(s => s.ingredient.category === cat.key).map(item => (
                  <div key={item.ingredient.name} className="p-3 rounded-lg bg-muted/30 border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{item.ingredient.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeIngredient(item.ingredient.name)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Quantity (kg)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          inputMode="decimal"
                          value={qtyDisplay(item.quantityKg)}
                          onChange={e => updateIngredient(item.ingredient.name, 'quantityKg', e.target.value)}
                          className="h-8 text-sm"
                          title={approach === 'quick' && !optimized ? 'Optional before Optimize — LP will fill recommended kg' : undefined}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Price per kg (GH₵)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          inputMode="decimal"
                          value={priceDisplay(item.unitPrice)}
                          onChange={e => updateIngredient(item.ingredient.name, 'unitPrice', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Subtotal</Label>
                        <p className="h-8 flex items-center text-sm font-semibold">GH₵ <PrivacyMask value={(item.quantityKg * item.unitPrice).toFixed(2)} /></p>
                      </div>
                    </div>
                    {approach === 'quick' && optimized && (
                      <p className="text-[10px] text-muted-foreground">
                        Optimized — edit qty/price freely, or re-run Optimize.
                      </p>
                    )}
                  </div>
                ))}
                <Button variant="outline" className="w-full rounded-lg border-dashed gap-2 text-muted-foreground hover:text-primary hover:border-primary" onClick={() => setPickerCategory(cat.key)}>
                  <Plus className="h-4 w-4" /> Add {cat.label.replace('Grains', 'Grain').replace('Meals', 'Meal').replace('Supplement', 'source')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <BatchLeanTips batch={batch} targetKg={totalKg} phase={phase} />
          <NutrientComplianceCard nutrition={nutrition} dbRequirements={dbRequirements} phase={phase} />
          <CostAnalysisCard selected={selected} totalCost={totalCost} />
          <SafetyAlertsCard warnings={preprocessData.warnings} />

          {preprocessData.blocked && (
            <Card className="border-red-500 bg-red-50">
              <CardHeader className="pb-2 pt-3 px-3"><CardTitle className="text-xs font-bold flex items-center gap-2 text-red-600 uppercase tracking-wider"><AlertTriangle className="h-3.5 w-3.5" /> Blocked Formulation</CardTitle></CardHeader>
              <CardContent className="space-y-2 pb-3 px-3 text-[11px] text-red-900 font-bold">{preprocessData.blockedReason}</CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {approach === 'quick' && !optimized && (
              <Button className="w-full rounded-full gap-1.5" onClick={handleOptimize} disabled={optimizing || selected.length === 0 || preprocessData.blocked}>
                {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Optimize Formulation</>}
              </Button>
            )}
            {(approach !== 'quick' || optimized) && (
              <>
                <Button className="w-full rounded-full gap-1.5" onClick={handleSave} disabled={saving || selected.length === 0 || preprocessData.blocked}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save & Deduct Stock</>}
                </Button>
                <Button variant="outline" className="w-full rounded-full border-dashed gap-1.5" onClick={() => setShowSaveRecipe(true)} disabled={selected.length === 0}>
                  Save as Reusable Recipe
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {pickerCategory && (
        <IngredientPicker
          open={!!pickerCategory} onClose={() => setPickerCategory(null)}
          category={pickerCategory} species={batch.species}
          alreadySelected={selected.map(s => s.ingredient.name)}
          onSelect={handleAddIngredient}
          ingredients={dbIngredients.map((i) => normalizeIngredient(i))}
          stockItems={stockItems}
        />
      )}

      <Dialog open={showSaveRecipe} onOpenChange={setShowSaveRecipe}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Save to Recipe Library</DialogTitle>
            <DialogDescription>Give this recipe a name to reuse it for future {batch.species} batches.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Recipe Name</Label>
              <Input value={recipeName} onChange={e => setRecipeName(e.target.value)} placeholder="e.g. Broiler Finisher - Home Mix" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveRecipe(false)}>Cancel</Button>
            <Button onClick={() => { saveAsRecipe(recipeName); setShowSaveRecipe(false); setRecipeName(''); }} disabled={!recipeName}>Save Recipe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
