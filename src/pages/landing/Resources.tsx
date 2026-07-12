import { Link } from 'react-router-dom';
import { PageHero } from '@/components/landing/PageHero';
import { CloseCta } from '@/components/landing/CloseCta';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const guides = [
  {
    tag: 'Operations',
    title: 'Daily list: feed, water, care',
    body: 'How the dashboard, Health, and Feed share one “today” without triple entry.',
  },
  {
    tag: 'Safety',
    title: 'Withdrawal and sale blocks',
    body: 'Why meat and egg windows disable sale and normal terminate — and what emergency still allows.',
  },
  {
    tag: 'Finance',
    title: 'Intensive vs flexible books',
    body: 'When consumption auto-ledgers, when it does not, and why purchases always book.',
  },
  {
    tag: 'Nutrition',
    title: 'Formulate without double-counting kg',
    body: 'Purchase path vs day log vs custom allocation — one physical bag, one expense story.',
  },
  {
    tag: 'Species',
    title: 'Duck type and egg eligibility',
    body: 'Meat vs layer duck, week 19 layers, week 20 duck-layer — what UI should hide.',
  },
  {
    tag: 'Stack',
    title: 'Local backend without Windows admin',
    body: 'WSL Engine + stack:up / stack:env. See docs/NO_ADMIN_STACK.md in the repo.',
  },
];

const faq = [
  {
    q: 'Does LampFarms work offline?',
    a: 'Day-to-day logging is designed offline-first. Registration needs a connection once. Sync flushes pending writes when online.',
  },
  {
    q: 'Which species are supported?',
    a: 'Broiler, layer, duck (meat or layer), and turkey. Protocols and egg rules follow species and week.',
  },
  {
    q: 'How is money stored?',
    a: 'Integer minor units (pesewas/kobo). Categories are fixed CHECK slugs. Auto rows use unique (source, source_ref).',
  },
  {
    q: 'Can workers see profit?',
    a: 'Cost privacy masks amounts until you reveal them. Roles and device sharing are owner-controlled.',
  },
  {
    q: 'Where is the product docs?',
    a: 'In-repo: docs/CANONICAL_JOURNEYS.md, docs/CANONICAL_RUNTIME.md, docs/LANDING_REDESIGN.md, and specs/.',
  },
];

export default function Resources() {
  return (
    <div className="bg-background text-foreground">
      <PageHero
        eyebrow="Resources"
        title={
          <>
            Field notes &
            <br />
            straight answers.
          </>
        }
        lead="No stock magazine layout. Guides map to real product behaviour — dual pattern, withdrawal, offline, species rules."
        ctas={[
          { label: 'Open free farm', to: '/register' },
          { label: 'Home', to: '/welcome', variant: 'outline' },
        ]}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Guides
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Topics that match the software
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <Card key={g.title} className="border-border/80 shadow-none">
              <CardContent className="flex h-full flex-col p-5">
                <Badge variant="outline" className="w-fit font-normal">
                  {g.tag}
                </Badge>
                <h3 className="mt-3 text-sm font-semibold leading-snug tracking-tight">
                  {g.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {g.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                FAQ
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Common questions
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Same substance as the home FAQ — kept here for deep links from the nav.
              </p>
              <Button className="mt-6" variant="outline" size="sm" asChild>
                <Link to="/welcome#faq">Also on home</Link>
              </Button>
            </div>
            <div className="lg:col-span-8">
              <Accordion type="single" collapsible className="w-full">
                {faq.map((item, i) => (
                  <AccordionItem key={item.q} value={`r-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-medium sm:text-base">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Separator className="mb-10" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Prefer docs in git over a fake content CMS.
          </p>
          <Button asChild>
            <Link to="/register">Start with a flock</Link>
          </Button>
        </div>
      </section>

      <CloseCta />
    </div>
  );
}
