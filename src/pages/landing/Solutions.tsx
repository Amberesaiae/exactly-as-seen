import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, Bird, FlaskConical, HeartPulse, LineChart, Egg, Boxes } from 'lucide-react';
import { Eyebrow } from '@/components/landing/LandingLayout';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const MODULES = [
  { icon: Bird, eyebrow: 'Flock Intelligence', title: 'Batch lifecycle, end to end.',
    body: 'Every batch — broiler, layer or breeder — owns a five-tab record: overview, feed, health, harvest, ledger. A state machine blocks impossible transitions (no egg sales during a withdrawal, no closure with open expenses).',
    bullets: [
      'Reference curves: Cobb 500, Ross 308, Lohmann Brown',
      'Daily counts, weight sampling, FCR rollups',
      'Mortality with 9-cause tagging and house-level heatmap',
      'Performance Index per batch (0–100, explainable)',
    ],
    image: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=1400&q=80&auto=format&fit=crop',
    species: 'Broilers · Layers · Breeders',
    to: '/batches' },

  { icon: FlaskConical, eyebrow: 'Feed Lab', title: 'Three methods, one optimiser.',
    body: 'Ready-made for quick days, concentrate-mix for premix users, custom LP for full-control formulators. All three paths land in the same audit trail and deduct from the same stock.',
    bullets: [
      'Pyomo LP solver — 22 ingredients, sub-second solve',
      'Ghana & Nigeria ingredient libraries with live market pricing',
      'Aflatoxin caps, salt ceilings, calcium/phosphorus ratios',
      'Withdrawal-period guards block unsafe ration approval',
    ],
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1400&q=80&auto=format&fit=crop',
    species: 'Maize · Soya · Wheat bran · Fish meal · Premix',
    to: '/feed' },

  { icon: HeartPulse, eyebrow: 'Care & Water', title: 'Vaccinations never late.',
    body: 'Species- and age-aware protocols (Newcastle, IBD, Marek, IB) auto-schedule on batch creation. Water-intake logs flag dehydration days before mortality spikes. Withdrawal alerts block egg and meat sales while treatment is active.',
    bullets: [
      'Auto-generated calendars per breed and placement date',
      'Daily water intake vs. expected — anomaly alerts',
      'Withdrawal-period engine (7, 14, 21-day enforcement)',
      'Treatment cost auto-posted to the batch ledger',
    ],
    image: 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?w=1400&q=80&auto=format&fit=crop',
    species: 'Day-old chicks · Growers · Adult flocks',
    to: '/health' },

  { icon: Egg, eyebrow: 'Egg Harvest', title: 'Size-graded daily, sold smart.',
    body: 'Record by grade (small, medium, large, jumbo, cracked), watch hen-day rate against the breed curve, and reconcile sales by channel — wholesaler, hatchery, retail, self-consumption.',
    bullets: [
      'Per-grade daily entry on one screen',
      'Hen-day rate vs. flock-age reference curve',
      'Sales channel breakdown & margin per channel',
      'Withdrawal block prevents tainted-egg sales',
    ],
    image: 'https://images.unsplash.com/photo-1569288063643-5d29ad6ad7a5?w=1400&q=80&auto=format&fit=crop',
    species: 'Layer farms · Mixed flocks',
    to: '/eggs' },

  { icon: LineChart, eyebrow: 'Ledger', title: 'Honest margin, every time.',
    body: 'Expenses, revenues and harvest reconcile into real cost per egg, per bird, per crate. Compare cycles, periods and houses. Toggle privacy mask when the device is shared with workers.',
    bullets: [
      'Period filter — day, week, cycle, custom range',
      'Category breakdown: feed, vet, labour, utilities, fixed',
      'Cost-privacy masking (one-tap)',
      'Per-batch profit reconciliation on closure',
    ],
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80&auto=format&fit=crop',
    species: 'All operations',
    to: '/finance' },

  { icon: Boxes, eyebrow: 'Inventory', title: 'No more silent stockouts.',
    body: 'Feed, vaccines, drugs, equipment and packaging — tracked with reorder thresholds. Usage auto-deducts when the Feed Lab mixes a ration or the Care module administers a dose.',
    bullets: [
      'Low-stock alerts with reorder-point calculation',
      'Purchase history with unit-cost trend',
      'Auto-deduction from Feed Lab & Care & Water',
      'Category tabs: feed, health, packaging, capex',
    ],
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&q=80&auto=format&fit=crop',
    species: 'Feed · Vet supplies · Equipment',
    to: '/stock' },
];

export default function Solutions() {
  return (
    <div>
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-10 pb-16 lg:pt-16">
        <Eyebrow>Solutions</Eyebrow>
        <h1 className="mt-6 max-w-4xl text-5xl sm:text-6xl lg:text-[88px] font-black leading-[0.95] tracking-tight">
          Six modules. One <span className="italic font-serif font-normal text-primary">quiet</span> rhythm.
        </h1>
        <p className="mt-7 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Each module solves a real daily pain — and each one is dovetailed, so logging once updates feed stock, the ledger, and the performance curve at the same time.
        </p>
      </section>

      <section className="bg-secondary/30 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-20">
          {MODULES.map((m, idx) => (
            <motion.div key={m.title} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                        className={`grid gap-10 lg:grid-cols-12 items-center ${idx % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
              <div className="lg:col-span-6">
                <div className="aspect-[16/10] overflow-hidden rounded-[28px]">
                  <img src={m.image} alt={m.eyebrow} loading="lazy" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="lg:col-span-6 lg:px-6">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                  <m.icon className="h-5 w-5" /> {m.eyebrow}
                </div>
                <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.02]">{m.title}</h2>
                <p className="mt-5 text-muted-foreground leading-relaxed">{m.body}</p>
                <ul className="mt-6 grid sm:grid-cols-2 gap-y-2 gap-x-6">
                  {m.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Built for: <span className="text-foreground">{m.species}</span>
                </div>
                <Link to={m.to} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4">
                  Explore {m.eyebrow} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24">
        <div className="rounded-[32px] bg-foreground text-background px-8 py-16 lg:px-16 lg:py-20">
          <Eyebrow><span className="text-background/70">Ready when you are</span></Eyebrow>
          <h2 className="mt-5 max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02]">
            Start with one module. Add the rest when it feels right.
          </h2>
          <Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3.5 text-sm font-semibold text-foreground">
            Create free farm <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
