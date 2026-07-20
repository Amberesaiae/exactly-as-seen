import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Plus, Loader2, CheckCircle2, Info, Utensils } from 'lucide-react';
import { useFeedData } from '@/hooks/feed/useFeedData';
import { PhaseTransitionAlert } from '@/components/feed/PhaseTransitionAlert';

/**
 * Feed Lab: Proactive Nutrition Tool.
 * Single data hook (useFeedData) — no dual useHealthData (was causing flicker / wrong batch).
 */
export default function Feed() {
  const {
    batches,
    selectedBatch,
    setSelectedBatch,
    loading,
    formulations,
    schedules,
    batch,
    dynamics,
    phase,
    feedTask,
    dailyTotalKg,
    isTodayCompleted,
    feedSaving,
    confirmDayFeed,
  } = useFeedData();

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Feed Lab</h1>
        <Button className="gap-1.5 rounded-full" asChild>
          <Link to="/feed/formulate">
            <Calculator className="h-4 w-4" /> New Formulation
          </Link>
        </Button>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calculator className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold mb-1">No active batches</h3>
            <p className="text-sm text-muted-foreground mb-4">Create a batch first to use the feed tool.</p>
            <Button className="rounded-full" asChild>
              <Link to="/batches/new">
                <Plus className="h-4 w-4 mr-1" /> Create Batch
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {batches.length > 1 ? (
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="w-full max-w-xs h-9 rounded-full">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 h-9 px-4 rounded-full font-bold">
                {batch?.name} ({batch?.species})
              </Badge>
            )}
          </div>

          <PhaseTransitionAlert phase={phase} lastSchedule={schedules[0]} />

          {!isTodayCompleted && feedTask ? (
            <Card className="border-warning/30 shadow-md overflow-hidden ring-1 ring-warning/10">
              <CardHeader className="bg-warning/5 pb-3 border-b border-warning/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-warning-foreground">
                    <Utensils className="h-4 w-4 text-warning" /> Today&apos;s Feeding Tool
                  </CardTitle>
                  <Badge variant="secondary" className="bg-warning/20 text-warning border-none text-[10px] font-bold">
                    READY
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Weight</p>
                    <p className="text-3xl font-black text-foreground">
                      {dailyTotalKg.toFixed(1)} <span className="text-sm font-medium text-muted-foreground">KG</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phase Info</p>
                    <p className="text-sm font-black text-foreground capitalize leading-tight">{phase?.name} Phase</p>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase">
                      Week {dynamics?.week}, Day {dynamics?.day}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 flex items-start gap-3 border border-muted">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Nutritional Prescription</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Target <strong>{dailyTotalKg.toFixed(1)} kg</strong> for the flock today
                      {phase ? (
                        <>
                          {' '}
                          · phase protein target <strong>{phase.proteinPct}%</strong>
                        </>
                      ) : null}
                      .
                    </p>
                  </div>
                </div>

                <Button
                  data-testid="confirm-feeding"
                  onClick={() => void confirmDayFeed()}
                  disabled={feedSaving}
                  className="w-full rounded-full py-6 text-base font-bold gap-2 bg-warning hover:bg-warning/90 shadow-lg shadow-warning/20"
                >
                  {feedSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" /> Confirm Feeding Protocol
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : isTodayCompleted ? (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-success-foreground">Feeding Complete</p>
                  <p className="text-xs text-success-foreground/70">
                    Protocol for Day {dynamics?.day} logged.
                    {batch && ['intensive', 'deep_litter', 'cage'].includes(batch.production_system)
                      ? ' Intensive systems also deduct stock and expense when feed stock exists.'
                      : ' Flexible systems log only (optional finance later).'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-muted p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Protein</p>
              <p className="text-lg font-black">{phase?.proteinPct ?? '—'}%</p>
            </div>
            <div className="rounded-xl border border-muted p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Energy</p>
              <p className="text-lg font-black">{phase?.energyKcal ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-muted p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Intake</p>
              <p className="text-lg font-black">{phase?.feedPerBirdG ?? '—'}g</p>
            </div>
            <div className="rounded-xl border border-muted p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Population</p>
              <p className="text-lg font-black">{batch?.current_population ?? '—'}</p>
            </div>
          </div>

          {formulations.length > 0 && (
            <Card className="border-primary/10 shadow-none bg-primary/5">
              <CardHeader className="py-3 px-4 border-b border-primary/10">
                <CardTitle className="text-xs font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                  <Calculator className="h-3 w-3" /> Formulation Records
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-primary/5">
                  {formulations.map(f => (
                    <div key={f.id} className="px-4 py-3 flex items-center justify-between hover:bg-primary/5 transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate capitalize">
                          {f.species} — {f.phase}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase">
                          {f.bags_count} Bags ({f.total_kg}kg)
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black border-primary/20 uppercase tracking-tighter">
                        {f.formulation_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
