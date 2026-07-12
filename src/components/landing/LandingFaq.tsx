import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const items = [
  {
    q: 'Does it work without internet?',
    a: 'Yes. Day-to-day logging is designed offline-first. When you reconnect, pending writes sync in order. Registration still needs a connection once.',
  },
  {
    q: 'What is intensive vs flexible?',
    a: 'Intensive (deep litter, cage, intensive): consumption can auto-deduct stock and create expenses. Flexible (semi-intensive, free range, pasture): you log operations without silent finance — purchases and sales still book.',
  },
  {
    q: 'Which birds are supported?',
    a: 'Broiler, layer, duck (meat or layer), and turkey. Protocols, feed phases, and egg eligibility follow species rules (e.g. layer eggs from week 19).',
  },
  {
    q: 'Is my cost data private?',
    a: 'Cost privacy masks money on shared screens until you reveal it. The farm ledger still stores real amounts for your own reports.',
  },
  {
    q: 'Do I need to pay to start?',
    a: 'Create an account and open a flock free for evaluation. No card required to register.',
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Straight answers
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-8 max-w-2xl">
          {items.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
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
    </section>
  );
}
