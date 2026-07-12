import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const tasks = [
  { label: 'Day feed — House A', done: true, meta: '48 kg · deep litter', tone: 'done' as const },
  { label: 'Water + Amprolium course', done: false, meta: 'Due today · Wk 3', tone: 'due' as const },
  { label: 'Lasota vaccination', done: false, meta: 'Day 28 · in 6 days', tone: 'soon' as const },
];

/** Hero product surface — pure shadcn, no stock photography */
export function ProductFrame({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Ledger offset shadow — craft, not glassmorphism */}
      <div
        className="absolute -inset-px translate-x-1.5 translate-y-1.5 rounded-xl border border-border/50 bg-secondary/40"
        aria-hidden
      />
      <Card className="relative overflow-hidden border-border bg-card shadow-none">
        <CardHeader className="space-y-3 border-b border-border bg-muted/50 pb-4 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <CardTitle className="truncate text-sm font-semibold tracking-tight">
                Today · House A
              </CardTitle>
            </div>
            <Badge variant="outline" className="shrink-0 border-primary/30 bg-primary/5 font-normal text-primary">
              Offline
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Birds" value="487" />
            <Stat label="Week" value="3 / 8" />
            <Stat label="Left" value="2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div
            className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-snug text-foreground"
            role="status"
          >
            <span className="font-semibold text-warning">Withdrawal</span>
            <span className="text-muted-foreground"> · meat clear in 2d · sale blocked until then</span>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Cycle</span>
              <span className="tabular-nums text-foreground">Broiler · deep litter</span>
            </div>
            <Progress value={37.5} className="h-1.5" />
          </div>

          <Separator />

          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Task list
            </p>
            <ul className="divide-y divide-border">
              {tasks.map((t) => (
                <li key={t.label} className="flex items-start gap-3 py-3 first:pt-1 last:pb-0">
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] font-bold',
                      t.done
                        ? 'border-primary bg-primary text-primary-foreground'
                        : t.tone === 'due'
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-muted-foreground/35'
                    )}
                    aria-hidden
                  >
                    {t.done ? '✓' : ''}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium leading-snug',
                        t.done && 'text-muted-foreground line-through decoration-muted-foreground/40'
                      )}
                    >
                      {t.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.meta}</p>
                  </div>
                  {!t.done && t.tone === 'due' && (
                    <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
                      Now
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pattern
              </p>
              <p className="text-xs text-foreground">Intensive · auto ledger on confirm</p>
            </div>
            <Button size="sm" variant="secondary" className="pointer-events-none h-8 shrink-0 text-xs" tabIndex={-1}>
              Log feed
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-background px-2 py-2 text-left">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
}
