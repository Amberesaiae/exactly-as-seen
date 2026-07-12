import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const modules = [
  {
    id: 'batches',
    label: 'Batches',
    title: 'Flock lifecycle',
    lead: 'From placement to termination with population, phase, and week kept honest.',
    points: [
      'Species protocols for broiler, layer, duck (meat/layer), turkey',
      'Mortality and bird sale with withdrawal gates',
      'House occupation — one active flock per house',
    ],
  },
  {
    id: 'feed',
    label: 'Feed',
    title: 'Plan, formulate, log',
    lead: 'Ready-made, concentrate, or custom mix with local ingredients — then a simple day log.',
    points: [
      'On-device LP where it helps (not a black-box cloud solver)',
      'Safety bounds and toxin binder rules',
      'No double-booking kg when you already purchased feed',
    ],
  },
  {
    id: 'health',
    label: 'Health',
    title: 'Care you can complete',
    lead: 'Scheduled tasks, container dosing, and conflict checks that block dangerous combos.',
    points: [
      'C1–C8 medication matrix (fatal risks block; timing issues warn)',
      'Withdrawal countdown on the flock header',
      'Water-additive niacin for ducks — not buried in feed math',
    ],
  },
  {
    id: 'money',
    label: 'Money',
    title: 'Ledger with privacy',
    lead: 'Nine expense categories, five revenue types, cost privacy when the book is shared.',
    points: [
      'Idempotent auto rows: auto:feed, auto:health, auto:sale…',
      'Manual entries when the system should stay quiet',
      'Mask amounts until you choose to reveal',
    ],
  },
];

export function ModuleTabs() {
  return (
    <section id="modules" className="border-y border-border bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Modules
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            One product. Four workspaces.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Not four disconnected apps — the same flock, same farm, same day.
          </p>
        </div>

        <Tabs defaultValue="batches" className="mt-10">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-border bg-muted/40 p-1">
            {modules.map((m) => (
              <TabsTrigger
                key={m.id}
                value={m.id}
                className="rounded-md px-3 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {modules.map((m) => (
            <TabsContent key={m.id} value={m.id} className="mt-6 focus-visible:outline-none">
              <Card className="border-border/80 shadow-none">
                <CardContent className="grid gap-6 p-6 sm:grid-cols-12 sm:p-8">
                  <div className="sm:col-span-5">
                    <Badge variant="outline" className="font-normal">
                      {m.label}
                    </Badge>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight">{m.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.lead}</p>
                  </div>
                  <ul className="space-y-3 sm:col-span-7">
                    {m.points.map((p) => (
                      <li key={p} className="flex gap-3 text-sm leading-relaxed">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                        <span className="text-foreground/90">{p}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
