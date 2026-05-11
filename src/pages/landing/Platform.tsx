import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, Wifi, Database, Shield, Globe2, Cpu, BarChart3 } from 'lucide-react';
import { Eyebrow } from '@/components/landing/LandingLayout';

const IMG = {
  hero: 'https://images.unsplash.com/photo-1535086181678-5a5c4d22f56b?w=1800&q=80&auto=format&fit=crop',
  arch: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1400&q=80&auto=format&fit=crop',
  field: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80&auto=format&fit=crop',
  device: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&q=80&auto=format&fit=crop',
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const PILLARS = [
  { icon: Wifi, title: 'Offline-first', body: 'Every screen works without network. Data syncs the moment connection returns — no double entry, no lost logs.' },
  { icon: Cpu, title: 'Pyomo LP optimiser', body: 'A real linear-programming engine computes least-cost feed blends with West African nutrient and safety constraints.' },
  { icon: Database, title: 'Dovetail Synergy', body: 'Feed, health, and expense events stitch into one ledger — so the cost per egg or per kilo is honest, not estimated.' },
  { icon: Shield, title: 'Privacy & masking', body: 'Toggle cost privacy for shared devices. Roles separate the manager view from the field worker view.' },
  { icon: Globe2, title: 'Built for West Africa', body: 'Withdrawal periods, local ingredients, climate-aware vaccination schedules, EN · FR · TWI interfaces.' },
  { icon: BarChart3, title: 'Performance index', body: 'One unified score per batch — feed conversion, mortality, growth — surfaced where you act, not buried in reports.' },
];

const STACK = [
  ['01', 'Capture layer', 'Lightweight forms tuned for the field — counts, weights, feed bags, mortality. One-tap entries from any phone.'],
  ['02', 'Optimisation layer', 'Pyomo LP solver, withdrawal-period rules, species-aware safety bands, dovetailed across feed and health.'],
  ['03', 'Ledger layer', 'Every expense, sale, harvest and adjustment reconciled into a single source of truth — exportable, auditable.'],
  ['04', 'Insight layer', 'Trends, alerts, and performance index per batch. Decisions surface before issues compound.'],
];

export default function Platform() {
  return (
    <div>
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-10 pb-16 lg:pt-16">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="lg:col-span-7">
            <Eyebrow>The platform</Eyebrow>
            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-[88px] font-black leading-[0.95] tracking-tight">
              One quiet system <span className="italic font-serif font-normal text-primary">behind</span> every flock.
            </h1>
            <p className="mt-7 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              LampFarms is built on four layers — capture, optimise, ledger, insight — that work even when the network does not. No spreadsheets stitched together. No guesswork on cost per bird.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background hover:bg-foreground/90 transition">
                Try the platform <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/solutions" className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-6 py-3.5 text-sm font-semibold hover:bg-foreground/5">
                See the modules
              </Link>
            </div>
          </motion.div>
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.15 }} className="lg:col-span-5">
            <div className="aspect-[4/5] overflow-hidden rounded-[32px] bg-secondary">
              <img src={IMG.device} alt="Farm worker logging data on phone" className="h-full w-full object-cover" loading="eager" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-foreground/10 bg-secondary/30 py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <Eyebrow>Pillars</Eyebrow>
              <h2 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight leading-[1.02]">Six pillars. One outcome.</h2>
              <p className="mt-5 text-muted-foreground max-w-sm">Each pillar maps to a real failure mode farmers face — connectivity, feed cost, withdrawal mistakes, opaque margins.</p>
            </div>
            <div className="lg:col-span-8 grid gap-6 sm:grid-cols-2">
              {PILLARS.map(p => (
                <motion.div key={p.title} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                            className="rounded-[24px] bg-background p-7">
                  <p.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 text-xl font-black tracking-tight">{p.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
        <Eyebrow>The stack</Eyebrow>
        <h2 className="mt-5 max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02]">
          Four layers, dovetailed.
        </h2>
        <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {STACK.map(([n, t, b]) => (
            <motion.div key={n} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                        className="border-t border-foreground/15 pt-6">
              <div className="text-sm font-bold tracking-[0.2em] text-primary">{n}</div>
              <h3 className="mt-4 text-2xl font-black tracking-tight">{t}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{b}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-16">
        <div className="overflow-hidden rounded-[32px]">
          <img src={IMG.field} alt="Farmland panorama" className="h-[40vh] sm:h-[55vh] w-full object-cover" loading="lazy" />
        </div>
      </section>
    </div>
  );
}
