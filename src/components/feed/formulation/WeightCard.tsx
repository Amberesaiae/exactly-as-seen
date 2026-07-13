import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface WeightCardProps {
  bagsCount: string;
  setBagsCount: (v: string) => void;
  bagSize: string;
  setBagSize: (v: string) => void;
  totalKg: number;
  usedKg: number;
  remainingKg: number;
  usedPct: number;
  solverStatus: 'optimal' | 'fallback' | 'manual';
}

export function WeightCard({
  bagsCount, setBagsCount, bagSize, setBagSize, totalKg, usedKg, remainingKg, usedPct, solverStatus
}: WeightCardProps) {
  return (
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
            <Label className="text-xs" htmlFor="feed-bags-count">Number of Bags</Label>
            <Input
              id="feed-bags-count"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={bagsCount}
              onChange={e => setBagsCount(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs" htmlFor="feed-bag-size">Bag Size (kg)</Label>
            <Input
              id="feed-bag-size"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={bagSize}
              onChange={e => setBagSize(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Total Weight</Label>
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
              {totalKg || 0} kg
            </div>
          </div>
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
  );
}
