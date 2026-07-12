import { Link } from 'react-router-dom';
import { PageHero } from '@/components/landing/PageHero';
import { CloseCta } from '@/components/landing/CloseCta';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const layers = [
  {
    n: '01',
    title: 'Capture',
    body: 'Tap forms for counts, bags, water, mortality. IndexedDB holds the queue when the house has no bars.',
  },
  {
    n: '02',
    title: 'Optimise',
    body: 'On-device feed LP, conflict matrix C1–C8, withdrawal clocks. Advice stays local until you choose to sync.',
  },
  {
    n: '03',
    title: 'Ledger',
    body: 'Intensive consumption can auto-book stock and expense. Flexible systems log work without silent charges. Purchases and sales always book.',
  },
  {
    n: '04',
    title: 'Insight',
    body: 'Week progress, task lists, cost privacy, cycle comparisons — numbers from your logs, not a vanity dashboard.',
  },
];

const pillars = [
  {
    title: 'Offline-first',
    body: 'Workers log inside the house. Sync runs when 2G returns. No double entry if the same day is open twice.',
  },
  {
    title: 'Dual production pattern',
    body: 'Deep litter and cage can auto-ledger. Semi-intensive, free range, and pasture stay manual on consumption.',
  },
  {
    title: 'Species protocols',
    body: 'Broiler, layer, duck (meat/layer), turkey — vaccines, niacin, blackhead windows seeded at batch create.',
  },
  {
    title: 'West Africa context',
    body: 'GHS/NGN money as integer minor units, container dosing, market ingredients, farm timezone Africa/Accra default.',
  },
  {
    title: 'Cost privacy',
    body: 'Mask amounts on a shared tablet. Operational logging stays available; money is owner-controlled.',
  },
  {
    title: 'Safety gates',
    body: 'Withdrawal blocks bird sale and normal terminate. Live vaccine and antibiotic windows refuse bad combos.',
  },
];

const species = [
  { name: 'Broiler', cycle: '6–8 weeks default', focus: 'FCR · mortality · 5-vax seed' },
  { name: 'Layer', cycle: '72–78 weeks', focus: 'Eggs Wk 19+ · calcium · long care' },
  { name: 'Duck', cycle: 'Meat 8–10 · Layer 72+', focus: 'Niacin · DVH · dual type' },
  { name: 'Turkey', cycle: '12–20 weeks', focus: 'Blackhead · heat · water' },
];

export default function Platform() {
  return (
    <div className="bg-background text-foreground">
      <PageHero
        eyebrow="Platform"
        title={
          <>
            Four layers.
            <br />
            One flock record.
          </>
        }
        lead="Capture, optimise, ledger, insight — engineered for dusty houses and weak signal, not for a demo stage."
        ctas={[
          { label: 'Open free farm', to: '/register' },
          { label: 'See modules', to: '/solutions', variant: 'outline' },
        ]}
        meta={['No spreadsheets', 'Local-first writes', 'Sync when ready']}
      />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Architecture
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          How the system is stacked
        </h2>
        <ol className="mt-10">
          {layers.map((l, i) => (
            <li key={l.n}>
              <div className="grid gap-3 py-7 sm:grid-cols-12 sm:gap-6">
                <div className="font-mono text-sm text-primary sm:col-span-2">{l.n}</div>
                <div className="text-base font-semibold sm:col-span-3">{l.title}</div>
                <p className="text-sm leading-relaxed text-muted-foreground sm:col-span-7">
                  {l.body}
                </p>
              </div>
              {i < layers.length - 1 && <Separator />}
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-muted/25">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Design constraints
          </p>
          <h2 className="mt-2 max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
            What we refuse to paper over
          </h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <Card key={p.title} className="rounded-none border-0 shadow-none">
                <CardContent className="h-full bg-card p-5 sm:p-6">
                  <h3 className="text-sm font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Species
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Supported birds
            </h2>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/solutions">Open module map</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {species.map((s) => (
            <Card key={s.name} className="border-border/80 shadow-none">
              <CardContent className="p-5">
                <Badge variant="outline" className="font-normal">
                  {s.name}
                </Badge>
                <p className="mt-3 text-sm font-medium">{s.cycle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.focus}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <CloseCta />
    </div>
  );
}
