import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Check, Info, Loader2, Plus, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/useAppStore';
import { BatchContextCard } from './BatchContextCard';
import { IngredientPicker } from './IngredientPicker';
import { type FeedPhase } from '@/lib/feed-data';
import { preprocessFormulation } from '@/lib/feed-safety';
import { solveFeedLP } from '@/lib/feed-lp';

interface SelectedIngredient {
  ingredient: {
    id: string;
    name: string;
    category: string;
    proteinPct: number;
    energyKcal: number;
    calciumPct: number;
    phosphorusPct: number;
    lysinePct: number;
    methioninePct: number;
    containsGossypol: boolean;
    containsAflatoxinRisk: boolean;
    maxSharePct: number;
  };
  quantityKg: number;
  unitPrice: number;
  autoAdded?: boolean;
}

interface CustomFormulationProps {
  batch: any;
  phase: FeedPhase | undefined;
  week: number;
  farmId: string;
  onDone: () => void;
  targetKg?: number;
}

type Approach = 'quick' | 'flexible' | 'free';

export function CustomFormulation({ batch, phase, week, farmId, onDone, targetKg }: CustomFormulationProps) {
  const { currency } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [approach, setApproach] = useState<Approach>('quick');
  const [bagSize, setBagSize] = useState('50');
  const [bagsCount, setBagsCount] = useState(() => {
    if (targetKg) {
      return Math.ceil(targetKg / 50).toString();
    }
    return '1';
  });
  const [selected, setSelected] = useState<SelectedIngredient[]>([]);
  const [pickerCategory, setPickerCategory] = useState<'energy' | 'protein' | 'calcium' | 'supplement' | null>(null);

  // Sync bagsCount if targetKg or bagSize changes
  useEffect(() => {
    if (targetKg) {
      const size = parseInt(bagSize) || 50;
      setBagsCount(Math.ceil(targetKg / size).toString());
    }
  }, [targetKg, bagSize]);
  
  // Database reference states
  const [dbIngredients, setDbIngredients] = useState<any[]>([]);
  const [dbRequirements, setDbRequirements] = useState<any | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  // Solver states
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [solverStatus, setSolverStatus] = useState<'optimal' | 'fallback' | 'manual'>('manual');
  const [fallbackReason, setFallbackReason] = useState<string | undefined>(undefined);

  const totalKg = (parseInt(bagsCount) || 0) * (parseInt(bagSize) || 0);
  const usedKg = selected.reduce((sum, s) => sum + s.quantityKg, 0);
  const remainingKg = totalKg - usedKg;
  const usedPct = totalKg > 0 ? Math.min((usedKg / totalKg) * 100, 100) : 0;
  const totalCost = selected.reduce((sum, s) => sum + s.quantityKg * s.unitPrice, 0);
  const plannedDays = targetKg && phase && batch
    ? Math.round((targetKg * 1000) / (phase.feedPerBirdG * batch.current_population))
    : 0;

  const mask = (v: string) => costPrivacyEnabled ? '••••' : v;

  // Load reference tables on mount
  useEffect(() => {
    const load = async () => {
      setDbLoading(true);
      const { data: ingData } = await supabase.from('ingredients').select('*');
      setDbIngredients(ingData ?? []);

      let reqQuery = supabase.from('nutritional_requirements')
        .select('*')
        .eq('species', batch.species)
        .eq('phase', phase?.name.toLowerCase() ?? 'starter');

      if (batch.species === 'duck' && batch.duck_type) {
        reqQuery = reqQuery.eq('duck_type', batch.duck_type);
      } else {
        reqQuery = reqQuery.is('duck_type', null);
      }

      const { data: reqData } = await reqQuery.maybeSingle();
      
      setDbRequirements(reqData || {
        protein_min: phase?.proteinPct ?? 18,
        energy_min: phase?.energyKcal ?? 3000,
        energy_max: (phase?.energyKcal ?? 3000) + 200,
        calcium_min: phase?.calciumPct ?? 0.9,
        calcium_max: (phase?.calciumPct ?? 0.9) + 0.2,
        phosphorus_min: 0.4,
        lysine_min: 0.9,
        methionine_min: 0.4,
      });

      setDbLoading(false);
    };

    load();
  }, [batch.species, batch.duck_type, phase]);

  // Dynamic Toxin Binder (R-FC-1)
  useEffect(() => {
    if (dbIngredients.length === 0 || dbLoading) return;

    // Check if toxin_binder needs to be auto-added or updated
    const hasToxinBinder = selected.some(s => s.ingredient.id === 'toxin_binder');
    const targetToxinBinderKg = Number((totalKg * 0.005).toFixed(2));

    if (!hasToxinBinder) {
      const toxinBinder = dbIngredients.find(i => i.id === 'toxin_binder');
      if (toxinBinder) {
        setSelected(prev => [
          ...prev,
          {
            ingredient: {
              id: toxinBinder.id,
              name: toxinBinder.name,
              category: toxinBinder.category,
              proteinPct: Number(toxinBinder.protein_pct),
              energyKcal: Number(toxinBinder.energy_kcal_per_kg),
              calciumPct: Number(toxinBinder.calcium_pct),
              phosphorusPct: Number(toxinBinder.phosphorus_pct),
              lysinePct: Number(toxinBinder.lysine_pct),
              methioninePct: Number(toxinBinder.methionine_pct),
              containsGossypol: toxinBinder.contains_gossypol,
              containsAflatoxinRisk: toxinBinder.contains_aflatoxin_risk,
              maxSharePct: Number(toxinBinder.max_share_pct),
            },
            quantityKg: targetToxinBinderKg,
            unitPrice: 0.2, // standard seed price / default
            autoAdded: true,
          }
        ]);
      }
    } else {
      setSelected(prev => prev.map(s => {
        if (s.ingredient.id === 'toxin_binder') {
          return { ...s, quantityKg: targetToxinBinderKg, autoAdded: true };
        }
        return s;
      }));
    }
  }, [totalKg, dbIngredients, dbLoading]);

  // Nutrition analysis
  const nutrition = useMemo(() => {
    if (usedKg === 0) return { protein: 0, energy: 0, calcium: 0 };
    return {
      protein: selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.proteinPct, 0),
      energy: selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.energyKcal, 0),
      calcium: selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.calciumPct, 0),
    };
  }, [selected, usedKg]);

  // Run Preprocessor client-side safety alerts
  const preprocessData = useMemo(() => {
    if (dbIngredients.length === 0) return { warnings: [], blocked: false, selected: [], blockedReason: undefined };
    return preprocessFormulation({
      species: batch.species,
      targetKg: totalKg,
      selected: selected.map(s => ({
        ingredient: {
          id: s.ingredient.id,
          name: s.ingredient.name,
          category: s.ingredient.category,
          protein_pct: s.ingredient.proteinPct,
          energy_kcal_per_kg: s.ingredient.energyKcal,
          calcium_pct: s.ingredient.calciumPct,
          phosphorus_pct: s.ingredient.phosphorusPct,
          lysine_pct: s.ingredient.lysinePct,
          methionine_pct: s.ingredient.methioninePct,
          contains_gossypol: s.ingredient.containsGossypol,
          contains_aflatoxin_risk: s.ingredient.containsAflatoxinRisk,
          max_share_pct: s.ingredient.maxSharePct,
        },
        quantityKg: s.quantityKg,
        unitPrice: s.unitPrice,
        autoAdded: s.autoAdded,
      })),
      availableIngredients: dbIngredients,
    });
  }, [selected, totalKg, dbIngredients, batch.species]);

  const handleAddIngredient = (ingredient: any, quantityKg: number, unitPrice: number) => {
    // Single Calcium source check (R-FC-4)
    if (ingredient.category === 'calcium') {
      setSelected(prev => [
        ...prev.filter(s => s.ingredient.category !== 'calcium'),
        { ingredient, quantityKg, unitPrice },
      ]);
    } else {
      setSelected(prev => [...prev, { ingredient, quantityKg, unitPrice }]);
    }
  };

  const removeIngredient = (name: string) => {
    const ing = selected.find(s => s.ingredient.name === name);
    if (ing?.autoAdded || ing?.ingredient.id === 'toxin_binder') {
      toast.error('This supplement is compulsory and cannot be removed');
      return;
    }
    setSelected(prev => prev.filter(s => s.ingredient.name !== name));
  };

  const updateIngredient = (name: string, field: 'quantityKg' | 'unitPrice', value: number) => {
    setSelected(prev => prev.map(s => s.ingredient.name === name ? { ...s, [field]: value } : s));
  };

  // WASM LP solver run
  const handleOptimize = async () => {
    if (!phase || !dbRequirements) { toast.error('Requirements loading...'); return; }
    if (selected.length === 0) { toast.error('Select at least one ingredient'); return; }

    if (preprocessData.blocked) {
      toast.error(`Pre-flight safety block: ${preprocessData.blockedReason}`);
      return;
    }

    setOptimizing(true);
    try {
      const solverInput = preprocessData.selected;
      const lpResult = await solveFeedLP({
        species: batch.species,
        targetKg: totalKg,
        selected: solverInput,
        requirements: dbRequirements,
      });

      setSelected(
        solverInput.map(s => ({
          ingredient: {
            id: s.ingredient.id,
            name: s.ingredient.name,
            category: s.ingredient.category,
            proteinPct: s.ingredient.protein_pct,
            energyKcal: s.ingredient.energy_kcal_per_kg,
            calciumPct: s.ingredient.calcium_pct,
            phosphorusPct: s.ingredient.phosphorus_pct,
            lysinePct: s.ingredient.lysine_pct,
            methioninePct: s.ingredient.methionine_pct,
            containsGossypol: s.ingredient.contains_gossypol,
            containsAflatoxinRisk: s.ingredient.contains_aflatoxin_risk,
            maxSharePct: s.ingredient.max_share_pct,
          },
          quantityKg: lpResult.quantities[s.ingredient.id] || 0,
          unitPrice: s.unitPrice,
          autoAdded: s.autoAdded,
        }))
      );

      if (lpResult.status === 'optimal') {
        setOptimized(true);
        setSolverStatus('optimal');
        toast.success('Cost minimized while meeting all nutritional requirements!');
      } else {
        setSolverStatus('fallback');
        setFallbackReason(lpResult.fallbackReason);
        toast.warning('Linear solver failed to find optimal recipe. Flexible Mix applied.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Optimization failed unexpectedly');
    } finally {
      setOptimizing(false);
    }
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
      formulation_type: solverStatus === 'optimal' ? 'optimized' : solverStatus === 'fallback' ? 'guided' : 'free',
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

    const isIntensive = batch.production_system === 'intensive';
    if (isIntensive) {
      for (const s of selected) {
        if (s.quantityKg > 0) {
          // Find matching stock item by name
          const { data: matchedStock } = await supabase
            .from('stock_items')
            .select('*')
            .eq('farm_id', farmId)
            .ilike('name', s.ingredient.name)
            .maybeSingle();

          if (matchedStock) {
            const { error: allocError } = await (supabase as any).rpc('allocate_fifo_by_quality', {
              p_farm_id: farmId,
              p_stock_item_id: matchedStock.id,
              p_qty_needed: s.quantityKg,
              p_batch_id: batch.id,
              p_reason: `Feed formulation auto-deduction: ${s.ingredient.name}`,
              p_source_ref: formulation.id
            });

            if (allocError) {
              console.error(`Failed to allocate stock for ingredient ${s.ingredient.name}:`, allocError);
              toast.error(`Failed to deduct ${s.ingredient.name} from inventory: ${allocError.message}`);
            } else {
              // Explicitly update stock item quantity
              const newStockQty = Math.max(0, Number(matchedStock.current_quantity) - s.quantityKg);
              await supabase.from('stock_items')
                .update({
                  current_quantity: newStockQty,
                  updated_at: new Date().toISOString()
                })
                .eq('id', matchedStock.id);
            }
          }
        }
      }
    }

    if (totalCost > 0 && isIntensive) {
      const totalPesewas = Math.round(totalCost * 100);
      await supabase.from('expenses').upsert({
        farm_id: farmId,
        batch_id: batch.id,
        category: 'feed',
        description: `Custom feed (${approach}): ${batch.species} ${phase?.name ?? ''} — ${totalKg}kg`,
        amount: totalCost,
        amount_pesewas: totalPesewas,
        date: new Date().toISOString(),
        source: 'auto:feed',
        source_ref: formulation.id,
      }, { onConflict: 'source,source_ref', ignoreDuplicates: true });
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'feed_formulation',
      description: `Created custom ${approach} formulation — ${totalKg}kg for ${batch.name}`,
    });

    if (!isIntensive && totalCost > 0) {
      toast.success('Formulation saved! Record the expense manually in Finance.');
    } else {
      toast.success('Formulation saved & expense auto-created!');
    }
    setSaving(false);
    onDone();
  };

  const categories: { key: 'energy' | 'protein' | 'calcium' | 'supplement'; label: string; hint: string }[] = [
    { key: 'energy', label: 'Energy Grains', hint: 'Grains & energy sources' },
    { key: 'protein', label: 'Protein Meals', hint: 'Fish, soy, groundnut' },
    { key: 'calcium', label: 'Calcium Supplement', hint: 'Maximum of 1 calcium source' },
    { key: 'supplement', label: 'Premixes & Toxin Binders', hint: 'Locks toxin binder at 0.5%' },
  ];

  if (dbLoading) {
    return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-4">
      <BatchContextCard batch={batch} phase={phase} week={week} />

      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'quick' as Approach, label: 'Optimal Recipe (LP WASM)', desc: 'Optimized minimum cost formulation' },
          { key: 'flexible' as Approach, label: 'Flexible Mix', desc: 'Custom weights with automated validation' },
          { key: 'free' as Approach, label: 'Free Mix', desc: 'No solver bounds, warnings only' },
        ]).map(a => (
          <Button
            key={a.key}
            variant={approach === a.key ? 'default' : 'outline'}
            className="rounded-full text-xs"
            onClick={() => { 
              setApproach(a.key); 
              setOptimized(false);
              setSolverStatus(a.key === 'quick' ? 'manual' : 'manual');
            }}
          >
            {a.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Target Feed Weight</CardTitle>
              <div className="flex items-center gap-1">
                {solverStatus === 'optimal' && <Badge className="bg-green-100 text-green-800 border-green-200">✓ Optimal (LP)</Badge>}
                {solverStatus === 'fallback' && <Badge className="bg-amber-100 text-amber-800 border-amber-200">⚠ Fallback (Flexible)</Badge>}
                {solverStatus === 'manual' && <Badge variant="secondary">Manual Mix</Badge>}
              </div>
            </CardHeader>
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
                  <Label className="text-xs">Total Formulation Weight</Label>
                  <Input value={`${totalKg} kg`} readOnly className="bg-muted text-muted-foreground" />
                </div>
                {targetKg && phase && (
                  <div className="col-span-3 mt-1">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Pre-filled from your plan ({plannedDays} days &times; {batch.current_population} birds &times; {phase.feedPerBirdG}g/bird)
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Assigned ingredients: {usedKg.toFixed(1)} kg</span>
                  <span className={remainingKg < 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {remainingKg < 0 ? `Over by ${Math.abs(remainingKg).toFixed(1)} kg` : `Remaining: ${remainingKg.toFixed(1)} kg`}
                  </span>
                </div>
                <Progress value={usedPct} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Solver fallback banner */}
          {solverStatus === 'fallback' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-600" /> Auto-optimisation Infeasible ({fallbackReason})</span>
              <p>The selected set of ingredients cannot satisfy the target nutrients. A standard flexible mix has been applied. Adjust parameters or select additional raw materials.</p>
            </div>
          )}

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
                          {item.autoAdded && <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800">Compulsory (0.5%)</Badge>}
                        </div>
                        {!item.autoAdded && item.ingredient.id !== 'toxin_binder' && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeIngredient(item.ingredient.name)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      {approach !== 'quick' || !optimized ? (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">Quantity (kg)</Label>
                            <Input
                              type="number" min="0" step="0.1"
                              value={item.quantityKg || ''}
                              onChange={e => updateIngredient(item.ingredient.name, 'quantityKg', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                              disabled={approach === 'quick' || item.ingredient.id === 'toxin_binder'}
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">Price per kg (GH₵)</Label>
                            <Input
                              type="number" min="0" step="0.1"
                              value={item.unitPrice || ''}
                              onChange={e => updateIngredient(item.ingredient.name, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">Subtotal</Label>
                            <p className="h-8 flex items-center text-sm font-semibold">
                              {mask(`GH₵${(item.quantityKg * item.unitPrice).toFixed(2)}`)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm">
                          <span>{item.quantityKg.toFixed(1)} kg ({totalKg > 0 ? ((item.quantityKg / totalKg) * 100).toFixed(1) : 0}%)</span>
                          <span className="font-semibold">{mask(`GH₵${(item.quantityKg * item.unitPrice).toFixed(2)}`)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full rounded-lg border-dashed gap-2 text-muted-foreground hover:text-primary hover:border-primary"
                    onClick={() => setPickerCategory(cat.key)}
                  >
                    <Plus className="h-4 w-4" /> Add {cat.label.replace('Grains', 'Grain').replace('Meals', 'Meal').replace('Supplement', 'source').replace('Premixes & Toxin Binders', 'Supplement')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Nutrient Compliance</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[
                { label: 'Protein', value: nutrition.protein, target: dbRequirements?.protein_min || phase?.proteinPct || 18, unit: '%' },
                { label: 'Energy', value: nutrition.energy, target: dbRequirements?.energy_min || phase?.energyKcal || 3000, unit: ' kcal/kg' },
                { label: 'Calcium', value: nutrition.calcium, target: dbRequirements?.calcium_min || phase?.calciumPct || 0.9, unit: '%' },
              ].map(n => {
                const complies = n.value >= n.target;
                return (
                  <div key={n.label} className="border-b pb-2 last:border-none last:pb-0">
                    <div className="flex justify-between mb-1 items-center">
                      <span>{n.label}</span>
                      <div className="flex items-center gap-1 font-semibold">
                        {complies ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-500" />}
                        <span>{n.value.toFixed(1)}{n.unit}</span>
                      </div>
                    </div>
                    {n.target > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Progress value={Math.min((n.value / n.target) * 100, 100)} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground">Req: ≥ {n.target}{n.unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Cost Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {selected.filter(s => s.quantityKg > 0).map(s => (
                <div key={s.ingredient.name} className="flex justify-between text-xs">
                  <span className="truncate max-w-[140px]">{s.ingredient.name}</span>
                  <span>{mask(`GH₵${(s.quantityKg * s.unitPrice).toFixed(2)}`)}</span>
                </div>
              ))}
              {selected.some(s => s.quantityKg > 0) && (
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Cost</span>
                  <span>{mask(`GH₵${totalCost.toFixed(2)}`)}</span>
                </div>
              )}
              {totalKg > 0 && totalCost > 0 && (
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Cost per kg</span>
                  <span>{mask(`GH₵${(totalCost / totalKg).toFixed(2)}`)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {preprocessData.warnings.length > 0 && (
            <Card className="border-yellow-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" /> Safety Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {preprocessData.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3 w-3 text-yellow-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {preprocessData.blocked && (
            <Card className="border-red-500 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" /> Blocked Formulation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-red-900 font-semibold">
                This mix violates layers health policies: {preprocessData.blockedReason === 'LAYER_GOSSYPOL_BLOCKED' ? 'Layer birds cannot consume cottonseed meal due to egg yolk discoloration caused by gossypol.' : preprocessData.blockedReason}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {approach === 'quick' && !optimized && (
              <Button
                className="w-full rounded-full gap-1.5"
                onClick={handleOptimize}
                disabled={optimizing || selected.length === 0 || preprocessData.blocked}
              >
                {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Optimize Formulation</>}
              </Button>
            )}
            {(approach !== 'quick' || optimized) && (
              <Button
                className="w-full rounded-full gap-1.5"
                onClick={handleSave}
                disabled={saving || selected.length === 0 || preprocessData.blocked}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save Feed Formulation</>}
              </Button>
            )}
            {optimized && approach === 'quick' && (
              <Button variant="outline" className="w-full rounded-full" onClick={() => setOptimized(false)}>
                ← Adjust Recipe Ingredients
              </Button>
            )}
          </div>
        </div>
      </div>

      {pickerCategory && (
        <IngredientPicker
          open={!!pickerCategory}
          onClose={() => setPickerCategory(null)}
          category={pickerCategory}
          ingredients={dbIngredients.map(i => ({
            id: i.id,
            name: i.name,
            category: i.category,
            proteinPct: Number(i.protein_pct),
            energyKcal: Number(i.energy_kcal_per_kg),
            calciumPct: Number(i.calcium_pct),
            phosphorusPct: Number(i.phosphorus_pct),
            lysinePct: Number(i.lysine_pct),
            methioninePct: Number(i.methionine_pct),
            containsGossypol: i.contains_gossypol,
            containsAflatoxinRisk: i.contains_aflatoxin_risk,
            maxSharePct: Number(i.max_share_pct),
            defaultPricePerKg: Number(i.price_per_kg || 0)
          }))}
          species={batch.species}
          alreadySelected={selected.map(s => s.ingredient.name)}
          singleSelect={pickerCategory === 'calcium'}
          onSelect={handleAddIngredient}
        />
      )}
    </div>
  );
}
