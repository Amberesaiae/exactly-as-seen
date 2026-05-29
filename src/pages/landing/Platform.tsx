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
  { icon: Cpu, title: 'WASM LP feed optimiser',
    body: 'A high-performance linear-programming solver (HiGHS) computes least-cost rations under 10+ nutrient parameters, aflatoxin caps, and per-species safety floors. Solves a 48-ingredient diet in milliseconds.' },
  { icon: Database, title: 'Dovetail Synergy ledger',
    body: 'Feed mixed, vaccine drawn, birds sold, mortality logged — each event reconciles into a single batch ledger. Cost per bird and revenue per cycle are computed automatically, not estimated.' },
  { icon: Shield, title: 'Role-aware privacy',
    body: 'Owner, manager and field-worker roles. A privacy mask hides all monetary values on shared house tablets while still allowing operational logging. Persistent across devices.' },
  { icon: Globe2, title: 'Built for West Africa',
    body: 'Cedi-based ledger with regional temperature fallbacks for water planning. Ghana-validated ingredient libraries (HQCP Cassava, BSF Larvae). Twi interface support for field workers.' },
  { icon: BarChart3, title: 'Precision Protocols',
    body: '72+ pre-loaded medication and vaccination protocols for Broiler, Layer, Duck and Turkey. Automated withdrawal periods ensure food safety and regulatory compliance.' },
];

const STACK = [
  ['01', 'Capture layer',
   'Tap-optimised forms tuned for the field — counts, feed bags, water logs, mortality with cause tags. Designed for dusty environments and 2G connectivity.'],
  ['02', 'Optimisation layer',
   'HiGHS WASM solver for feed, withdrawal-period engine for health, species-aware safety bands. Recommendations provide actionable infeasibility advice.'],
  ['03', 'Ledger layer',
   'Every expense, sale, and mortality reconciles into a per-batch ledger. Centralized synergy service ensures data integrity across finance and operations.'],
  ['04', 'Insight layer',
   'Protocol trend adherence, heat-stress anomaly alerts, and lean guidance tips. Decisions surface as suggestions before issues compound.'],
];

const SPECIES = [
  { img: IMG.broiler, name: 'Broilers',
    body: 'Day-0 to slaughter, optimised for West African commercial cycles. Growth-curve tracking and FCR benchmarks included.',
    spec: 'FCR · ADG · liveweight' },
  { img: IMG.layer, name: 'Layers',
    body: '68-week production cycle. Comprehensive health protocols including Fowl Pox and monthly deworming. Per-grade daily egg tracking.',
    spec: 'Hen-day · withdrawal · calcium' },
  { img: IMG.breeder, name: 'Ducks',
    body: 'Meat and Egg varieties. Specialized Niacin requirement alerts and Viral Hepatitis / Duck Plague vaccination protocols.',
    spec: 'Niacin · water · meat/egg' },
  { img: IMG.chick, name: 'Turkeys',
    body: '16-week cycle with Blackhead disease prevention alerts. Higher water-intake logic and intensive vaccination schedules.',
    spec: 'Blackhead · heat-stress · water' },
];

export default function Platform() {
  return (
    <div className="bg-background text-foreground">
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-10 items-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="lg:col-span-7">
            <Eyebrow>The platform</Eyebrow>
            <h1 className="mt-8 text-5xl sm:text-7xl lg:text-[100px] font-black leading-[0.9] tracking-tighter">
              A quiet system <br />
              <span className="italic font-serif font-normal text-primary">behind</span> every flock.
            </h1>
            <p className="mt-10 max-w-xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              LampFarms is built on four layers — capture, optimise, ledger, insight — engineered to run on 2G phones inside warm, dusty houses. No spreadsheets. No guesswork.
            </p>
            <div className="mt-12 flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4.5 text-sm font-bold text-background hover:bg-foreground/90 transition shadow-2xl shadow-foreground/10">
                Try the platform <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/solutions" className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-8 py-4.5 text-sm font-bold hover:bg-foreground/5 transition">
                See the modules
              </Link>
            </div>
          </motion.div>
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.15 }} className="lg:col-span-5">
            <div className="aspect-[4/5] overflow-hidden rounded-[40px] bg-secondary shadow-2xl">
              <img src={IMG.portrait} alt="Brown laying hens in a ventilated poultry house" className="h-full w-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-1000" loading="eager" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-foreground/10 bg-secondary/20 py-24 lg:py-32">
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
      <section className="border-y border-foreground/10 bg-secondary/20 py-24 lg:py-28">
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
