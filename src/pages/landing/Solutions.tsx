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
    body: 'Every batch — broiler, layer, breeder — gets a 5-tab record: overview, feed, health, eggs, finance. State machine prevents impossible transitions.',
    bullets: ['Species-aware reference tables', 'Daily counts & weight curves', 'Mortality root-cause tagging', 'Performance index per batch'],
    image: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=1400&q=80&auto=format&fit=crop',
    to: '/batches' },
  { icon: FlaskConical, eyebrow: 'Feed Lab', title: 'Three methods, one optimiser.',
    body: 'Ready-made for quick days, concentrate-mix for premix users, custom LP for full-control formulators. All paths land in the same audit trail.',
    bullets: ['Pyomo LP least-cost solver', 'West African ingredient library', 'Withdrawal-period & toxin guards', 'Auto stock deduction on save'],
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1400&q=80&auto=format&fit=crop',
    to: '/feed' },
  { icon: HeartPulse, eyebrow: 'Care & Water', title: 'Vaccinations never late.',
    body: 'Protocols by species and age. Daily water logs. Withdrawal alerts that block egg sales when treatments are active.',
    bullets: ['Auto-generated vaccine calendars', 'Water consumption tracking', 'Withdrawal-period enforcement', 'Treatment cost auto-logged'],
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1400&q=80&auto=format&fit=crop',
    to: '/health' },
  { icon: Egg, eyebrow: 'Egg Production', title: 'Size-graded daily, sold smart.',
    body: 'Record by size grade, see expected vs actual, watch the rate curve. Sales reconcile straight into the ledger.',
    bullets: ['Per-grade daily entry', 'Rate vs flock-age curve', 'Sales channel breakdown', 'Withdrawal-blocked safety'],
    image: 'https://images.unsplash.com/photo-1569288063643-5d29ad6ad7a5?w=1400&q=80&auto=format&fit=crop',
    to: '/eggs' },
  { icon: LineChart, eyebrow: 'Finance', title: 'Honest margin, every time.',
    body: 'Expenses, revenues, and harvest output reconcile into real cost per egg, per bird, per crate. Privacy mask for shared devices.',
    bullets: ['Period filtering & comparisons', 'Category breakdowns', 'Cost-privacy masking', 'Profit reconciliation per batch'],
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80&auto=format&fit=crop',
    to: '/finance' },
  { icon: Boxes, eyebrow: 'Stock Management', title: 'No more silent stockouts.',
    body: 'Feed, vaccines, equipment — tracked with low-stock alerts. Usage auto-deducts when modules log activity.',
    bullets: ['Low-stock thresholds & alerts', 'Purchase & usage history', 'Auto-deduction from feed/health', 'Category tabs & search'],
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&q=80&auto=format&fit=crop',
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
          Each module solves a real daily pain — and each one is integrated through Dovetail Synergy so logging once updates everything downstream.
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
                <Link to={m.to} className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4">
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
