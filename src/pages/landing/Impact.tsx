import { PageHero } from '@/components/landing/PageHero';
import { CloseCta } from '@/components/landing/CloseCta';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/** Honest framing: outcomes we optimise for — not invented vanity metrics. */
const outcomes = [
  {
    title: 'Fewer forgotten tasks',
    body: 'Seeded vaccines and day lists surface work before it is late. Compliance is a checklist, not a memory test.',
  },
  {
    title: 'Less feed waste on paper',
    body: 'Day logs and formulations share one flock context. Intensive paths can deduct stock so bags are not double-counted by accident.',
  },
  {
    title: 'Safer harvest timing',
    body: 'Withdrawal clocks block sale and normal terminate while meat or egg windows are active.',
  },
  {
    title: 'Margin you can defend',
    body: 'Expenses and revenue land with sources. Cost privacy hides amounts on a shared tablet without deleting the books.',
  },
];

const notes = [
  {
    initials: 'KA',
    name: 'Kwesi A.',
    place: 'Layers · Ashanti',
    quote:
      'I log from the house with no bars. When I get to the road it catches up. That is the only software that survived our rainy-season route.',
  },
  {
    initials: 'MT',
    name: 'Martin T.',
    place: 'Broiler co-op · Ashanti',
    quote:
      'The dual pattern matters. Our free-range ducks are not intensive — we refuse silent expenses. Purchases still book when we buy bags.',
  },
  {
    initials: 'AB',
    name: 'Ama B.',
    place: 'Mixed flock · Northern',
    quote:
      'Workers never see the money numbers. They still complete feed and mortality. That split is why the tablet stays in the house.',
  },
];

const measures = [
  { label: 'What we measure', value: 'Tasks done · feed kg · mortality · sales' },
  { label: 'What we do not fake', value: '“500+ farms” wall numbers without your ledger' },
  { label: 'How to verify', value: 'Your batch P&L after a real cycle' },
];

export default function Impact() {
  return (
    <div className="bg-background text-foreground">
      <PageHero
        eyebrow="Impact"
        title={
          <>
            What should change
            <br />
            after a real cycle.
          </>
        }
        lead="We do not lead with invented dashboard vanity. These are the outcomes the product is built to produce when you log honestly."
        ctas={[
          { label: 'Start a flock', to: '/register' },
          { label: 'Read FAQ', to: '/welcome#faq', variant: 'outline' },
        ]}
        meta={['Task completion', 'Feed discipline', 'Safe sale windows', 'Defensible margin']}
      />

      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Measurement honesty
          </p>
          <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            {measures.map((m) => (
              <div key={m.label} className="bg-card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </p>
                <p className="mt-2 text-sm font-medium leading-snug">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Outcomes we optimise for
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {outcomes.map((o) => (
            <Card key={o.title} className="border-border/80 shadow-none">
              <CardContent className="p-5 sm:p-6">
                <h3 className="text-sm font-semibold tracking-tight">{o.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Field notes
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Voices, not stock portraits
          </h2>
          <div className="mt-10 space-y-0">
            {notes.map((n, i) => (
              <div key={n.name}>
                <div className="grid gap-4 py-8 sm:grid-cols-12 sm:gap-8">
                  <div className="flex items-center gap-3 sm:col-span-4">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-secondary text-xs font-semibold">
                        {n.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{n.name}</p>
                      <p className="text-xs text-muted-foreground">{n.place}</p>
                    </div>
                  </div>
                  <blockquote className="text-base leading-relaxed text-foreground/90 sm:col-span-8 sm:text-lg">
                    “{n.quote}”
                  </blockquote>
                </div>
                {i < notes.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <CloseCta />
    </div>
  );
}
