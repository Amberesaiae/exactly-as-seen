import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isOffline, queueRpc } from '@/lib/sync';
import { useAppStore } from '@/stores/useAppStore';
import { BatchContextCard } from './BatchContextCard';
import { COMMERCIAL_FEED_TYPES } from '@/lib/feed-data';
import type { FeedPhase } from '@/lib/feed-data';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

interface ReadyMadeFeedProps {
  batch: Batch;
  phase: FeedPhase | undefined;
  week: number;
  farmId: string;
  onDone: () => void;
  targetKg?: number;
}

export function ReadyMadeFeed({ batch, phase, week, farmId, onDone, targetKg }: ReadyMadeFeedProps) {
  const { currency } = useAuth();
  void currency;
  const { costPrivacyEnabled } = useAppStore();
  const [feedType, setFeedType] = useState('');
  const [brand, setBrand] = useState('');
  const [bagSizeKg, setBagSizeKg] = useState('50');
  const [bags, setBags] = useState(() => {
    if (targetKg) {
      return Math.ceil(targetKg / 50).toString();
    }
    return '1';
  });
  const [pricePerBag, setPricePerBag] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (targetKg) {
      const size = parseInt(bagSizeKg) || 50;
      setBags(Math.ceil(targetKg / size).toString());
    }
  }, [targetKg, bagSizeKg]);

  const feedTypes = COMMERCIAL_FEED_TYPES.filter(f => f.species.includes(batch.species));
  const totalKg = (parseInt(bags) || 0) * (parseInt(bagSizeKg) || 0);
  const totalCost = (parseInt(bags) || 0) * (parseFloat(pricePerBag) || 0);
  const costPerKg = totalKg > 0 ? totalCost / totalKg : 0;
  const dailyKg = phase ? (phase.feedPerBirdG * batch.current_population) / 1000 : 0;
  const coversDays = dailyKg > 0 ? Math.floor(totalKg / dailyKg) : 0;
  const plannedDays = targetKg && phase
    ? Math.round((targetKg * 1000) / (phase.feedPerBirdG * batch.current_population))
    : 0;

  const mask = (v: string) => costPrivacyEnabled ? '••••' : v;

  const handleConfirm = async () => {
    if (!bags || !pricePerBag) {
      toast.error('Fill in quantity and price');
      return;
    }
    if (totalKg <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    setSaving(true);

    const totalCostPesewas = Math.round(totalCost * 100);
    const rpcArgs = {
      p_farm_id: farmId,
      p_batch_id: batch.id,
      p_species: batch.species,
      p_phase: phase?.name.toLowerCase() ?? 'unknown',
      p_population: batch.current_population,
      p_bags_count: parseInt(bags) || 1,
      p_bag_size_kg: parseInt(bagSizeKg) || 50,
      p_total_kg: totalKg,
      p_total_cost_pesewas: totalCostPesewas,
      p_feed_type: feedType || 'Commercial',
      p_brand: brand || null,
      p_description: `Ready-made feed: ${feedType || 'Commercial'}${brand ? ` (${brand})` : ''} — ${totalKg}kg`,
    };

    try {
      // S1: sole spine — never multi-write formulation + expense
      if (isOffline()) {
        await queueRpc('record_ready_made_purchase', rpcArgs, `ready-made:${batch.id}:${Date.now()}`);
        toast.warning('Offline — feed purchase queued; will sync when online');
        onDone();
        return;
      }

      const { data, error } = await supabase.rpc('record_ready_made_purchase', rpcArgs);
      if (error) {
        toast.error(error.message || 'Feed purchase failed');
        return;
      }
      if (!data?.ok) {
        toast.error('Feed purchase failed');
        return;
      }

      toast.success(
        totalCost > 0
          ? 'Feed purchase recorded (expense logged)'
          : 'Formulation saved'
      );
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <BatchContextCard batch={batch} phase={phase} week={week} />

      <Card>
        <CardHeader><CardTitle className="text-base">Feed Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Feed Type</Label>
            <Select value={feedType} onValueChange={setFeedType}>
              <SelectTrigger><SelectValue placeholder="Select feed type" /></SelectTrigger>
              <SelectContent>
                {feedTypes.map(f => (
                  <SelectItem key={f.label} value={f.label}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Brand Name (optional)</Label>
            <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Agricare, Olam" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Quantity (bags)</Label>
              <Input type="number" min="1" value={bags} onChange={e => setBags(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Bag Size (kg)</Label>
              <Input type="number" min="1" value={bagSizeKg} onChange={e => setBagSizeKg(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Price per Bag (GH₵)</Label>
              <Input type="number" min="0" step="0.5" value={pricePerBag} onChange={e => setPricePerBag(e.target.value)} placeholder="185.00" />
            </div>
            {targetKg && phase && (
              <div className="col-span-3 mt-1">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Pre-filled from your plan ({plannedDays} days &times; {batch.current_population} birds &times; {phase.feedPerBirdG}g/bird)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {totalKg > 0 && parseFloat(pricePerBag) > 0 && (
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-400">Total Quantity:</span>
              <span className="font-bold text-lg text-green-800 dark:text-green-300">{totalKg} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-400">Total Cost:</span>
              <span className="font-bold text-lg text-green-800 dark:text-green-300">{mask(`GH₵ ${totalCost.toLocaleString()}`)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-400">Cost per kg:</span>
              <span className="font-semibold text-green-800 dark:text-green-300">{mask(`GH₵ ${costPerKg.toFixed(2)}`)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-400">Covers:</span>
              <span className="font-semibold text-green-800 dark:text-green-300">~{coversDays} days for {batch.current_population} birds</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" className="rounded-full" onClick={onDone}>Cancel</Button>
        <Button className="rounded-full gap-1.5" onClick={handleConfirm} disabled={saving || !totalKg || !parseFloat(pricePerBag)}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShoppingBag className="h-4 w-4" /> Confirm & Create Expense</>}
        </Button>
      </div>
    </div>
  );
}
