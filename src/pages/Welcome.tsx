import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, Bird, FlaskConical, HeartPulse, LineChart } from 'lucide-react';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { Eyebrow } from '@/components/landing/LandingLayout';

const IMG = {
  hero: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=80&auto=format&fit=crop',
  field: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80&auto=format&fit=crop',
  poultry: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=1200&q=80&auto=format&fit=crop',
  hands: 'https://images.unsplash.com/photo-1592982537447-7440770faae9?w=1200&q=80&auto=format&fit=crop',
  drone: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&q=80&auto=format&fit=crop',
  feed: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1200&q=80&auto=format&fit=crop',
  panorama: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1800&q=80&auto=format&fit=crop',
  farmer1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop',
  farmer2: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80&auto=format&fit=crop',
  blog1: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80&auto=format&fit=crop',
  blog2: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=900&q=80&auto=format&fit=crop',
  blog3: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=900&q=80&auto=format&fit=crop',
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function Welcome() {
  return (
    <div>

      {/* HERO */}
      <section className="relative mx-auto max-w-[1400px] px-6 pb-12 pt-8 lg:px-10 lg:pb-20 lg:pt-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10 items-end">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="lg:col-span-7">
            <Eyebrow>Smart poultry · Sustainable yields</Eyebrow>
            <h1 className="mt-6 text-[44px] sm:text-6xl lg:text-[88px] font-black leading-[0.95] tracking-tight">
              Grow smarter,<br />
              <span className="italic font-serif font-normal text-primary">greener</span>, and more<br />
              profitable poultry.
            </h1>
            <p className="mt-7 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              LampFarms turns daily flock care into clear, data-driven decisions — from feed formulation to vaccination timing — so West African farmers raise healthier birds with less waste.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background hover:bg-foreground/90 transition">
                Start your free farm <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href="#solutions" className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-6 py-3.5 text-sm font-semibold hover:bg-foreground/5 transition">
                See how it works
              </a>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="show" variants={fadeUp}
                      transition={{ delay: 0.15 }} className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-secondary">
              <img src={IMG.hands} alt="Hands cradling young chicks at a poultry farm"
                   loading="eager" className="h-full w-full object-cover" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)]">
                <div>
                  <div className="text-2xl font-black tracking-tight">12,400+</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Birds tracked daily</div>
                </div>
                <div className="h-10 w-px bg-foreground/10" />
                <div>
                  <div className="text-2xl font-black tracking-tight">−18%</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Mortality rate</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wide hero image */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    transition={{ duration: 0.9 }}
                    className="mt-14 overflow-hidden rounded-[32px]">
          <img src={IMG.hero} alt="Aerial view of patterned farmland at sunrise"
               loading="lazy" className="h-[40vh] sm:h-[55vh] lg:h-[68vh] w-full object-cover" />
        </motion.div>
      </section>

      {/* TRUST */}
      <section className="border-y border-foreground/10 bg-secondary/40">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-8 flex flex-wrap items-center justify-between gap-y-6 gap-x-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Trusted by farms across West Africa
          </span>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-foreground/50">
            {['Akoma Farms', 'Asante Poultry', 'Volta Layers', 'Kumasi Co-op', 'Aburi Hatchery', 'Northern Yields'].map(l => (
              <span key={l} className="text-sm font-bold tracking-tight uppercase">{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* COMMITMENT */}
      <section id="platform" className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Eyebrow>Our commitment</Eyebrow>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-foreground/60">
              (01) — A platform rooted in the field
            </p>
          </div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                      className="lg:col-span-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05]">
              We build the quiet tools that let farmers focus on what matters — the birds, the soil, and the harvest at the end of the season.
            </h2>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-y-8">
              <Stat number="12,400+" label="Birds tracked daily" />
              <Stat number="90" label="Active farms" />
              <Stat number="−18%" label="Avg. mortality reduction" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* SOLUTIONS */}
      <section id="solutions" className="bg-secondary/30 py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
            <div className="max-w-2xl">
              <Eyebrow>Solutions</Eyebrow>
              <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02]">
                Four modules.<br />One quiet rhythm.
              </h2>
            </div>
            <p className="text-muted-foreground max-w-sm">
              Each module is built to be used standalone or as part of a fully integrated daily routine.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <SolutionCard image={IMG.poultry} icon={<Bird className="h-5 w-5" />}
                          eyebrow="Flock Intelligence"
                          title="Track every batch from chick to cull."
                          body="Daily counts, weights, mortality, and feed conversion — surfaced as one clear performance number."
                          to="/batches" />
            <SolutionCard image={IMG.feed} icon={<FlaskConical className="h-5 w-5" />}
                          eyebrow="Feed Lab"
                          title="Three formulation methods, one optimiser."
                          body="Ready-made, concentrate-mix, or full custom — backed by Pyomo LP and West African safety rules."
                          to="/feed" />
            <SolutionCard image={IMG.drone} icon={<HeartPulse className="h-5 w-5" />}
                          eyebrow="Care &amp; Water"
                          title="Vaccinations and withdrawals, never late."
                          body="Protocol schedules, water-log reminders, and withdrawal warnings tuned to your species and age."
                          to="/health" />
            <SolutionCard image={IMG.field} icon={<LineChart className="h-5 w-5" />}
                          eyebrow="Yield &amp; Ledger"
                          title="Know your true cost per bird, per egg, per crate."
                          body="Expenses, revenue, and harvest output reconcile into honest margin — with privacy when you need it."
                          to="/finance" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-5 max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02]">
          Three steps to a quieter, more profitable farm.
        </h2>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {[
            ['01', 'Set up your farm', 'Add your houses, species, and starting flock. Takes under three minutes.'],
            ['02', 'Track daily operations', 'Log feed, water, mortality and eggs from any device — even offline.'],
            ['03', 'Get smarter every week', 'Performance, cost, and health trends summarised so you act before issues compound.'],
          ].map(([n, t, b]) => (
            <motion.div key={n} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                        className="border-t border-foreground/15 pt-6">
              <div className="text-sm font-bold tracking-[0.2em] text-primary">{n}</div>
              <h3 className="mt-4 text-2xl font-black tracking-tight">{t}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{b}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PANORAMA */}
      <section className="relative">
        <div className="relative h-[60vh] overflow-hidden">
          <img src={IMG.panorama} alt="Farmland panorama at golden hour"
               loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
          <div className="absolute bottom-10 left-0 right-0 mx-auto max-w-[1400px] px-6 lg:px-10">
            <p className="text-background text-sm font-semibold tracking-[0.18em] uppercase">
              Wendlagounda Bernadette Kassongo — Volta Region, Ghana
            </p>
          </div>
        </div>
      </section>

      {/* IMPACT NUMBERS */}
      <section id="impact" className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
          <Eyebrow>Our year in numbers</Eyebrow>
          <p className="text-sm text-muted-foreground">2024–2025 platform metrics</p>
        </div>
        <div className="grid gap-12 grid-cols-2 lg:grid-cols-4">
          <AnimatedCounter target={500} suffix="+" label={'Active\nfarms'} barColor="primary" />
          <AnimatedCounter target={90} suffix="%" label={'Vaccination\ncompliance'} barColor="accent-cyan" />
          <AnimatedCounter target={12400} label={'Birds tracked\ndaily'} barColor="accent-gold" />
          <AnimatedCounter target={18} suffix="%" prefix="−" label={'Mortality\nreduction'} barColor="accent-purple" />
        </div>
      </section>

      {/* VOICES */}
      <section className="bg-secondary/30 py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <Eyebrow>Voices from the field</Eyebrow>
          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <Testimonial image={IMG.farmer1}
                         name="Martin Caron"
                         role="Layer farmer · Kumasi"
                         quote="Before LampFarms I was guessing at feed mixes. Now I plug in what's at the market and the optimiser shows me the cheapest safe ration in seconds." />
            <Testimonial image={IMG.farmer2}
                         name="Hugo Beauregard-Lapointe"
                         role="Broiler co-op · Tamale"
                         quote="The offline mode is what made it real for us. We log mortality from the house, and it just syncs when the network comes back." />
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section id="resources" className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
          <div>
            <Eyebrow>Resources</Eyebrow>
            <h2 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight leading-[1.02]">From the field journal.</h2>
          </div>
          <a href="#" className="text-sm font-semibold underline underline-offset-4">View all articles</a>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <BlogCard image={IMG.blog1} tag="IoT farming" title="Sensor-driven poultry housing for tropical climates." date="Mar 2025" />
          <BlogCard image={IMG.blog2} tag="Nutrition" title="Organic feed mixes that don't blow up your unit cost." date="Feb 2025" />
          <BlogCard image={IMG.blog3} tag="Health" title="A vaccination playbook for first-time layer farmers." date="Jan 2025" />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-16">
        <div className="relative overflow-hidden rounded-[36px] bg-foreground text-background px-8 py-20 lg:px-20 lg:py-28">
          <div className="absolute -top-10 -right-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <Eyebrow>
            <span className="text-background/70">Get started today</span>
          </Eyebrow>
          <h2 className="mt-5 max-w-3xl text-4xl sm:text-5xl lg:text-7xl font-black leading-[1] tracking-tight">
            Plant the seed of <span className="italic font-serif font-normal">smarter</span> farming.
          </h2>
          <p className="mt-6 max-w-xl text-background/70 text-lg">
            Free for your first flock. No credit card. Works offline.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-background px-7 py-4 text-sm font-semibold text-foreground hover:bg-secondary transition">
              Create your free farm <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-background/30 px-7 py-4 text-sm font-semibold text-background hover:bg-background/10 transition">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="border-l border-foreground/15 pl-5">
      <div className="text-3xl sm:text-4xl font-black tracking-tight">{number}</div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    </div>
  );
}

function SolutionCard({
  image, icon, eyebrow, title, body, to,
}: { image: string; icon: React.ReactNode; eyebrow: string; title: string; body: string; to: string }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
      <Link to={to} className="group block rounded-[28px] bg-background overflow-hidden hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.2)] transition">
        <div className="aspect-[16/10] overflow-hidden">
          <img src={image} alt={eyebrow} loading="lazy"
               className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="p-7">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            {icon}<span dangerouslySetInnerHTML={{ __html: eyebrow }} />
          </div>
          <h3 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight leading-tight">{title}</h3>
          <p className="mt-3 text-muted-foreground">{body}</p>
          <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold">
            Explore <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Testimonial({ image, name, role, quote }: { image: string; name: string; role: string; quote: string }) {
  return (
    <motion.figure initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                   className="rounded-[28px] bg-background p-8 lg:p-10">
      <div className="flex items-center gap-4">
        <img src={image} alt={name} loading="lazy"
             className="h-14 w-14 rounded-full object-cover" />
        <div>
          <div className="font-bold tracking-tight">{name}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-[0.18em]">{role}</div>
        </div>
      </div>
      <blockquote className="mt-6 text-xl sm:text-2xl font-medium leading-snug tracking-tight">
        "{quote}"
      </blockquote>
    </motion.figure>
  );
}

function BlogCard({ image, tag, title, date }: { image: string; tag: string; title: string; date: string }) {
  return (
    <motion.article initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                    className="group cursor-pointer">
      <div className="aspect-[5/4] overflow-hidden rounded-[24px]">
        <img src={image} alt={title} loading="lazy"
             className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="mt-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        <span className="text-primary">{tag}</span>
        <span className="h-px w-4 bg-foreground/20" />
        <span>{date}</span>
      </div>
      <h3 className="mt-3 text-xl font-black tracking-tight leading-snug">{title}</h3>
    </motion.article>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{title}</div>
      <ul className="mt-4 space-y-2">
        {links.map(l => (
          <li key={l}><a href="#" className="text-sm hover:underline underline-offset-4">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}
