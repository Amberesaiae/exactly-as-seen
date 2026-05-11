import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { Eyebrow } from '@/components/landing/LandingLayout';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const STORIES = [
  {
    name: 'Wendlagounda Bernadette Kassongo',
    role: 'Lohmann Brown layers · Volta Region, Ghana · 1,800 birds',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80&auto=format&fit=crop',
    quote: 'I used to lose two crates a week to cracked eggs because nest collection was once a day. The hen-day curve forced me to schedule a second pickup at 2pm — broken eggs dropped to almost zero in three weeks.',
    metric: ['−22%', 'Egg loss'],
    detail: 'Cycle 4 vs. cycle 3 · 38-week comparison',
  },
  {
    name: 'Martin Caron',
    role: 'Cobb 500 broiler co-op · Kumasi, Ghana · 6 houses · 12,000 birds/cycle',
    image: 'https://images.unsplash.com/photo-1569288063643-5d29ad6ad7a5?w=900&q=80&auto=format&fit=crop',
    quote: 'The LP optimiser shows me the cheapest safe ration for what is actually at the Kumasi market this week. Last cycle I swapped 6% maize for wheat bran and dropped feed cost ₵1.10/kg with zero performance loss.',
    metric: ['−14%', 'Feed cost'],
    detail: 'Per-kilo live-weight basis · solver run weekly',
  },
  {
    name: 'Hugo Beauregard-Lapointe',
    role: 'Mixed flock (layers + broilers) · Tamale, Ghana · 2,400 birds',
    image: 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?w=900&q=80&auto=format&fit=crop',
    quote: 'Tamale loses 4G most afternoons. Offline mode is the reason we adopted — workers log mortality and feed from inside the house and it syncs at night. No more paper books, no more guessing.',
    metric: ['100%', 'Field-logged events'],
    detail: 'Previously: ~40% logged the next day, often forgotten',
  },
];

export default function Impact() {
  return (
    <div>
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-10 pb-16 lg:pt-16">
        <Eyebrow>Impact</Eyebrow>
        <h1 className="mt-6 max-w-4xl text-5xl sm:text-6xl lg:text-[88px] font-black leading-[0.95] tracking-tight">
          What changes when farms <span className="italic font-serif font-normal text-primary">measure</span> what matters.
        </h1>
        <p className="mt-7 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Two cycles in, most LampFarms users see lower mortality, lower feed cost, and a clear margin number for the first time — without hiring anyone new and without buying new sensors.
        </p>
      </section>

      <section className="border-y border-foreground/10 bg-secondary/40 py-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <Eyebrow>2024–2025 in numbers</Eyebrow>
            <p className="text-sm text-muted-foreground">Aggregated across active farms · self-reported & ledger-verified</p>
          </div>
          <div className="grid gap-12 grid-cols-2 lg:grid-cols-4">
            <AnimatedCounter target={500} suffix="+" label={'Active\nfarms'} barColor="primary" />
            <AnimatedCounter target={90} suffix="%" label={'Vaccination\ncompliance'} barColor="accent-cyan" />
            <AnimatedCounter target={12400} label={'Birds tracked\ndaily'} barColor="accent-gold" />
            <AnimatedCounter target={18} suffix="%" prefix="−" label={'Mortality\nreduction'} barColor="accent-purple" />
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3 text-sm">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Median FCR improvement</div>
              <div className="mt-2 text-3xl font-black tracking-tight">1.92 → 1.78</div>
              <p className="mt-2 text-muted-foreground">Across 84 broiler cycles between Sep 2024 and Apr 2025.</p>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Avg. feed cost reduction</div>
              <div className="mt-2 text-3xl font-black tracking-tight">−₵0.86 / kg</div>
              <p className="mt-2 text-muted-foreground">From the Pyomo LP optimiser using weekly market prices.</p>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Days to first margin number</div>
              <div className="mt-2 text-3xl font-black tracking-tight">7</div>
              <p className="mt-2 text-muted-foreground">From farm setup to first ledger-verified cost-per-egg.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32 space-y-24">
        {STORIES.map((s, idx) => (
          <motion.div key={s.name} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                      className={`grid gap-10 lg:grid-cols-12 items-center ${idx % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
            <div className="lg:col-span-5">
              <div className="aspect-[4/5] overflow-hidden rounded-[28px]">
                <img src={s.image} alt={s.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="lg:col-span-7 lg:px-4">
              <Eyebrow>{s.role}</Eyebrow>
              <blockquote className="mt-6 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-[1.05]">
                "{s.quote}"
              </blockquote>
              <div className="mt-8 flex items-end gap-10 flex-wrap">
                <div>
                  <div className="text-5xl sm:text-6xl font-black tracking-tight text-primary">{s.metric[0]}</div>
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{s.metric[1]}</div>
                </div>
                <div className="text-sm max-w-xs">
                  <div className="font-bold tracking-tight">{s.name}</div>
                  <div className="mt-1 text-muted-foreground">{s.detail}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-24">
        <div className="rounded-[32px] bg-primary text-primary-foreground px-8 py-16 lg:px-16 lg:py-20">
          <Eyebrow><span className="text-primary-foreground/80">Be part of the next number</span></Eyebrow>
          <h2 className="mt-5 max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02]">
            Your farm. Your numbers. Better.
          </h2>
          <Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3.5 text-sm font-semibold text-foreground">
            Start tracking <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
