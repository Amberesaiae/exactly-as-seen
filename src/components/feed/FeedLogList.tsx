import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, TrendingUp } from 'lucide-react';

interface FeedLogListProps {
  schedules: any[];
  onMarkFed: (schedule: any) => void;
}

export function FeedLogList({ schedules, onMarkFed }: FeedLogListProps) {
  if (schedules.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Feed Log (Last 14 entries)</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {schedules.map(s => (
            <div key={s.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
              <div className="flex items-center gap-2">
                {s.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span>Day {s.day} (Week {s.week})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{s.total_amount_kg} kg</span>
                {!s.completed && (
                  <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" onClick={() => onMarkFed(s)}>
                    Mark Fed
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
