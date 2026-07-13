import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Skull, ShoppingCart, Info } from 'lucide-react';
import { format } from 'date-fns';
import { mortalityRate } from '@/lib/batch-utils';
import { getAllowedBatchActions } from '@/lib/batch-fsm';

interface OverviewTabProps {
  batch: any;
  onRecordMortality: () => void;
  onSellBirds: () => void;
  onTerminate: () => void;
}

export function OverviewTab({ batch, onRecordMortality, onSellBirds, onTerminate }: OverviewTabProps) {
  if (!batch) return null;

  const actions = getAllowedBatchActions({
    status: batch.status,
    currentWeek: batch.current_week ?? 1,
    cycleLengthWeeks: batch.cycle_length_weeks ?? 8,
    hasActiveWithdrawal: !!batch.has_active_withdrawal,
    species: batch.species,
    duckType: batch.duck_type ?? null,
  });

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{batch.current_population}</p>
          <p className="text-xs text-muted-foreground">Current Population</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{batch.current_week}</p>
          <p className="text-xs text-muted-foreground">Current Week</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Skull className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold text-destructive">{mortalityRate(batch.initial_quantity, batch.current_population)}%</p>
          <p className="text-xs text-muted-foreground">Mortality Rate</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Info className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold capitalize">{batch.status}</p>
          <p className="text-xs text-muted-foreground">Flock Status</p>
          {batch.status === 'active' && (
            <Badge variant="secondary" className="mt-1 capitalize text-[10px]">{actions.phase}</Badge>
          )}
        </CardContent></Card>
      </div>

      {/* Quick Actions — gated by batch-fsm helpers */}
      {batch.status === 'active' && (
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="rounded-full gap-2 border-primary/20 text-primary"
            onClick={onSellBirds}
            disabled={!actions.canSellBirds}
          >
            <ShoppingCart className="h-4 w-4" /> {!actions.canSellBirds ? 'Sale Blocked' : 'Sell Birds'}
          </Button>
          <Button
            variant="outline"
            className="rounded-full gap-2 border-destructive/20 text-destructive"
            onClick={onRecordMortality}
            disabled={!actions.canRecordMortality}
          >
            <Skull className="h-4 w-4" /> Record Mortality
          </Button>
          <Button
            variant="destructive"
            className="rounded-full ml-auto"
            onClick={onTerminate}
            disabled={!actions.canEmergencyTerminate}
          >
            Terminate Batch
          </Button>
        </div>
      )}

      {/* Batch Metadata Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Species</p>
              <p className="font-medium capitalize">{batch.species}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Production System</p>
              <p className="font-medium capitalize">{batch.production_system.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(new Date(batch.start_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Batch ID</p>
              <p className="font-mono text-[10px] text-muted-foreground">{batch.id.slice(0, 8)}...</p>
            </div>
          </div>
          
          {batch.has_active_withdrawal && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
              <Info className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Active Withdrawal Period</p>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  This flock is currently in a medication withdrawal period. Standard sale and termination procedures are restricted for safety.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
