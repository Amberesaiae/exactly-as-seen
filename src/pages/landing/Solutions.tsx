import { Link } from 'react-router-dom';
import { PageHero } from '@/components/landing/PageHero';
import { CloseCta } from '@/components/landing/CloseCta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const modules = [
  {
    id: 'batches',
    label: 'Batches',
    title: 'Flock lifecycle',
    path: '/batches',
    body: 'Placement to terminate. Population, phase, week, house occupation, mortality and bird sale — with withdrawal gates.',
    points: [
      'Species + duck type at create',
      'Protocol tasks seeded on confirm',
      'One active flock per house',
    ],
  },
  {
    id: 'feed',
    label: 'Feed',
    title: 'Plan · formulate · log',
    path: '/feed',
    body: 'Ready-made, concentrate, or custom mix. Day feed log is the operational done flag — not a second silent purchase.',
    points: [
      'Local ingredients and safety bounds',
      'On-device LP when you need it',
      'Dual pattern on consumption',
    ],
  },
  {
    id: 'health',
    label: 'Health',
    title: 'Care you can finish',
    path: '/health',
    body: 'Scheduled meds and vaccines, container dosing, conflict checks. Completion can book stock and expense when intensive.',
    points: [
      'C1–C8 matrix (block vs warn)',
      'Withdrawal on flock header',
      'Duck niacin as water care',
    ],
  },
  {
    id: 'eggs',
    label: 'Eggs',
    title: 'Collect and sell cleanly',
    path: '/eggs',
    body: 'Layer week 19+, duck-layer week 20+. Graded inventory and sales blocked while egg withdrawal is active.',
    points: [
      'Collection vs sale split',
      'Inventory RPCs when available',
      'Revenue as egg_sales',
    ],
  },
  {
    id: 'stock',
    label: 'Stock',
    title: 'Lots and FIFO',
    path: '/stock',
    body: 'Purchases open lots with quality grade. Usage and auto-allocation follow FIFO + quality — damaged stays manual.',
    points: [
      'Purchase always expenses',
      'Quality A–C / damaged',
      'Reorder thresholds',
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    title: 'Ledger with privacy',
    path: '/finance',
    body: 'Nine expense categories, five revenue types. Auto rows are idempotent. Mask money on shared devices.',
    points: [
      'amount_pesewas only',
      'auto:* sources',
      'Cost privacy toggle',
    ],
  },
];

export default function Solutions() {
  return (
    <div className="bg-background text-foreground">
      <PageHero
        eyebrow="Solutions"
        title={
          <>
            Modules that share
            <br />
            one flock truth.
          </>
        }
        lead="Six workspaces, one farm. Open a module only when you need it — the batch record stays continuous."
        ctas={[
          { label: 'Create account', to: '/register' },
          { label: 'Platform layers', to: '/platform', variant: 'outline' },
        ]}
        meta={['Batches', 'Feed', 'Health', 'Eggs', 'Stock', 'Finance']}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-0">
          {modules.map((m, i) => (
            <article key={m.id}>
              <div className="grid gap-6 py-10 sm:grid-cols-12 sm:gap-8">
                <div className="sm:col-span-4">
                  <Badge variant="outline" className="font-normal">
                    {m.label}
                  </Badge>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight">{m.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                  <Button className="mt-4" variant="secondary" size="sm" asChild>
                    <Link to="/register">Use after sign-in · {m.path}</Link>
                  </Button>
                </div>
                <Card className="border-border/80 shadow-none sm:col-span-8">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      What you get
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-5">
                    <ul className="space-y-3">
                      {m.points.map((p) => (
                        <li key={p} className="flex gap-3 text-sm">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              {i < modules.length - 1 && <Separator />}
            </article>
          ))}
        </div>
      </section>

      <CloseCta />
    </div>
  );
}
