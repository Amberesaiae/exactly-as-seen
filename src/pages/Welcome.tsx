import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowUpRight, Menu, X, ChevronRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { YellowStarBurst, LeafBranch } from '@/components/landing/LandingDecorations';
import { useState, useRef } from 'react';

/* ── Unsplash images ── */
const IMG = {
  heroFarmer: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=80',
  landscape: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80',
  poultry: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80',
  community: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
  portrait1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  portrait2: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80',
  portrait3: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80',
  panorama: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1400&q=80',
  farmTech: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&q=80',
};

const sectionCards = [
  { title: 'BATCH\nMANAGEMENT', bg: 'bg-[#22C55E]', route: '/batches' },
  { title: 'FEED\nCALCULATOR', bg: 'bg-[#06B6D4]', route: '/feed' },
  { title: 'HEALTH &\nVACCINATION', bg: 'bg-[#4A90D9]', route: '/health' },
  { title: 'EGG PRODUCTION\n& TRACKING', bg: 'bg-[#F59E0B]', route: '/eggs' },
  { title: 'FINANCE\n& STOCK', bg: 'bg-[#F97316]', route: '/finance' },
  { title: 'OFFLINE-FIRST\nSYNC', bg: 'bg-[#22C55E]', route: '/register' },
];

const menuLinks = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Batch Management', route: '/batches' },
  { label: 'Feed Calculator', route: '/feed' },
  { label: 'Health & Vaccination', route: '/health' },
  { label: 'Egg Production', route: '/eggs' },
  { label: 'Finance & Stock', route: '/finance' },
];

/* ── Animation variants ── */
const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.12 } },
  viewport: { once: true } as const,
};

const staggerChild = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

function Breadcrumb({ left, right }: { left: string; right: string }) {
  return (
    <div className="bg-[#F5F0EB] px-5 lg:px-10 py-3 border-y border-black/5">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {left}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {right}
        </span>
      </div>
    </div>
  );
}

export default function Welcome() {
  const { user, loading, farmReady } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const panoramaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: panoramaProgress } = useScroll({
    target: panoramaRef,
    offset: ['start end', 'end start'],
  });
  const panoramaY = useTransform(panoramaProgress, [0, 1], ['0%', '20%']);

  if (!loading && user) {
    if (farmReady === true) return <Navigate to="/dashboard" replace />;
    if (farmReady === false) return <Navigate to="/farm-setup" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] text-foreground font-sans overflow-x-hidden">

      {/* ═══ STICKY NAV ═══ */}
      <nav className="sticky top-0 z-50 bg-[#F5F0EB]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between px-5 lg:px-10">
          <Link to="/welcome" className="text-[13px] font-black tracking-tight uppercase text-foreground">
            LampFarms
          </Link>
          <span className="hidden md:block text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Smart Poultry Management
          </span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors">
              Sign In
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] hover:text-primary transition-colors"
            >
              {menuOpen ? (
                <><X className="h-3.5 w-3.5" /> Close</>
              ) : (
                <>Menu <span className="text-primary font-black">+</span></>
              )}
            </button>
          </div>
        </div>

        {/* ── Full-screen menu overlay ── */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-12 left-0 right-0 bg-[#F5F0EB] border-t border-black/5 shadow-2xl z-50"
          >
            <div className="max-w-[1400px] mx-auto px-5 lg:px-10 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-1">
                {menuLinks.map((link, i) => (
                  <motion.div
                    key={link.route}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <Link
                      to={link.route}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center justify-between py-3 border-b border-black/5 hover:border-primary/30 transition-colors"
                    >
                      <span className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                        {link.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Create Account <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ═══ HERO — 3-col photo collage ═══ */}
      <section className="relative min-h-[calc(100vh-3rem)] overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr]">
          {/* Left photo */}
          <motion.div
            className="relative overflow-hidden"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={IMG.heroFarmer} alt="West African farmer with poultry" className="absolute inset-0 w-full h-full object-cover" />
          </motion.div>

          {/* Center cream panel */}
          <div className="relative bg-[#F5F0EB] flex items-start justify-center pt-12 lg:pt-20">
            <motion.div
              initial={{ scale: 0, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 0.9 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <YellowStarBurst className="w-40 h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 text-[hsl(var(--accent-gold))]" />
            </motion.div>
          </div>

          {/* Right photo with inset circle */}
          <div className="hidden lg:block relative overflow-hidden">
            <motion.img
              src={IMG.landscape}
              alt="West African farming landscape"
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute top-8 right-8 w-44 h-44 rounded-full overflow-hidden border-4 border-[#F5F0EB] shadow-xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <img src={IMG.poultry} alt="Poultry house" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div
              className="absolute bottom-0 right-0 w-24 h-32 bg-primary/80 rounded-tl-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Title overlay */}
        <div className="relative z-10 min-h-[calc(100vh-3rem)] flex flex-col justify-end">
          <div className="bg-gradient-to-t from-black/70 via-black/30 to-transparent px-5 lg:px-10 pb-10 md:pb-16 pt-40">
            <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <motion.h1
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-[clamp(2.5rem,8vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.03em] text-white"
              >
                Grow Smarter<br />Farm Better
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-base md:text-lg font-black uppercase tracking-tight text-white/90 md:text-right leading-tight"
              >
                West Africa's<br />Poultry<br />Platform
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BREADCRUMB ═══ */}
      <Breadcrumb left="LampFarms · About" right="01 / 06" />

      {/* ═══ NARRATIVE — 3-col: rotated photo | text | photo+accent ═══ */}
      <section className="py-16 md:py-24 bg-[#F5F0EB]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-8 lg:gap-14 items-start">
            <motion.div {...fadeUp} className="relative hidden lg:block">
              <div className="relative -rotate-3 border-[6px] border-[#4A90D9] rounded-sm overflow-hidden shadow-lg hover:rotate-0 transition-transform duration-500">
                <img src={IMG.community} alt="Community of farmers" className="w-full aspect-[3/4] object-cover" loading="lazy" />
              </div>
            </motion.div>

            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight mb-6">
                Empowering Family Farms
              </h2>
              <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
                <p>No matter where they farm, poultry producers across West Africa aspire to live in dignity from the fruits of their labor. No matter where they farm, women and men engage in this quest and find meaning in it.</p>
                <p>LampFarms was built to present information and data from your farm operations — as well as the stories of women and men committed to family farming. In their own ways and according to their realities, these individuals are engaged because they feel they can make an impact.</p>
                <p>When a challenge is shared by many — such as the unpredictable effects of feed price volatility or disease outbreaks — engaging to solve "our" problem can have a collective impact. Individual and collective interests align through commitment to better farming practices.</p>
                <p>Who knows — perhaps one day, the commitment of women and men across West Africa will help family poultry farming thrive. At LampFarms, our dedication is to contribute to this goal!</p>
              </div>
            </motion.div>

            <motion.div {...fadeUp} className="relative hidden lg:block">
              <img src={IMG.poultry} alt="Modern poultry house" className="w-full aspect-[3/4] object-cover rounded-sm" loading="lazy" />
              <div className="absolute -bottom-3 -right-3 w-20 h-28 bg-primary/70 -z-10 rounded-sm" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ BREADCRUMB ═══ */}
      <Breadcrumb left="LampFarms · Smart Tools" right="Technology / 1" />

      {/* ═══ PROFILE CARD 1 — photo left, text right, yellow accent bar ═══ */}
      <section className="py-14 bg-white">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-16 items-start">
            <motion.div {...fadeUp} className="relative group">
              <img src={IMG.portrait1} alt="Farm technology expert" className="w-full aspect-square object-cover rounded-sm group-hover:shadow-xl transition-shadow duration-500" loading="lazy" />
              <motion.div
                className="absolute -bottom-2 left-0 h-3 bg-[#F59E0B]/80"
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.div>
            <motion.div {...fadeUp}>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">Built for African Realities</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[0.92] mb-6">
                Smart Farm<br />Management
              </h2>
              <p className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider">Technology That Understands Your Farm</p>
              <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
                <p>LampFarms isn't another Silicon Valley farm-tech product adapted for emerging markets. It was conceived, designed, and tested in West African farming communities. Every workflow accounts for intermittent connectivity, local feed ingredients, regional vaccination protocols, and the specific economics of poultry production.</p>
                <p>Our feed formulation engine uses Linear Programming optimization with a database of locally available ingredients — maize, soybean meal, fishmeal, oyster shell, wheat bran — at current market prices. The health module follows West African veterinary guidelines with proper withdrawal periods.</p>
                <p>Whether you manage 50 birds or 50,000, LampFarms scales with your operation. Track multiple batches across houses, monitor mortality and feed conversion daily, record egg production by size category, and see your profitability in real time.</p>
              </div>
              <Link to="/register" className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold uppercase tracking-wider text-primary hover:underline story-link">
                Read More <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ BREADCRUMB ═══ */}
      <Breadcrumb left="LampFarms · Offline-First" right="Technology / 2" />

      {/* ═══ PROFILE CARD 2 — reversed: text left, photo right ═══ */}
      <section className="py-14 bg-[#F5F0EB]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-16 items-start">
            <motion.div {...fadeUp}>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">Works Without Internet</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[0.92] mb-6">
                Offline-First<br />Architecture
              </h2>
              <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
                <p>In rural West Africa, internet connectivity is unpredictable. LampFarms was designed from the ground up to work completely offline. Every feature — from batch tracking to feed formulation — functions without an internet connection.</p>
                <p>When connectivity is restored, your data syncs automatically and securely to the cloud. No data is ever lost, no entry needs to be repeated. Your farm records are always accessible, whether you're in the field or at home.</p>
                <p>Our sync engine handles conflicts intelligently, ensuring that records entered on multiple devices are merged correctly. This is enterprise-grade technology adapted for the realities of farming in areas with limited infrastructure.</p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <motion.div className="h-1.5 bg-[#F59E0B]" initial={{ width: 0 }} whileInView={{ width: 48 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} />
                <motion.div className="h-1.5 bg-primary" initial={{ width: 0 }} whileInView={{ width: 32 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.35 }} />
                <motion.div className="h-1.5 bg-[#8B7EC8]" initial={{ width: 0 }} whileInView={{ width: 24 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} />
              </div>
              <Link to="/register" className="inline-flex items-center gap-1.5 mt-5 text-sm font-bold uppercase tracking-wider text-primary hover:underline story-link">
                Read the Full Text <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div {...fadeUp} className="relative group">
              <img src={IMG.portrait2} alt="Technology leader" className="w-full aspect-[3/4] object-cover rounded-sm group-hover:shadow-xl transition-shadow duration-500" loading="lazy" />
              <div className="absolute -top-2 -right-2 w-full h-full border-[6px] border-[#8B7EC8]/40 -z-10 rounded-sm" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ BREADCRUMB ═══ */}
      <Breadcrumb left="LampFarms · Community" right="03 / 06" />

      {/* ═══ PROFILE CARD 3 — photo left with purple accent, text right ═══ */}
      <section className="py-14 bg-white">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-16 items-start">
            <motion.div {...fadeUp} className="relative group">
              <img src={IMG.portrait3} alt="Agricultural expert" className="w-full aspect-square object-cover rounded-sm group-hover:shadow-xl transition-shadow duration-500" loading="lazy" />
              <div className="absolute -top-2 -left-2 w-full h-full border-[6px] border-[#8B7EC8]/50 -z-10 rounded-sm" />
              <motion.div
                className="absolute -bottom-2 left-0 h-3 bg-primary/80"
                initial={{ width: 0 }}
                whileInView={{ width: '66%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.div>
            <motion.div {...fadeUp}>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">Community Driven</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[0.92] mb-6">
                Growing<br />Together
              </h2>
              <p className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider">Collective Impact Through Shared Knowledge</p>
              <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
                <p>The strength of West African poultry farming lies in its community. LampFarms connects producers across regions, enabling knowledge sharing that elevates everyone. When one farmer discovers an effective feed formulation, the entire community benefits.</p>
                <p>Our platform aggregates anonymized production data to surface regional insights — average feed conversion ratios, seasonal mortality patterns, market price trends — giving every farmer access to information that was previously available only to large commercial operations.</p>
              </div>
              <Link to="/register" className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold uppercase tracking-wider text-primary hover:underline story-link">
                Read the Full Text <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ BREADCRUMB ═══ */}
      <Breadcrumb left="LampFarms · Initiative" right="04 / 06" />

      {/* ═══ FULL-WIDTH TEXT BLOCK ═══ */}
      <section className="py-14 bg-[#F5F0EB]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="max-w-3xl">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground leading-tight mb-4">
                The Family Farm Initiative
              </h2>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">A Competition for Agricultural Innovation</p>
              <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
                <p>Every year, LampFarms recognizes outstanding family poultry farms that demonstrate innovation, sustainability, and community leadership. The initiative celebrates producers who use data-driven practices, implement biosecurity protocols, and mentor fellow farmers.</p>
                <p>Winners receive platform credits, equipment upgrades, and recognition across the LampFarms network — inspiring the next generation of West African poultry farmers to embrace modern management techniques while honoring traditional farming values.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ WIDE PANORAMIC PHOTO with parallax ═══ */}
      <section ref={panoramaRef} className="relative overflow-hidden">
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <motion.img
            src={IMG.panorama}
            alt="West African agricultural landscape panorama"
            className="absolute inset-0 w-full h-[120%] object-cover"
            style={{ y: panoramaY }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-5 lg:px-10 pb-6">
            <div className="max-w-[1400px] mx-auto">
              <motion.div {...fadeUp}>
                <p className="text-white text-xs font-bold uppercase tracking-[0.2em]">
                  Family poultry farming across the landscapes of West Africa
                </p>
                <p className="text-white/70 text-[10px] mt-1">Photo: West African agricultural communities thriving through shared knowledge</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BREADCRUMB — Stats ═══ */}
      <div className="bg-[#F5F0EB] px-5 lg:px-10 py-3 border-b border-black/5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            LampFarms &nbsp;·&nbsp; Impact
          </span>
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground">
            Our Year in Numbers
          </span>
        </div>
      </div>

      {/* ═══ STATS — colored blocks matching UPA DI reference ═══ */}
      <section className="py-16 md:py-24 bg-[#F5F0EB]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="grid grid-cols-2 gap-4 md:gap-5 max-w-4xl">
            {/* Row 1 */}
            <AnimatedCounter target={142} suffix="" label="Institutions and member organizations" blockColor="blue" />
            <div className="mt-8 md:mt-14">
              <AnimatedCounter target={90} suffix="" label="Volunteer agricultural experts contributing" blockColor="green" />
            </div>
            {/* Row 2 */}
            <AnimatedCounter target={90} suffix="" label="International development projects" blockColor="yellow" />
            <div className="mt-8 md:mt-14">
              <AnimatedCounter
                target={9919915}
                prefix="₵"
                suffix=""
                label={'Annual production value\ntracked on the platform\n\nFeed costs: 56.8%\nMedication: 17.9%\nRevenue from eggs: 22.3%\nOther: 3%'}
                blockColor="purple"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BREADCRUMB ═══ */}
      <Breadcrumb left="LampFarms · Platform" right="05 / 06" />

      {/* ═══ SECTION CARDS — "EXPLORE THE PLATFORM" ═══ */}
      <section className="py-16 md:py-20 bg-[#F5F0EB]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <motion.h2 {...fadeUp} className="text-lg md:text-xl font-black uppercase tracking-[0.1em] text-foreground mb-10">
            Explore the Platform
          </motion.h2>
          <motion.div
            {...staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5"
          >
            {sectionCards.map((card) => (
              <motion.div key={card.title} variants={staggerChild}>
                <Link
                  to={card.route}
                  className={`${card.bg} rounded-2xl p-6 md:p-8 aspect-[4/3] flex flex-col justify-between group hover:scale-[1.03] hover:shadow-xl transition-all duration-300`}
                >
                  <h3 className="text-sm md:text-base lg:text-lg font-black uppercase tracking-tight text-white leading-tight whitespace-pre-line">
                    {card.title}
                  </h3>
                  <div className="self-end">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/40 group-hover:scale-110 transition-all duration-300">
                      <ArrowUpRight className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-20 md:py-28 bg-foreground overflow-hidden">
        <YellowStarBurst className="absolute -top-20 -right-20 w-64 h-64 text-[hsl(var(--accent-gold))] opacity-20" />
        <LeafBranch className="absolute bottom-0 left-0 w-32 h-48 text-white/5 rotate-[20deg]" />
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10 relative z-10 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-[0.92] mb-6">
              Start Managing<br />Your Farm Today
            </h2>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-8">
              Join hundreds of West African poultry farmers who trust LampFarms to track their operations, optimize feed costs, and grow their business — online or offline.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-[hsl(var(--accent-gold))] text-foreground font-bold text-sm uppercase tracking-wider px-8 py-3.5 rounded-lg hover:opacity-90 hover:scale-105 transition-all duration-300"
              >
                Create Free Account <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="text-white/70 text-sm font-bold uppercase tracking-wider hover:text-white transition-colors">
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-foreground border-t border-white/10 py-10 px-5 lg:px-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-sm font-black uppercase tracking-tight text-white">LampFarms</span>
            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-[0.15em]">Smart Poultry Management</p>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
