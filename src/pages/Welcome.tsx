import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ArrowUpRight, Menu, X, Bird, Wheat, HeartPulse, Egg, Wallet, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { YellowStarBurst, LeafBranch } from '@/components/landing/LandingDecorations';
import { useState } from 'react';

/* ── Stat block colors matching reference (blue, green, yellow, purple) ── */
const stats = [
  { target: 500, suffix: '+', label: 'Farms managed across West Africa', bg: 'bg-[#4A90D9]' },
  { target: 90, suffix: '+', label: 'Volunteer agricultural experts at work', bg: 'bg-primary' },
  { target: 12, suffix: '', label: 'Regions and districts covered', bg: 'bg-[hsl(var(--accent-gold))]' },
  { target: 98, suffix: '%', label: 'System uptime and reliability', bg: 'bg-[#8B7EC8]' },
];

/* ── Feature section cards matching reference 3×2 grid ── */
const sectionCards = [
  { title: 'BATCH MANAGEMENT', desc: 'Track flocks from day-old to market', bg: 'bg-red-500', icon: Bird },
  { title: 'FEED CALCULATOR', desc: 'Optimize nutrition and reduce costs', bg: 'bg-[#4A90D9]', icon: Wheat },
  { title: 'HEALTH & VACCINATION', desc: 'Schedule treatments and monitor wellness', bg: 'bg-accent-cyan', icon: HeartPulse },
  { title: 'EGG PRODUCTION', desc: 'Log daily output and quality metrics', bg: 'bg-primary', icon: Egg },
  { title: 'FINANCE & STOCK', desc: 'Revenue, expenses and inventory in one view', bg: 'bg-[hsl(var(--accent-gold))]', icon: Wallet },
  { title: 'OFFLINE-FIRST', desc: 'Works without internet, syncs when connected', bg: 'bg-accent-cyan', icon: WifiOff },
];

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.7 },
};

export default function Welcome() {
  const { user, loading, farmReady } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!loading && user) {
    if (farmReady === true) return <Navigate to="/dashboard" replace />;
    if (farmReady === false) return <Navigate to="/farm-setup" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] text-foreground font-sans">

      {/* ═══════════════════════ STICKY NAV ═══════════════════════ */}
      <nav className="sticky top-0 z-50 bg-[#F5F0EB]/95 backdrop-blur-sm border-b border-black/5">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6 lg:px-12">
          {/* Logo — text only */}
          <Link to="/welcome" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary" />
            <span className="text-sm font-black tracking-tight uppercase text-foreground">LampFarms</span>
          </Link>

          {/* Center label */}
          <span className="hidden md:block text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Smart Poultry Management
          </span>

          {/* Right actions */}
          <div className="flex items-center gap-5">
            <Link to="/login" className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.2em] text-foreground hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground hover:text-primary transition-colors">
              Menu <span className="text-primary">+</span>
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="sm:hidden border-t border-black/5 px-6 py-4 flex flex-col gap-3 bg-[#F5F0EB]">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider">Sign In</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-primary">Get Started</Link>
          </motion.div>
        )}
      </nav>

      {/* ═══════════════════════ HERO ═══════════════════════
           Reference: Full-viewport with photo mosaic, text bottom-left/right.
           Adapted: Colored geometric blocks as photo stand-ins + massive type */}
      <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
        {/* Geometric "photo collage" blocks */}
        <div className="absolute inset-0 grid grid-cols-2 lg:grid-cols-3">
          <div className="bg-primary/90 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-[hsl(142,50%,25%)]" />
            {/* Leaf accent overlapping */}
            <LeafBranch className="absolute -bottom-8 -left-4 w-40 h-56 text-primary-foreground/30 rotate-12" />
          </div>
          <div className="bg-[#F5F0EB] relative flex items-start justify-end p-6 lg:p-10">
            {/* Yellow star accent matching reference */}
            <YellowStarBurst className="w-48 h-48 md:w-72 md:h-72 text-[hsl(var(--accent-gold))] opacity-80" />
          </div>
          <div className="hidden lg:block bg-gradient-to-b from-primary/70 to-primary/90 relative overflow-hidden">
            <LeafBranch className="absolute top-10 right-4 w-32 h-44 text-primary-foreground/20 -rotate-[25deg]" />
          </div>
        </div>

        {/* Hero text — bottom-aligned, matching reference positioning */}
        <div className="relative z-10 mt-auto mx-auto w-full max-w-[1400px] px-6 lg:px-12 pb-12 md:pb-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            {/* Left: massive title */}
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-[clamp(3rem,10vw,8rem)] font-black uppercase leading-[0.88] tracking-[-0.04em] text-foreground">
                Grow<br />Smarter<br />Farm Better
              </h1>
            </motion.div>

            {/* Right: subtitle — like reference "LANDS OF ENGAGEMENT" */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
              className="md:text-right">
              <p className="text-base md:text-xl font-black uppercase tracking-tight text-foreground leading-tight">
                West Africa's<br />Poultry<br />Platform
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ NARRATIVE — "Lands of Engagement" ═══════════════════════ */}
      <section className="py-20 md:py-32 bg-[#F5F0EB]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">
            {/* Left: nav breadcrumb + heading + body */}
            <motion.div {...fadeUp}>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-8">
                LampFarms &nbsp;·&nbsp; About &nbsp;·&nbsp; Our Mission
              </p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.05] mb-8">
                Empowering Family Farms
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-5">
                No matter where they farm, poultry producers across West Africa aspire to grow sustainable,
                profitable operations. LampFarms was built to serve this vision — smart tools designed by
                farmers, for farmers.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed mb-5">
                Our platform combines batch lifecycle management, AI-powered feed optimization, and real-time
                health monitoring into a single offline-first application. Every feature was developed in
                partnership with farming communities in Ghana, Nigeria, and Senegal.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                From tracking day-old chicks through to market-ready birds, LampFarms ensures that no data
                point is lost, no vaccination is missed, and every feed conversion ratio is optimized for
                your specific conditions and available ingredients.
              </p>
            </motion.div>

            {/* Right: decorative panel with accent shapes — like reference photo + green accent */}
            <motion.div {...fadeUp} className="relative">
              <div className="aspect-[4/3] bg-primary/10 rounded-sm overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
                <LeafBranch className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 text-primary opacity-30" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider">
                    Smart tools for every stage of poultry production
                  </p>
                </div>
              </div>
              {/* Colored accent rectangle overlapping — matching reference pattern */}
              <div className="absolute -bottom-4 -right-4 w-32 h-40 bg-primary/80 -z-10" />
              <div className="absolute -top-3 -left-3 w-20 h-20 bg-[hsl(var(--accent-gold))]/60 -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ LEADERSHIP / VISION ═══════════════════════
           Reference: Asymmetric 2-col with photo left, name+text right */}
      <section className="py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-12">
            LampFarms &nbsp;·&nbsp; Vision
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20 items-start">
            {/* Left: decorative "portrait" block */}
            <motion.div {...fadeUp} className="relative">
              <div className="aspect-square bg-[#F5F0EB] overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bird className="w-24 h-24 text-primary/20" />
                </div>
              </div>
              {/* Yellow accent bar — matching reference */}
              <div className="absolute -bottom-3 -left-3 w-full h-4 bg-[hsl(var(--accent-gold))]/70" />
            </motion.div>

            {/* Right: content */}
            <motion.div {...fadeUp}>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">
                Our Approach
              </p>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-[1.05] mb-6">
                Built for African<br />Farming Realities
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-5">
                LampFarms isn't another Silicon Valley farm-tech product adapted for emerging markets.
                It was conceived, designed, and tested in West African farming communities. Every workflow
                accounts for intermittent connectivity, local feed ingredients, regional vaccination
                protocols, and the specific economics of poultry production in Ghana, Nigeria, and beyond.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed mb-5">
                Our feed formulation engine uses Linear Programming optimization with a database of locally
                available ingredients — maize, soybean meal, fishmeal, oyster shell, wheat bran — at current
                market prices. The health module follows West African veterinary guidelines with proper
                withdrawal periods for egg and meat production.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                Whether you manage 50 birds or 50,000, LampFarms scales with your operation. Track multiple
                batches across houses, monitor mortality and feed conversion daily, record egg production
                by size category, and see your profitability in real time.
              </p>
              <Link to="/register" className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-primary hover:underline">
                Start Your Free Account <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section className="py-20 md:py-28 bg-[#F5F0EB]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 lg:gap-20 items-start">
            <motion.div {...fadeUp}>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">
                How It Works
              </p>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-[1.05] mb-8">
                From Setup to<br />Production in Minutes
              </h2>

              <div className="space-y-8">
                {[
                  { step: '01', title: 'Create Your Farm', text: 'Sign up, name your farm, set your region and production type. Add poultry houses and their capacities.' },
                  { step: '02', title: 'Add Your First Batch', text: 'Select species (layers, broilers, or guinea fowl), enter quantities, assign a house, and set the start date. LampFarms auto-generates feed schedules and vaccination timelines.' },
                  { step: '03', title: 'Track Daily Operations', text: 'Log mortality, feed consumption, egg production, and water intake. Mark vaccinations as administered. Everything syncs automatically when you\'re back online.' },
                  { step: '04', title: 'Optimize & Grow', text: 'Use the Feed Calculator to formulate cost-optimal rations. Review batch performance analytics. Track finances with automatic expense and revenue logging.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-5">
                    <span className="text-3xl font-black text-primary/30 leading-none shrink-0 w-12">{item.step}</span>
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: decorative block */}
            <motion.div {...fadeUp} className="relative hidden lg:block">
              <div className="aspect-[3/4] bg-primary/90 overflow-hidden relative">
                <YellowStarBurst className="absolute -top-12 -right-12 w-56 h-56 text-[hsl(var(--accent-gold))] opacity-60" />
                <LeafBranch className="absolute bottom-8 left-8 w-32 h-44 text-primary-foreground/30 -rotate-12" />
                <div className="absolute bottom-8 right-8 left-8">
                  <p className="text-primary-foreground/80 text-sm font-bold uppercase tracking-wider">
                    Designed for offline-first farming operations
                  </p>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 w-24 h-24 bg-[hsl(var(--accent-gold))]/50 -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ STATS — "OUR YEAR IN NUMBERS" ═══════════════════════
           Reference: Numbers INSIDE colored rectangular blocks, staggered asymmetric layout */}
      <section className="py-20 md:py-28 bg-[#F5F0EB]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <motion.h2 {...fadeUp}
            className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground mb-16 md:mb-24 text-right">
            Our Year<br />in Numbers
          </motion.h2>

          {/* Staggered asymmetric grid — stats inside colored blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className={`${i % 2 === 1 ? 'sm:mt-16' : ''}`}
              >
                <div className={`${stat.bg} p-8 md:p-10`}>
                  <AnimatedCounter
                    target={stat.target}
                    suffix={stat.suffix}
                    label=""
                    barColor="primary"
                    inBlock
                  />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground leading-relaxed max-w-[240px]">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES — "VIEW THE SECTIONS" ═══════════════════════
           Reference: 3×2 grid of solid-color cards with white text + arrow */}
      <section className="py-20 md:py-28 bg-[#F5F0EB]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <motion.h2 {...fadeUp}
            className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground mb-12">
            Explore the Platform
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sectionCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className={`${card.bg} p-7 md:p-8 flex flex-col justify-between min-h-[160px] md:min-h-[180px] group cursor-pointer hover:opacity-90 transition-opacity`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-white leading-tight max-w-[180px]">
                    {card.title}
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className="text-white/70 text-xs font-medium mt-4">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA BANNER ═══════════════════════ */}
      <section className="relative overflow-hidden bg-foreground py-24 md:py-32">
        <YellowStarBurst className="absolute -top-20 -left-20 w-[400px] h-[400px] text-[hsl(var(--accent-gold))] opacity-10" />

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-background leading-[1.05] mb-6">
                Ready to<br />Transform<br />Your Farm?
              </h2>
              <p className="text-background/60 text-base md:text-lg mb-10 max-w-md leading-relaxed">
                Join hundreds of poultry farmers across West Africa already using LampFarms to track
                batches, optimize feed, and grow with confidence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-[hsl(var(--accent-gold))] text-[hsl(var(--accent-gold-foreground))] px-7 py-3.5 text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 border border-background/20 text-background px-7 py-3.5 text-xs font-black uppercase tracking-wider hover:bg-background/10 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>

            <motion.div {...fadeUp} className="hidden lg:flex justify-end">
              <div className="w-64 h-64 relative">
                <YellowStarBurst className="w-full h-full text-[hsl(var(--accent-gold))] opacity-30" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="bg-[#F5F0EB] py-10 border-t border-black/5">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span className="text-sm font-black uppercase tracking-tight">LampFarms</span>
          </div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            © {new Date().getFullYear()} LampFarms — Smart Poultry Management for West Africa
          </p>
          <div className="flex gap-6">
            <Link to="/login" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
