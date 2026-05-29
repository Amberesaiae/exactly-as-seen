import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, BookOpen, FileText, GraduationCap, PlayCircle } from 'lucide-react';
import { Eyebrow } from '@/components/landing/LandingLayout';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const FEATURED = {
  image: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=1800&q=80&auto=format&fit=crop',
  tag: 'Protocols · Health',
  title: 'Managing active withdrawal periods in multi-species flocks.',
  date: 'Mar 2025 · 8 min read',
  excerpt: 'Why safety windows for ducks and turkeys differ from broiler cycles, and how automated alerts prevent tainted harvests in mixed-production systems.',
};

const ARTICLES = [
  { image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=900&q=80&auto=format&fit=crop',
    tag: 'Nutrition', title: 'Using HQCP Cassava and BSF Larvae as high-yield local alternatives.', date: 'Feb 2025',
    excerpt: 'Leveraging the 48-ingredient library to find least-cost local swaps without sacrificing protein targets.' },
  { image: 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?w=900&q=80&auto=format&fit=crop',
    tag: 'Health', title: 'Duck Viral Hepatitis & Duck Plague vaccination schedule.', date: 'Jan 2025',
    excerpt: 'A specialized day-by-day protocol for waterfowl, including critical Niacin supplementation milestones.' },
  { image: 'https://images.unsplash.com/photo-1556386734-04d24c5708d4?w=900&q=80&auto=format&fit=crop',
    tag: 'Operations', title: 'Lean Logic: Transitioning from Intensive to Semi-Intensive systems.', date: 'Dec 2024',
    excerpt: 'How foraging modifiers can reduce feed costs by up to 25% for pasture-based turkey and duck batches.' },
  { image: 'https://images.unsplash.com/photo-1569288063643-5d29ad6ad7a5?w=900&q=80&auto=format&fit=crop',
    tag: 'Finance', title: 'Dovetail Synergy: Automating your farm ledger from daily logs.', date: 'Nov 2024',
    excerpt: 'How one-tap mortality and feed entries keep your financial reports accurate to the pesewa.' },
  { image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80&auto=format&fit=crop',
    tag: 'Field notes', title: 'Ghanaian Smallholders: Practical water planning for heat stress.', date: 'Oct 2024',
    excerpt: 'Using regional temperature fallbacks and container-based dosing (Jerry Cans/Drums) in low-signal areas.' },
  { image: 'https://images.unsplash.com/photo-1444465693019-aa0b6392460d?w=900&q=80&auto=format&fit=crop',
    tag: 'Protocols', title: 'The 36-Schedule Matrix: Precision care for the modern African farm.', date: 'Sep 2024',
    excerpt: 'A breakdown of the pre-loaded vaccination and medication templates for all four supported species.' },
];

const CATEGORIES = [
  { icon: BookOpen, title: 'Guides', body: 'Step-by-step playbooks for batch setup, WASM feed formulation, vaccination scheduling, and Dovetail ledger reconciliation.' },
  { icon: FileText, title: 'Case Studies', body: 'Real-world data on least-cost feed modelling and climate-adapted protocols from active Ghanaian smallholder poultry farms.' },
  { icon: GraduationCap, title: 'Academy', body: 'Short video courses for managers and field workers, in EN, FR and TWI. Downloadable for offline viewing in the field.' },
  { icon: PlayCircle, title: 'Webinars', body: 'Live sessions with veterinarians and coop leaders on regional disease prevention and market price trends.' },
];

const FAQ = [
  ['Does LampFarms work without internet?',
   'Yes. Every screen logs locally to IndexedDB and syncs the moment a 2G signal returns. We test on affordable devices in remote houses with no signal during shifts.'],
  ['Which species and breeds do you support?',
   'Broilers, layers, ducks, and turkeys. 72+ pre-loaded protocols are available, including species-specific safety warnings like Gossypol and Niacin floors.'],
  ['How is feed cost actually calculated?',
   'HiGHS WASM Solver — a professional linear-programming engine. It computes the least-cost ration under your nutrient targets, safety caps, and local ingredient prices.'],
  ['Can my farm workers see profit numbers?',
   'Only if you allow it. A persistent cost privacy mask hides every monetary value on the device. Role-based access ensures owner control over sensitive financial data.'],
];

export default function Resources() {
  return (
    <div className="bg-background text-foreground">
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-32 pb-20 lg:pt-48 lg:pb-32">
        <Eyebrow>Resources</Eyebrow>
        <h1 className="mt-8 max-w-5xl text-5xl sm:text-7xl lg:text-[100px] font-black leading-[0.9] tracking-tighter">
          The poultry <br />
          field <span className="italic font-serif font-normal text-primary">journal</span>.
        </h1>
        <p className="mt-10 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Practical, plain-language writing on poultry economics, health and the small daily decisions that decide a cycle. Written with vets and agronomists.
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

      <section className="border-y border-foreground/10 bg-secondary/20 py-24">
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
                        className="rounded-[24px] bg-secondary/20 p-7">
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
