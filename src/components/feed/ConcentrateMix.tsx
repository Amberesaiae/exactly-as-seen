import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Beaker } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { autoCreateExpense, autoDeductStock } from '@/lib/synergy';
import { isIntensiveSystem } from '@/lib/production-system';
import { isOffline, queueWrite } from '@/lib/sync';
import { useAppStore } from '@/stores/useAppStore';
import { BatchContextCard } from './BatchContextCard';
import { CONCENTRATE_PRODUCTS, type FeedPhase } from '@/lib/feed-data';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

interface ConcentrateMixProps {
  batch: Batch;
  phase: FeedPhase | undefined;
  week: number;
  farmId: string;
  onDone: () => void;
  targetKg?: number;
}

export function ConcentrateMix({ batch, phase, week, farmId, onDone, targetKg }: ConcentrateMixProps) {
  const { currency } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [productId, setProductId] = useState('');
  const [ratio, setRatio] = useState(40); // concentrate %
  const [bagSize, setBagSize] = useState('50');
  const [bagsCount, setBagsCount] = useState(() => {
    if (targetKg) {
      return Math.ceil(targetKg / 50).toString();
    }
    return '1';
  });
  const [concentratePrice, setConcentratePrice] = useState('');
  const [grainPrice, setGrainPrice] = useState('3.5');
  const [grainName, setGrainName] = useState('Maize (Yellow Corn)');
  const [saving, setSaving] = useState(false);

  // Sync bagsCount if targetKg or bagSize changes
  useEffect(() => {
    if (targetKg) {
      const size = parseInt(bagSize) || 50;
      setBagsCount(Math.ceil(targetKg / size).toString());
    }
  }, [targetKg, bagSize]);

  const products = CONCENTRATE_PRODUCTS.filter(p => p.species.includes(batch.species));
  const selectedProduct = products.find(p => p.name === productId);

  const totalKg = (parseInt(bagsCount) || 0) * (parseInt(bagSize) || 0);
  const concentrateKg = totalKg * (ratio / 100);
  const grainKg = totalKg - concentrateKg;
  const concPriceNum = parseFloat(concentratePrice) || (selectedProduct?.pricePerKg ?? 0);
  const grainPriceNum = parseFloat(grainPrice) || 3.5;
  const totalCost = concentrateKg * concPriceNum + grainKg * grainPriceNum;
  const costPerKg = totalKg > 0 ? totalCost / totalKg : 0;
  const dailyKg = phase ? (phase.feedPerBirdG * batch.current_population) / 1000 : 0;
  const coversDays = dailyKg > 0 ? Math.floor(totalKg / dailyKg) : 0;
  const plannedDays = targetKg && phase
    ? Math.round((targetKg * 1000) / (phase.feedPerBirdG * batch.current_population))
    : 0;

  const mask = (v: string) => costPrivacyEnabled ? '••••' : v;

  const handleConfirm = async () => {
    if (!selectedProduct) { toast.error('Select a concentrate product'); return; }
    if (totalKg <= 0) { toast.error('Set a valid planning target'); return; }

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
        formulation_type: 'concentrate',
      } as unknown as Record<string, unknown>);
      await queueWrite('feed_ingredients', 'insert', crypto.randomUUID(), {
        formulation_id: tempId,
        category: 'supplement',
        name: selectedProduct.name,
        quantity_kg: concentrateKg,
        unit_price_pesewas: Math.round(concPriceNum * 100),
        total_cost_pesewas: Math.round(concentrateKg * concPriceNum * 100),
      } as unknown as Record<string, unknown>);
      await queueWrite('feed_ingredients', 'insert', crypto.randomUUID(), {
        formulation_id: tempId,
        category: 'energy',
        name: grainName,
        quantity_kg: grainKg,
        unit_price_pesewas: Math.round(grainPriceNum * 100),
        total_cost_pesewas: Math.round(grainKg * grainPriceNum * 100),
      } as unknown as Record<string, unknown>);
      toast.success('Mix saved (offline — will sync)');
      setSaving(false);
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
      formulation_type: 'concentrate',
    }).select('id').single();

    if (error) { toast.error(error.message); setSaving(false); return; }

    // Save ingredients
    await supabase.from('feed_ingredients').insert([
      {
        formulation_id: formulation.id,
        category: 'supplement' as const,
        name: selectedProduct.name,
        quantity_kg: concentrateKg,
        unit_price_pesewas: Math.round(concPriceNum * 100),
        total_cost_pesewas: Math.round(concentrateKg * concPriceNum * 100),
      },
      {
        formulation_id: formulation.id,
        category: 'energy' as const,
        name: grainName,
        quantity_kg: grainKg,
        unit_price_pesewas: Math.round(grainPriceNum * 100),
        total_cost_pesewas: Math.round(grainKg * grainPriceNum * 100),
      },
    ]);

    const isIntensive = isIntensiveSystem(batch.production_system);
    if (isIntensive) {
      const mixIngredients = [
        { name: selectedProduct.name, qty: concentrateKg },
        { name: grainName, qty: grainKg }
      ];

      for (const ing of mixIngredients) {
        if (ing.qty > 0) {
          // Synergy: Auto-Stock Deduction (FIFO)
          await autoDeductStock({
            farmId,
            itemName: ing.name,
            quantity: ing.qty,
            batchId: batch.id,
            reason: `Concentrate mix auto-deduction: ${ing.name}`,
            sourceRef: formulation.id
          });
        }
      }

      if (totalCost > 0) {
        // Synergy: Auto-Expense Creation
        await autoCreateExpense({
          farmId,
          batchId: batch.id,
          category: 'feed_and_nutrition',
          description: `Concentrate mix: ${selectedProduct.name} + ${grainName} — ${totalKg}kg`,
          amount: totalCost,
          source: 'auto:feed',
          sourceRef: formulation.id,
        });
      }
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'feed_formulation',
      description: `Created concentrate mix — ${ratio}:${100 - ratio} ratio, ${totalKg}kg for ${batch.name}`,
    });

    if (!isIntensive && totalCost > 0) {
      toast.success('Mix saved! Remember to record the expense in Finance.');
    } else {
      toast.success('Mix saved & expense auto-created!');
    }
    setSaving(false);
    onDone();
  };

  return (
    <div className="space-y-4">
      <BatchContextCard batch={batch} phase={phase} week={week} />

      <Card>
        <CardHeader><CardTitle className="text-base">Concentrate Product</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Select Concentrate</Label>
            <Select value={productId} onValueChange={v => {
              setProductId(v);
              const p = products.find(pr => pr.name === v);
              if (p) {
                setRatio(p.defaultRatio);
                setConcentratePrice(p.pricePerKg.toString());
              }
            }}>
              <SelectTrigger><SelectValue placeholder="Choose a concentrate" /></SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.name} value={p.name}>{p.name} — {p.proteinPct}% protein</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Mixing Ratio — Concentrate : Grain</Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-primary w-12">{ratio}%</span>
                  <Slider
                    value={[ratio]}
                    onValueChange={v => setRatio(v[0])}
                    min={selectedProduct.ratioRange[0]}
                    max={selectedProduct.ratioRange[1]}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold text-muted-foreground w-12">{100 - ratio}%</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {ratio}% concentrate · {100 - ratio}% grain
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Grain Type</Label>
                <Select value={grainName} onValueChange={setGrainName}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maize (Yellow Corn)">Maize (Yellow Corn)</SelectItem>
                    <SelectItem value="Sorghum (Low-Tannin)">Sorghum (Low-Tannin)</SelectItem>
                    <SelectItem value="Wheat Bran">Wheat Bran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Planning Target</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Number of Bags</Label>
              <Input type="number" min="1" value={bagsCount} onChange={e => setBagsCount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bag Size (kg)</Label>
              <Input type="number" min="1" value={bagSize} onChange={e => setBagSize(e.target.value)} />
            </div>
            {targetKg && phase && (
              <div className="col-span-2 mt-1">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Pre-filled from your plan ({plannedDays} days &times; {batch.current_population} birds &times; {phase.feedPerBirdG}g/bird)
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="space-y-1">
              <Label className="text-xs">Concentrate Price/kg (GH₵)</Label>
              <Input type="number" min="0" step="0.1" value={concentratePrice} onChange={e => setConcentratePrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Grain Price/kg (GH₵)</Label>
              <Input type="number" min="0" step="0.1" value={grainPrice} onChange={e => setGrainPrice(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedProduct && totalKg > 0 && (
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-green-700 dark:text-green-400 text-xs">Concentrate</p>
                <p className="font-bold text-green-800 dark:text-green-300">{concentrateKg.toFixed(1)} kg</p>
              </div>
              <div>
                <p className="text-green-700 dark:text-green-400 text-xs">{grainName}</p>
                <p className="font-bold text-green-800 dark:text-green-300">{grainKg.toFixed(1)} kg</p>
              </div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-400">Total Cost:</span>
                <span className="font-bold text-lg text-green-800 dark:text-green-300">{mask(`GH₵ ${totalCost.toFixed(2)}`)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-400">Cost per kg:</span>
                <span className="font-semibold text-green-800 dark:text-green-300">{mask(`GH₵ ${costPerKg.toFixed(2)}`)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-400">Covers:</span>
                <span className="font-semibold text-green-800 dark:text-green-300">~{coversDays} days for {batch.current_population} birds</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" className="rounded-full" onClick={onDone}>Cancel</Button>
        <Button className="rounded-full gap-1.5" onClick={handleConfirm} disabled={saving || !selectedProduct || totalKg <= 0}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Beaker className="h-4 w-4" /> Confirm Mix</>}
        </Button>
      </div>
    </div>
  );
}
