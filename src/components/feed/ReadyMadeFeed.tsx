import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
}

export function ReadyMadeFeed({ batch, phase, week, farmId, onDone }: ReadyMadeFeedProps) {
  const { currency } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [feedType, setFeedType] = useState('');
  const [brand, setBrand] = useState('');
  const [bags, setBags] = useState('1');
  const [bagSizeKg, setBagSizeKg] = useState('50');
  const [pricePerBag, setPricePerBag] = useState('');
  const [saving, setSaving] = useState(false);

  const feedTypes = COMMERCIAL_FEED_TYPES.filter(f => f.species.includes(batch.species));
  const totalKg = (parseInt(bags) || 0) * (parseInt(bagSizeKg) || 0);
  const totalCost = (parseInt(bags) || 0) * (parseFloat(pricePerBag) || 0);
  const costPerKg = totalKg > 0 ? totalCost / totalKg : 0;
  const dailyKg = phase ? (phase.feedPerBirdG * batch.current_population) / 1000 : 0;
  const coversDays = dailyKg > 0 ? Math.floor(totalKg / dailyKg) : 0;

  const mask = (v: string) => costPrivacyEnabled ? '••••' : v;

  const handleConfirm = async () => {
    if (!bags || !pricePerBag) {
      toast.error('Fill in quantity and price');
      return;
    }
    setSaving(true);

    // Save formulation record
    const { data: formulation, error } = await supabase.from('feed_formulations').insert({
      farm_id: farmId,
      batch_id: batch.id,
      species: batch.species,
      phase: phase?.name.toLowerCase() ?? 'unknown',
      population: batch.current_population,
      bags_count: parseInt(bags) || 1,
      bag_size_kg: parseInt(bagSizeKg) || 50,
      total_kg: totalKg,
      formulation_type: 'ready_made',
    }).select('id').single();

    if (error) { toast.error(error.message); setSaving(false); return; }

    // Auto-create expense
    if (totalCost > 0) {
      await supabase.from('expenses').insert({
        farm_id: farmId,
        batch_id: batch.id,
        category: 'feed',
        description: `Ready-made feed: ${feedType || 'Commercial'} ${brand ? `(${brand})` : ''} — ${totalKg}kg`,
        amount: totalCost,
        source: 'feed_formulation',
        source_ref: formulation.id,
      });
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'feed_purchase',
      description: `Purchased ${bags} bags of ready-made feed (${totalKg}kg) for ${batch.name}`,
    });

    toast.success('Feed purchase recorded!');
    setSaving(false);
    onDone();
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
