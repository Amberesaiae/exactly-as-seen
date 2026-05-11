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
    role: 'Layer farm · Volta Region, Ghana',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80&auto=format&fit=crop',
    quote: 'I used to lose two crates a week to broken eggs because no one tracked nest collection time. Now my workers log per house, per shift — and the curve speaks for itself.',
    metric: ['−22%', 'Egg loss'],
  },
  {
    name: 'Martin Caron',
    role: 'Broiler co-op · Kumasi, Ghana',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=900&q=80&auto=format&fit=crop',
    quote: 'The optimiser shows me the cheapest safe ration for what is actually at the market this week. Last cycle I cut feed cost by ₵1.10 per kilo with zero performance drop.',
    metric: ['−14%', 'Feed cost'],
  },
  {
    name: 'Hugo Beauregard-Lapointe',
    role: 'Mixed flock · Tamale, Ghana',
    image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=900&q=80&auto=format&fit=crop',
    quote: 'Offline mode is the reason we adopted. We log mortality from inside the house, and it just syncs when the signal comes back. No more paper books.',
    metric: ['100%', 'Field logging'],
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
          Two cycles in, most LampFarms users see lower mortality, lower feed cost, and better confidence in their numbers — without hiring anyone new.
        </p>
      </section>

      <section className="border-y border-foreground/10 bg-secondary/40 py-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <Eyebrow>2024–2025 in numbers</Eyebrow>
            <p className="text-sm text-muted-foreground">Aggregated across active farms</p>
          </div>
          <div className="grid gap-12 grid-cols-2 lg:grid-cols-4">
            <AnimatedCounter target={500} suffix="+" label={'Active\nfarms'} barColor="primary" />
            <AnimatedCounter target={90} suffix="%" label={'Vaccination\ncompliance'} barColor="accent-cyan" />
            <AnimatedCounter target={12400} label={'Birds tracked\ndaily'} barColor="accent-gold" />
            <AnimatedCounter target={18} suffix="%" prefix="−" label={'Mortality\nreduction'} barColor="accent-purple" />
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
              <div className="mt-8 flex items-end gap-10">
                <div>
                  <div className="text-5xl sm:text-6xl font-black tracking-tight text-primary">{s.metric[0]}</div>
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{s.metric[1]}</div>
                </div>
                <div className="text-sm">
                  <div className="font-bold tracking-tight">{s.name}</div>
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
