import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Syringe, Check, Zap, Loader2 } from 'lucide-react';
import { format, isBefore, isToday, isAfter, differenceInDays } from 'date-fns';
import { VACCINATION_TEMPLATES, getVaccineRoute } from '@/lib/health-data';

interface VaccinationTabProps {
  batch: any;
  vaccinations: any[];
  generatingVaccines: boolean;
  onGenerateSchedule: () => void;
  onMarkAdministered: (id: string) => void;
}

export function VaccinationTab({
  batch,
  vaccinations,
  generatingVaccines,
  onGenerateSchedule,
  onMarkAdministered,
}: VaccinationTabProps) {
  const today = new Date();

  if (vaccinations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Syringe className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No vaccinations scheduled for this batch.</p>
          {batch && (
            <Button
              variant="default"
              className="rounded-full gap-1.5"
              onClick={onGenerateSchedule}
              disabled={generatingVaccines}
            >
              {generatingVaccines ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4" /> Generate Schedule</>}
            </Button>
          )}
          {batch && (
            <p className="text-xs text-muted-foreground mt-2">
              Auto-generates {VACCINATION_TEMPLATES.filter(t => t.species.includes(batch.species)).length} vaccines for {batch.species} based on start date
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {vaccinations.map(v => {
        const due = new Date(v.scheduled_date);
        const overdue = !v.administered && isBefore(due, today) && !isToday(due);
        const dueToday = !v.administered && isToday(due);
        const upcoming = !v.administered && isAfter(due, today);
        const daysUntil = differenceInDays(due, today);
        const route = batch ? getVaccineRoute(v.vaccine_name, batch.species) : null;

        return (
          <Card key={v.id} className={overdue ? 'border-destructive/50' : dueToday ? 'border-primary/50' : ''}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                  v.administered ? 'bg-green-100 text-green-600' :
                  overdue ? 'bg-destructive/10 text-destructive' :
                  dueToday ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {v.administered ? <Check className="h-4 w-4" /> : <Syringe className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${v.administered ? 'line-through text-muted-foreground' : ''}`}>
                    {v.vaccine_name}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                    <span>Week {v.scheduled_week}</span>
                    <span>•</span>
                    <span>{format(due, 'MMM d, yyyy')}</span>
                    {route && (
                      <>
                        <span>•</span>
                        <span className="text-primary/70 italic">{route}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {overdue && <Badge variant="destructive" className="text-[10px] h-4 px-1">Overdue</Badge>}
                    {dueToday && <Badge className="text-[10px] h-4 px-1">Today</Badge>}
                    {upcoming && daysUntil <= 7 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">In {daysUntil}d</Badge>
                    )}
                  </div>
                </div>
              </div>
              {!v.administered ? (
                <Button size="sm" variant={overdue || dueToday ? 'default' : 'outline'} className="h-8 rounded-full text-xs shrink-0" onClick={() => onMarkAdministered(v.id)}>
                  <Check className="h-3 w-3 mr-1" /> Done
                </Button>
              ) : (
                <span className="text-xs text-green-600 shrink-0">
                  {v.administered_at ? format(new Date(v.administered_at), 'MMM d') : 'Done'}
                </span>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
