import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface CurrentPhaseCardProps {
  batch: any;
  phase: any;
  dynamics: any;
  dailyTotalKg: number;
  todaySchedule: any;
  onLogToday: () => void;
}

export function CurrentPhaseCard({
  batch, phase, dynamics, dailyTotalKg, todaySchedule, onLogToday
}: CurrentPhaseCardProps) {
  if (!batch || !phase || !dynamics) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Current Phase</span>
          <Badge variant="secondary" className="capitalize">{phase.name} — Week {dynamics.week}, Day {dynamics.day}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-muted-foreground text-xs">Protein Target</p>
            <p className="font-bold text-lg">{phase.proteinPct}%</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-muted-foreground text-xs">Energy Target</p>
            <p className="font-bold text-lg">{phase.energyKcal}</p>
            <p className="text-xs text-muted-foreground">kcal/kg</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-muted-foreground text-xs">Per Bird/Day</p>
            <p className="font-bold text-lg">{phase.feedPerBirdG}g</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <p className="text-muted-foreground text-xs">Daily Total</p>
            <p className="font-bold text-lg text-primary">{dailyTotalKg.toFixed(1)} kg</p>
            <p className="text-xs text-muted-foreground">{batch.current_population} birds</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button className="rounded-full gap-1.5 flex-1" onClick={onLogToday}>
            <CheckCircle2 className="h-4 w-4" /> Log Today's Feed
          </Button>
        </div>

        {todaySchedule?.completed && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Today's feed already logged ({todaySchedule.total_amount_kg} kg)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
