import { WifiOff, Scale, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const proofs = [
  {
    icon: WifiOff,
    title: 'Offline first',
    body: 'Log mortality, feed, and care in the house. Sync when the signal returns — nothing waits on the cloud.',
  },
  {
    icon: Scale,
    title: 'Dual production pattern',
    body: 'Intensive flocks auto-ledger consumption. Semi-intensive and free-range stay manual so foraging farms are not over-booked.',
  },
  {
    icon: ShieldAlert,
    title: 'Withdrawal hard stops',
    body: 'Medication windows block bird sale and normal termination until meat or egg withdrawal clears.',
  },
];

export function ProofStrip() {
  return (
    <section id="proof" className="border-y border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Built for the pen
          </p>
          <p className="max-w-sm text-xs text-muted-foreground sm:text-right">
            Not a pitch deck. Constraints from real houses and real weather.
          </p>
        </div>
        <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {proofs.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="rounded-none border-0 shadow-none">
              <CardContent className="h-full bg-card p-5 sm:p-6">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden />
                <h3 className="mt-4 text-sm font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
