import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, BookOpen, FileText, GraduationCap, PlayCircle } from 'lucide-react';
import { Eyebrow } from '@/components/landing/LandingLayout';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const FEATURED = {
  image: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=1800&q=80&auto=format&fit=crop',
  tag: 'Climate · Housing',
  title: 'Designing naturally ventilated layer houses for the Volta basin.',
  date: 'Mar 2025 · 12 min read',
  excerpt: 'How a 3-degree drop in afternoon indoor temperature — achieved with ridge venting, side-curtains and reflective roofing — lifted hen-day rate by 4.6 points across two farms we audited last harmattan.',
};

const ARTICLES = [
  { image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=900&q=80&auto=format&fit=crop',
    tag: 'Nutrition', title: 'Substituting maize with wheat bran without crashing FCR.', date: 'Feb 2025',
    excerpt: 'A 6% swap that saved ₵1.10/kg this cycle — and the lysine math that made it safe.' },
  { image: 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?w=900&q=80&auto=format&fit=crop',
    tag: 'Health', title: 'A Newcastle + Gumboro vaccination schedule for first-time layer farmers.', date: 'Jan 2025',
    excerpt: 'Day-by-day protocol for 0–18 weeks, plus what to do when you miss a window.' },
  { image: 'https://images.unsplash.com/photo-1556386734-04d24c5708d4?w=900&q=80&auto=format&fit=crop',
    tag: 'Operations', title: 'Reading mortality patterns before they become outbreaks.', date: 'Dec 2024',
    excerpt: 'The three curve shapes that predict a problem 4–7 days out — with field examples.' },
  { image: 'https://images.unsplash.com/photo-1569288063643-5d29ad6ad7a5?w=900&q=80&auto=format&fit=crop',
    tag: 'Finance', title: 'Why cost-per-egg beats price-per-crate every cycle.', date: 'Nov 2024',
    excerpt: 'Walkthrough of a real Volta layer farm where price-per-crate hid a 6-month loss.' },
  { image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80&auto=format&fit=crop',
    tag: 'Field notes', title: 'Three farms, three rhythms — interviews from the Volta delta.', date: 'Oct 2024',
    excerpt: 'How shift timing, ration cadence and worker incentives differ between top performers.' },
  { image: 'https://images.unsplash.com/photo-1444465693019-aa0b6392460d?w=900&q=80&auto=format&fit=crop',
    tag: 'Brooding', title: 'The first 14 days: brooder temperature, water and 7-day mortality.', date: 'Sep 2024',
    excerpt: 'Why placement-week decisions decide 60% of cycle profitability — and how to log them.' },
];

const CATEGORIES = [
  { icon: BookOpen, title: 'Guides', body: 'Step-by-step playbooks for batch setup, LP feed formulation, vaccination scheduling, and end-of-cycle reconciliation.' },
  { icon: FileText, title: 'Whitepapers', body: 'Research on West African poultry economics, climate-adapted housing, and least-cost feed modelling — co-authored with KNUST faculty.' },
  { icon: GraduationCap, title: 'Academy', body: 'Short video courses for managers and field workers, in EN, FR and TWI. Downloadable for offline viewing on 32 MB device packs.' },
  { icon: PlayCircle, title: 'Webinars', body: 'Live sessions with veterinarians, feed-mill operators and co-op leaders. Recordings available within 24 hours.' },
];

const FAQ = [
  ['Does LampFarms work without internet?',
   'Yes. Every screen logs locally to IndexedDB and syncs the moment a 2G signal returns. We test on Tecno Spark devices in Northern Region houses with no signal during shifts.'],
  ['Which species and breeds do you support?',
   'Broilers (Cobb 500, Ross 308, Arbor Acres), layers (Lohmann Brown, Isa Brown, Bovans), breeders (parent-stock cycles), and day-old chick brooder phases. Reference curves are pre-loaded.'],
  ['How is feed cost actually calculated?',
   'Real LP — not heuristics. A Pyomo linear-programming solver computes the least-cost ration under your nutrient bands, safety caps, and current ingredient prices. You see the binding constraint that drove the solution.'],
  ['Can my farm workers see profit numbers?',
   'Only if you allow it. A one-tap privacy mask hides every monetary value on a device. Role-based access separates owner, manager and field-worker views — enforced server-side.'],
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
          Practical, plain-language writing on poultry economics, health and the small daily decisions that decide a cycle. Written with vets, agronomists and farmers we visit every quarter.
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
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.excerpt}</p>
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

      {/* FAQ */}
      <section className="border-t border-foreground/10 bg-secondary/20 py-24">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Eyebrow>Frequently asked</Eyebrow>
            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.02]">
              The questions farmers ask before signing up.
            </h2>
          </div>
          <div className="lg:col-span-8 divide-y divide-foreground/10">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-6">
                <summary className="flex items-start justify-between gap-6 cursor-pointer list-none">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight">{q}</h3>
                  <span className="mt-1 text-2xl text-muted-foreground group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
