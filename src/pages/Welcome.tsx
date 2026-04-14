import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { YellowStarBurst } from '@/components/landing/LandingDecorations';
import { useState } from 'react';

/* ── Image imports ── */
import heroFarmer from '@/assets/landing/hero-farmer.jpg';
import heroLandscape from '@/assets/landing/hero-landscape.jpg';
import communityFarmers from '@/assets/landing/community-farmers.jpg';
import poultryHouse from '@/assets/landing/poultry-house.jpg';
import farmerTech from '@/assets/landing/farmer-tech.jpg';
import familyFarm from '@/assets/landing/family-farm.jpg';

/* ── Stats (matching reference: blue, green, yellow, purple blocks) ── */
const stats = [
  { target: 500, suffix: '+', label: 'Farms managed across West Africa', bg: 'bg-[#4A90D9]' },
  { target: 90, suffix: '+', label: 'Volunteer agricultural experts at work', bg: 'bg-[#22C55E]' },
  { target: 12, suffix: '', label: 'Regions and districts covered', bg: 'bg-[#F59E0B]' },
  { target: 9919915, suffix: '', prefix: '₵', label: 'Annual production value tracked on the platform\n\nFeed costs: 56.8%\nMedication: 17.9%\nRevenue from eggs: 22.3%\nOther income: 3%', bg: 'bg-[#8B7EC8]' },
];

/* ── Section cards (matching reference 3×2 colored grid with rounded corners) ── */
const sectionCards = [
  { title: 'BATCH\nMANAGEMENT', bg: 'bg-red-500' },
  { title: 'FEED\nCALCULATOR', bg: 'bg-[#4A90D9]' },
  { title: 'HEALTH AND\nVACCINATION', bg: 'bg-accent-cyan' },
  { title: 'EGG PRODUCTION\nAND TRACKING', bg: 'bg-[#22C55E]' },
  { title: 'FINANCE\nAND STOCK', bg: 'bg-[#F59E0B]' },
  { title: 'OFFLINE-FIRST\nSYNC', bg: 'bg-accent-cyan' },
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

      {/* ═══════════════════════ STICKY NAV ═══════════════════════
           Reference: logo left, center label, "MENU +" right. Cream bg. */}
      <nav className="sticky top-0 z-50 bg-[#F5F0EB]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between px-5 lg:px-10">
          <Link to="/welcome" className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <span className="text-[8px] font-black text-white">LF</span>
            </div>
            <span className="text-[11px] font-black tracking-tight uppercase text-foreground">LampFarms</span>
          </Link>
          <span className="hidden md:block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Smart Poultry Management
          </span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors">
              Sign In
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em]">
              Menu <span className="text-primary">+</span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="border-t border-black/5 px-5 py-3 flex flex-col gap-2 bg-[#F5F0EB]">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-bold">Sign In</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="text-sm font-bold text-primary">Create Account</Link>
          </motion.div>
        )}
      </nav>

      {/* ═══════════════════════ HERO — Photo Collage ═══════════════════════
           Reference: Left large photo, center cream + yellow star, right circular + rectangular photos.
           Title bottom-left, subtitle bottom-right. */}
      <section className="relative min-h-[calc(100vh-3rem)] overflow-hidden">
        {/* Photo grid background */}
        <div className="absolute inset-0 grid grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr]">
          {/* Left: hero farmer photo */}
          <div className="relative overflow-hidden">
            <img src={heroFarmer} alt="West African farmer with poultry" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          {/* Center: cream with yellow star */}
          <div className="relative bg-[#F5F0EB] flex items-start justify-center pt-12 lg:pt-20">
            <YellowStarBurst className="w-40 h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 text-[hsl(var(--accent-gold))] opacity-90" />
          </div>
          {/* Right: landscape photo with circle crop overlay */}
          <div className="hidden lg:block relative overflow-hidden">
            <img src={heroLandscape} alt="West African farming landscape" className="absolute inset-0 w-full h-full object-cover" />
            {/* Circular photo overlay (like reference) */}
            <div className="absolute top-8 right-8 w-44 h-44 rounded-full overflow-hidden border-4 border-[#F5F0EB] shadow-xl">
              <img src={poultryHouse} alt="Poultry house" className="w-full h-full object-cover" />
            </div>
            {/* Green accent block */}
            <div className="absolute bottom-0 right-0 w-24 h-32 bg-primary/80 rounded-tl-2xl" />
          </div>
        </div>

        {/* Hero text — bottom aligned */}
        <div className="relative z-10 min-h-[calc(100vh-3rem)] flex flex-col justify-end">
          {/* Breadcrumb bar */}
          <div className="bg-[#F5F0EB]/90 backdrop-blur-sm px-5 lg:px-10 py-2">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                LampFarms &nbsp;·&nbsp; Home
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-t from-black/60 via-black/30 to-transparent px-5 lg:px-10 pb-10 md:pb-16 pt-32">
            <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-[clamp(2.5rem,8vw,7rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-white"
              >
                Grow Smarter<br />Farm Better
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-base md:text-lg font-black uppercase tracking-tight text-white/90 md:text-right leading-tight"
              >
                West Africa's<br />Poultry<br />Platform
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ NARRATIVE — "Lands of Engagement" clone ═══════════════════════
           Reference: Left photo in rotated blue frame, center text, right photo with green accent */}
      <section className="py-16 md:py-24 bg-[#F5F0EB]">
        {/* Breadcrumb */}
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            LampFarms &nbsp;·&nbsp; About
          </span>
        </div>

        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-8 lg:gap-12 items-start">
            {/* Left: rotated photo with blue border (matching reference) */}
            <motion.div {...fadeUp} className="relative hidden lg:block">
              <div className="relative -rotate-3 border-[6px] border-[#4A90D9] rounded-sm overflow-hidden shadow-lg">
                <img src={communityFarmers} alt="Community of farmers" className="w-full aspect-[3/4] object-cover" loading="lazy" />
              </div>
            </motion.div>

            {/* Center: heading + body text */}
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight mb-6">
                Empowering Family Farms
              </h2>
              <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
                <p>
                  No matter where they farm, poultry producers across West Africa aspire to live in dignity from the fruits of their labor. No matter where they farm, women and men engage in this quest and find meaning in it.
                </p>
                <p>
                  LampFarms was built to present information and data from your farm operations — as well as the stories of women and men committed to family farming. In their own ways and according to their realities, these individuals are engaged because they feel they can make an impact.
                </p>
                <p>
                  When a challenge is shared by many — such as the unpredictable effects of feed price volatility or disease outbreaks — engaging to solve "our" problem can have a collective impact. Individual and collective interests align through commitment to better farming practices.
                </p>
                <p>
                  Who knows — perhaps one day, the commitment of women and men across West Africa will help family poultry farming thrive. At LampFarms, our dedication is to contribute to this goal!
                </p>
              </div>
            </motion.div>

            {/* Right: photo with green accent (matching reference) */}
            <motion.div {...fadeUp} className="relative hidden lg:block">
              <img src={poultryHouse} alt="Modern poultry house" className="w-full aspect-[3/4] object-cover rounded-sm" loading="lazy" />
              {/* Green accent block overlapping */}
              <div className="absolute -bottom-3 -right-3 w-20 h-28 bg-primary/70 -z-10 rounded-sm" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PROFILE CARD 1 — Matching reference "MARTIN CARON" layout ═══════════════════════
           Reference: photo left with yellow accent, name+text right */}
      <section className="py-12 bg-white border-y border-black/5">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              LampFarms &nbsp;·&nbsp; Smart Tools
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Technology / 1
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-16 items-start">
            {/* Left: photo with accent */}
            <motion.div {...fadeUp} className="relative">
              <img src={farmerTech} alt="Farmer using technology" className="w-full aspect-square object-cover rounded-sm" loading="lazy" />
              {/* Yellow accent bar (matching reference) */}
              <div className="absolute -bottom-2 -left-2 w-full h-3 bg-[#F59E0B]/80 -z-10" />
            </motion.div>

            {/* Right: content */}
            <motion.div {...fadeUp}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Built for African Realities
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[0.95] mb-6">
                Smart Farm<br />Management
              </h2>
              <p className="text-sm text-muted-foreground mb-1">Technology That Understands Your Farm</p>
              <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed mt-4">
                <p>
                  LampFarms isn't another Silicon Valley farm-tech product adapted for emerging markets. It was conceived, designed, and tested in West African farming communities. Every workflow accounts for intermittent connectivity, local feed ingredients, regional vaccination protocols, and the specific economics of poultry production.
                </p>
                <p>
                  Our feed formulation engine uses Linear Programming optimization with a database of locally available ingredients — maize, soybean meal, fishmeal, oyster shell, wheat bran — at current market prices. The health module follows West African veterinary guidelines with proper withdrawal periods.
                </p>
                <p>
                  Whether you manage 50 birds or 50,000, LampFarms scales with your operation. Track multiple batches across houses, monitor mortality and feed conversion daily, record egg production by size category, and see your profitability in real time.
                </p>
              </div>
              <Link to="/register" className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold uppercase tracking-wider text-primary hover:underline">
                Start Your Free Account <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PROFILE CARD 2 — Reversed layout ═══════════════════════
           Reference: text left, photo right with purple accent */}
      <section className="py-12 bg-[#F5F0EB]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              LampFarms &nbsp;·&nbsp; Offline-First
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Technology / 2
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-16 items-start">
            {/* Left: text */}
            <motion.div {...fadeUp}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Works Without Internet
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[0.95] mb-6">
                Offline-First<br />Architecture
              </h2>
              <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
                <p>
                  In rural West Africa, internet connectivity is unpredictable. LampFarms was designed from the ground up to work completely offline. Every feature — from batch tracking to feed formulation — functions without an internet connection.
                </p>
                <p>
                  When connectivity is restored, your data syncs automatically and securely to the cloud. No data is ever lost, no entry needs to be repeated. Your farm records are always accessible, whether you're in the field or at home.
                </p>
                <p>
                  Our sync engine handles conflicts intelligently, ensuring that records entered on multiple devices are merged correctly. This is enterprise-grade technology adapted for the realities of farming in areas with limited infrastructure.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <div className="w-12 h-1 bg-[#F59E0B]" />
                <div className="w-8 h-1 bg-primary" />
                <div className="w-6 h-1 bg-[#8B7EC8]" />
              </div>
            </motion.div>

            {/* Right: photo with purple accent */}
            <motion.div {...fadeUp} className="relative">
              <img src={communityFarmers} alt="Farming community" className="w-full aspect-[3/4] object-cover rounded-sm" loading="lazy" />
              <div className="absolute -top-2 -right-2 w-full h-full border-[6px] border-[#8B7EC8]/40 -z-10 rounded-sm" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FAMILY FARM INITIATIVE ═══════════════════════
           Reference: full-width text + wide photo with caption overlay */}
      <section className="py-12 bg-white border-y border-black/5">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              LampFarms &nbsp;·&nbsp; Community
            </span>
          </div>

          <div className="max-w-3xl mb-10">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground leading-tight mb-4">
              The Family Farm Initiative
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              LampFarms celebrates the perseverance and success of farming families that contribute to feeding their communities. Through our platform, families from Ghana, Nigeria, Senegal, and Burkina Faso track and optimize their operations, building sustainable livelihoods for the next generation.
            </p>
          </div>

          {/* Wide photo with caption overlay */}
          <motion.div {...fadeUp} className="relative">
            <img src={familyFarm} alt="Family farming together" className="w-full aspect-[21/9] object-cover rounded-sm" loading="lazy" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 md:p-8">
              <p className="text-white text-sm font-bold">
                The Mensah Family — Accra Region, Ghana
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ STATS — "OUR YEAR IN NUMBERS" ═══════════════════════
           Reference: right-aligned heading, staggered colored blocks with rounded corners */}
      <section className="py-16 md:py-24 bg-[#F5F0EB]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              LampFarms &nbsp;·&nbsp; Impact
            </span>
          </div>

          <motion.h2 {...fadeUp}
            className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground mb-14 md:mb-20 text-right">
            Our Year<br />in Numbers
          </motion.h2>

          {/* Staggered 2-col grid with colored blocks — rounded corners like reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className={i % 2 === 1 ? 'sm:mt-12' : ''}
              >
                <div className={`${stat.bg} p-7 md:p-8 rounded-xl`}>
                  <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white leading-none">
                    {stat.prefix || ''}{stat.target.toLocaleString()}{stat.suffix}
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground leading-relaxed max-w-[260px] whitespace-pre-line">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SECTIONS GRID — "VIEW THE SECTIONS" ═══════════════════════
           Reference: 3×2 grid, rounded-xl colored cards, white bold uppercase text, arrow circle */}
      <section className="py-16 md:py-24 bg-[#F5F0EB]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              LampFarms &nbsp;·&nbsp; Platform
            </span>
          </div>

          <motion.h2 {...fadeUp}
            className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground mb-10">
            Explore the Platform
          </motion.h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {sectionCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`${card.bg} p-5 md:p-7 rounded-xl flex flex-col justify-between min-h-[120px] md:min-h-[140px] group cursor-pointer hover:opacity-90 transition-opacity`}
              >
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-white leading-tight whitespace-pre-line">
                  {card.title}
                </h3>
                <div className="flex justify-end mt-4">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <ArrowRight className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA BANNER ═══════════════════════ */}
      <section className="relative overflow-hidden bg-foreground py-20 md:py-28">
        <YellowStarBurst className="absolute -top-16 -left-16 w-[300px] h-[300px] text-[hsl(var(--accent-gold))] opacity-10" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[#F5F0EB] leading-[1.05] mb-6">
                Ready to<br />Transform<br />Your Farm?
              </h2>
              <p className="text-[#F5F0EB]/60 text-base mb-10 max-w-md leading-relaxed">
                Join hundreds of poultry farmers across West Africa already using LampFarms to track batches, optimize feed, and grow with confidence.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register"
                  className="inline-flex items-center gap-2 bg-[hsl(var(--accent-gold))] text-[hsl(var(--accent-gold-foreground))] px-6 py-3 text-xs font-black uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity">
                  Create Free Account <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/login"
                  className="inline-flex items-center gap-2 border border-[#F5F0EB]/20 text-[#F5F0EB] px-6 py-3 text-xs font-black uppercase tracking-wider rounded-lg hover:bg-[#F5F0EB]/10 transition-colors">
                  Sign In
                </Link>
              </div>
            </motion.div>
            <div className="hidden lg:flex justify-end">
              <YellowStarBurst className="w-48 h-48 text-[hsl(var(--accent-gold))] opacity-25" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="bg-[#F5F0EB] py-8 border-t border-black/5">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
              <span className="text-[6px] font-black text-white">LF</span>
            </div>
            <span className="text-[11px] font-black uppercase tracking-tight">LampFarms</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            © {new Date().getFullYear()} LampFarms — Smart Poultry Management for West Africa
          </p>
          <div className="flex gap-5">
            <Link to="/login" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
