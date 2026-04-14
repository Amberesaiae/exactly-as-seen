import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { YellowStarBurst, LeafBranch, WaveDivider } from '@/components/landing/LandingDecorations';
import { useState } from 'react';

const featureCards = [
  { title: 'BATCH MANAGEMENT', color: 'bg-primary' },
  { title: 'FEED CALCULATOR', color: 'bg-accent-cyan' },
  { title: 'HEALTH TRACKING', color: 'bg-accent-gold' },
  { title: 'EGG PRODUCTION', color: 'bg-orange-500' },
  { title: 'FINANCE & STOCK', color: 'bg-primary' },
  { title: 'OFFLINE-FIRST', color: 'bg-accent-cyan' },
];

export default function Welcome() {
  const { user, loading, farmReady } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!loading && user) {
    if (farmReady === true) return <Navigate to="/dashboard" replace />;
    if (farmReady === false) return <Navigate to="/farm-setup" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── STICKY NAV ─── */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 lg:px-12">
          <Link to="/welcome" className="text-xl font-black tracking-tight uppercase">
            LampFarms
          </Link>
          <span className="hidden md:block text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Smart Poultry Management
          </span>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm font-semibold uppercase tracking-wider text-foreground hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center gap-1.5 bg-foreground text-background px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
            >
              Menu <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sm:hidden border-t border-border px-6 py-4 flex flex-col gap-3 bg-background"
          >
            <Link to="/login" className="text-sm font-semibold uppercase tracking-wider">Sign In</Link>
            <Link to="/register" className="text-sm font-semibold uppercase tracking-wider text-primary">Get Started</Link>
          </motion.div>
        )}
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-end overflow-hidden bg-gradient-to-br from-[hsl(150,20%,8%)] via-[hsl(150,15%,12%)] to-[hsl(142,30%,15%)]">
        <YellowStarBurst className="absolute -top-20 -right-20 w-[500px] h-[500px] md:w-[700px] md:h-[700px] text-[hsl(var(--accent-gold))] opacity-70" />
        <LeafBranch className="absolute top-1/4 -left-12 w-48 h-64 md:w-64 md:h-80 text-primary opacity-50 -rotate-12" />

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 lg:px-12 pb-16 md:pb-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.85] tracking-tighter text-white">
                Grow<br />Smarter.<br />Farm<br />Better.
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="md:text-right md:max-w-xs"
            >
              <p className="text-sm md:text-base font-bold uppercase tracking-[0.2em] text-white/80 leading-relaxed">
                West Africa's<br />Leading Poultry<br />Management Platform
              </p>
              <div className="mt-6 flex md:justify-end gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-[hsl(var(--accent-gold))] text-[hsl(var(--accent-gold-foreground))] px-6 py-3 text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Get Started <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <WaveDivider className="w-full h-8 md:h-12 text-background" />
        </div>
      </section>

      {/* ─── NARRATIVE SECTION ─── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-8">
              Lands of Growth
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              LampFarms empowers poultry farmers across West Africa with smart batch management,
              optimized feed formulation, and real-time health tracking. Built for the realities
              of farming — works offline, syncs when connected, and puts every decision at your fingertips.
            </p>
            <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
              From day-old chicks to market-ready birds, we help you track every metric that matters:
              mortality, feed conversion, egg production, vaccination schedules, and profitability.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-xs md:text-sm font-black uppercase tracking-[0.3em] text-muted-foreground mb-20 md:mb-28"
          >
            Our Impact in Numbers
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-20 md:gap-y-28">
            <div className="sm:pt-0">
              <AnimatedCounter target={500} suffix="+" label="Farms Managed" barColor="accent-gold" />
            </div>
            <div className="sm:pt-16">
              <AnimatedCounter target={1} suffix="M+" label="Birds Tracked" barColor="primary" />
            </div>
            <div className="sm:pt-0">
              <AnimatedCounter target={12} suffix="+" label="Regions Covered" barColor="accent-cyan" />
            </div>
            <div className="sm:pt-16">
              <AnimatedCounter target={98} suffix="%" label="Uptime Reliability" barColor="accent-gold" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-xs md:text-sm font-black uppercase tracking-[0.3em] text-muted-foreground mb-16"
          >
            Explore LampFarms
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`${card.color} p-10 md:p-14 flex items-end min-h-[200px] md:min-h-[240px] cursor-default`}
              >
                <h3 className="text-lg md:text-xl font-black uppercase tracking-wider text-white leading-tight">
                  {card.title}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(142,71%,25%)] py-20 md:py-28">
        <YellowStarBurst className="absolute -top-24 -right-24 w-[400px] h-[400px] text-[hsl(var(--accent-gold))] opacity-30" />
        <LeafBranch className="absolute bottom-0 -left-8 w-40 h-56 text-primary-foreground opacity-20 rotate-12" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-primary-foreground leading-tight mb-6">
              Ready to Transform<br />Your Farm?
            </h2>
            <p className="text-primary-foreground/80 text-base md:text-lg mb-10 max-w-xl mx-auto">
              Join hundreds of farmers already using LampFarms to grow smarter and farm better.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-[hsl(var(--accent-gold))] text-[hsl(var(--accent-gold-foreground))] px-8 py-4 text-sm font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-black uppercase tracking-tight">LampFarms</span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LampFarms. Smart poultry management for West Africa.
          </p>
          <div className="flex gap-6">
            <Link to="/login" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
