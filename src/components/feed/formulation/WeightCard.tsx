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
            <Label className="text-xs">Number of Bags</Label>
            <Input type="number" min="1" value={bagsCount} onChange={e => setBagsCount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bag Size (kg)</Label>
            <Input type="number" min="1" value={bagSize} onChange={e => setBagSize(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Total Weight</Label>
            <Input value={`${totalKg} kg`} readOnly className="bg-muted text-muted-foreground" />
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
