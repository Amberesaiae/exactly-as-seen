import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, Wifi, Database, Shield, Globe2, Cpu, BarChart3 } from 'lucide-react';
import { Eyebrow } from '@/components/landing/LandingLayout';

const IMG = {
  // Vertical portrait of brown laying hens — apt for "behind every flock"
  portrait: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=1200&q=80&auto=format&fit=crop',
  field: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=80&auto=format&fit=crop',
  // Species line-up
  broiler: 'https://images.unsplash.com/photo-1569288063643-5d29ad6ad7a5?w=900&q=80&auto=format&fit=crop',
  layer: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80&auto=format&fit=crop',
  chick: 'https://images.unsplash.com/photo-1444465693019-aa0b6392460d?w=900&q=80&auto=format&fit=crop',
  breeder: 'https://images.unsplash.com/photo-1556386734-04d24c5708d4?w=900&q=80&auto=format&fit=crop',
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const PILLARS = [
  { icon: Wifi, title: 'Offline-first by design',
    body: 'A local IndexedDB cache backs every screen. Workers log feed, mortality and eggs from inside the house; the queued events sync the moment a 2G signal returns — no double entry, no overwritten records.' },
  { icon: Cpu, title: 'Pyomo LP feed optimiser',
    body: 'A real linear-programming solver computes least-cost rations under 14 nutrient bands, 3 toxin caps, and per-species safety floors. Solves a 22-ingredient diet under one second on a mid-range phone.' },
  { icon: Database, title: 'Dovetail Synergy ledger',
    body: 'Feed mixed, vaccine drawn, eggs sold, mortality logged — each event reconciles into a single batch ledger. Cost per egg and cost per kilo are computed, not estimated.' },
  { icon: Shield, title: 'Role-aware privacy',
    body: 'Owner, manager and field-worker roles. A privacy mask hides all monetary values on shared house tablets while still allowing operational logging. RLS enforced server-side.' },
  { icon: Globe2, title: 'Built for West Africa',
    body: 'Cedi, Naira and CFA pricing. Ghanaian and Nigerian ingredient libraries. Climate-adjusted vaccination windows. EN, FR and TWI interfaces with offline-downloadable translations.' },
  { icon: BarChart3, title: 'Performance Index',
    body: 'A single 0–100 score per batch combines FCR, mortality, growth-curve adherence and laying rate. Tap-through to see exactly which input dragged the number down this week.' },
];

const STACK = [
  ['01', 'Capture layer',
   'Tap-optimised forms tuned for the field — counts, weights, feed bags, eggs by grade, mortality with cause tags. Voice-note attachments for low-literacy workers.'],
  ['02', 'Optimisation layer',
   'Pyomo LP solver for feed, withdrawal-period engine for health, species-aware safety bands. Recommendations cite the constraint that drove them.'],
  ['03', 'Ledger layer',
   'Every expense, sale, harvest and mortality reconciles into a per-batch and per-house ledger. Exportable to CSV and Excel for accountants and lenders.'],
  ['04', 'Insight layer',
   'Trend curves, anomaly alerts, and the Performance Index. Decisions surface as actions ("rebalance feed B by +1.2% lysine") before issues compound.'],
];

const SPECIES = [
  { img: IMG.broiler, name: 'Broilers',
    body: 'Day-0 to slaughter, optimised for 1.6–1.9 FCR. Growth-curve tracking against Cobb 500 and Ross 308 references.',
    spec: 'FCR · ADG · liveweight' },
  { img: IMG.layer, name: 'Layers',
    body: 'Lohmann Brown, Isa Brown and Bovans. Per-grade daily egg entry; rate-vs-age curve from week 18 onward.',
    spec: 'Hen-day · grade mix · feed/dozen' },
  { img: IMG.breeder, name: 'Breeders',
    body: 'Parent-stock cycles with male/female feeding regimes, fertility tracking, and hatchability rollups.',
    spec: 'Fertility · hatchability · uniformity' },
  { img: IMG.chick, name: 'Day-old chicks',
    body: 'Brooder-phase microclimate logs, navel quality scoring, and 7-day mortality benchmarking by hatchery.',
    spec: 'Brooder temp · 7-day mortality' },
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
              LampFarms is built on four layers — capture, optimise, ledger, insight — engineered to run on 2G phones inside warm, dusty houses. No spreadsheets stitched together. No guesswork on cost per bird.
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
              <img src={IMG.portrait} alt="Brown laying hens in a ventilated poultry house" className="h-full w-full object-cover" loading="eager" />
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
              <p className="mt-5 text-muted-foreground max-w-sm">Each pillar maps to a real failure mode farmers face — connectivity loss, feed-price shocks, withdrawal mistakes, opaque margins, theft on shared devices.</p>
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
        <p className="mt-5 max-w-2xl text-muted-foreground leading-relaxed">
          Most farm software stops at capture. We close the loop — every data point you enter is consumed by the optimiser, the ledger, or the insight engine on the same screen, in the same second.
        </p>
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

      {/* SPECIES SUPPORTED */}
      <section className="border-y border-foreground/10 bg-secondary/30 py-24 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div className="max-w-xl">
              <Eyebrow>Species coverage</Eyebrow>
              <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.02]">
                Tuned to the bird, not the textbook.
              </h2>
            </div>
            <p className="text-muted-foreground max-w-sm">
              Reference curves, nutrient floors and vaccination windows shift with species and breed. LampFarms ships with country-validated tables for what West African farmers actually rear.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SPECIES.map(s => (
              <motion.div key={s.name} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                          className="rounded-[24px] overflow-hidden bg-background">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={s.img} alt={s.name} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black tracking-tight">{s.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{s.spec}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16">
        <div className="overflow-hidden rounded-[32px]">
          <img src={IMG.field} alt="Farmland panorama at sunrise" className="h-[40vh] sm:h-[55vh] w-full object-cover" loading="lazy" />
        </div>
      </section>
    </div>
  );
}
