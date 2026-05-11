import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, BookOpen, FileText, GraduationCap, PlayCircle } from 'lucide-react';
import { Eyebrow } from '@/components/landing/LandingLayout';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const FEATURED = {
  image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=1800&q=80&auto=format&fit=crop',
  tag: 'IoT farming',
  title: 'Sensor-driven poultry housing for tropical climates.',
  date: 'Mar 2025 · 12 min read',
  excerpt: 'How affordable temperature, humidity, and ammonia sensors paired with offline-first apps are quietly reshaping bird welfare across West Africa.',
};

const ARTICLES = [
  { image: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=900&q=80&auto=format&fit=crop',
    tag: 'Nutrition', title: 'Organic feed mixes that don\'t blow up your unit cost.', date: 'Feb 2025' },
  { image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=900&q=80&auto=format&fit=crop',
    tag: 'Health', title: 'A vaccination playbook for first-time layer farmers.', date: 'Jan 2025' },
  { image: 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?w=900&q=80&auto=format&fit=crop',
    tag: 'Operations', title: 'Reading mortality patterns before they become outbreaks.', date: 'Dec 2024' },
  { image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=900&q=80&auto=format&fit=crop',
    tag: 'Finance', title: 'Why cost-per-egg beats price-per-crate every cycle.', date: 'Nov 2024' },
  { image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=900&q=80&auto=format&fit=crop',
    tag: 'Field notes', title: 'Three farms, three rhythms — interviews from the Volta delta.', date: 'Oct 2024' },
  { image: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=900&q=80&auto=format&fit=crop',
    tag: 'Tooling', title: 'Inside the Pyomo LP optimiser: how least-cost rations are computed.', date: 'Sep 2024' },
];

const CATEGORIES = [
  { icon: BookOpen, title: 'Guides', body: 'Step-by-step playbooks for batch creation, feed formulation, vaccination, and end-of-cycle reconciliation.' },
  { icon: FileText, title: 'Whitepapers', body: 'Long-form research on poultry economics, climate-adapted housing, and feed-cost modelling for West Africa.' },
  { icon: GraduationCap, title: 'Academy', body: 'Short video courses for managers and field workers — EN, FR, and TWI. Offline downloads supported.' },
  { icon: PlayCircle, title: 'Webinars', body: 'Live sessions with veterinarians, agronomists, and successful co-op leaders. Replays available.' },
];

export default function Resources() {
  return (
    <div>
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-10 pb-12 lg:pt-16">
        <Eyebrow>Resources</Eyebrow>
        <h1 className="mt-6 max-w-4xl text-5xl sm:text-6xl lg:text-[88px] font-black leading-[0.95] tracking-tight">
          The field <span className="italic font-serif font-normal text-primary">journal</span>.
        </h1>
        <p className="mt-7 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Practical, plain-language writing on poultry economics, health, and the small daily decisions that decide a cycle.
        </p>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-24">
        <motion.a href="#" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                  className="group grid gap-8 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7">
            <div className="aspect-[16/10] overflow-hidden rounded-[28px]">
              <img src={FEATURED.image} alt={FEATURED.title} loading="lazy"
                   className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="text-primary">Featured</span>
              <span className="h-px w-4 bg-foreground/20" />
              <span>{FEATURED.tag}</span>
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05]">{FEATURED.title}</h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">{FEATURED.excerpt}</p>
            <div className="mt-7 flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{FEATURED.date}</span>
              <span className="font-semibold inline-flex items-center gap-1">Read story <ArrowUpRight className="h-4 w-4" /></span>
            </div>
          </div>
        </motion.a>
      </section>

      <section className="border-y border-foreground/10 bg-secondary/30 py-24">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div>
              <Eyebrow>Library</Eyebrow>
              <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.02]">More from the journal.</h2>
            </div>
            <a href="#" className="text-sm font-semibold underline underline-offset-4">View all</a>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {ARTICLES.map(a => (
              <motion.article key={a.title} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                              className="group cursor-pointer">
                <div className="aspect-[5/4] overflow-hidden rounded-[20px]">
                  <img src={a.image} alt={a.title} loading="lazy"
                       className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="mt-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  <span className="text-primary">{a.tag}</span>
                  <span className="h-px w-4 bg-foreground/20" />
                  <span>{a.date}</span>
                </div>
                <h3 className="mt-3 text-xl font-black tracking-tight leading-snug">{a.title}</h3>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24">
        <Eyebrow>Categories</Eyebrow>
        <h2 className="mt-5 max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.02]">Pick a learning path.</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(c => (
            <motion.div key={c.title} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                        className="rounded-[24px] bg-secondary/40 p-7">
              <c.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-5 text-xl font-black tracking-tight">{c.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
