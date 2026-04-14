import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sprout, Bird, Wheat, HeartPulse, Egg, Wallet, WifiOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { SunflowerMotif, LeafDecoration, FeatherDecoration, WaveDivider, DotsGrid } from '@/components/landing/LandingDecorations';

const features = [
  { icon: Bird, title: 'Batch Management', desc: 'Track every flock from day-old chicks to market weight with phase-aware timelines.' },
  { icon: Wheat, title: 'Feed Calculator', desc: 'Three formulation methods — ready-made, custom LP-optimized, and concentrate mixing.' },
  { icon: HeartPulse, title: 'Health Tracking', desc: 'Vaccination schedules, mortality logs, and withdrawal period alerts.' },
  { icon: Egg, title: 'Egg Production', desc: 'Daily collection records with size grading, breakage tracking, and lay-rate analytics.' },
  { icon: Wallet, title: 'Finance & Stock', desc: 'Automatic expense integration, revenue tracking, and inventory management.' },
  { icon: WifiOff, title: 'Offline-First', desc: 'Works without internet. Data syncs automatically when you reconnect.' },
];

export default function Welcome() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-12 h-16">
          <Link to="/welcome" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sprout className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">LampFarms</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="font-medium">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="rounded-full font-semibold px-6">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Decorative SVGs */}
        <SunflowerMotif className="absolute top-20 right-[-4rem] w-72 h-72 md:w-96 md:h-96 text-[hsl(var(--accent-gold))] rotate-12 opacity-60 pointer-events-none" />
        <LeafDecoration className="absolute bottom-12 left-[-2rem] w-28 h-40 text-primary opacity-50 -rotate-12 pointer-events-none" />
        <DotsGrid className="absolute top-1/3 right-8 w-28 h-28 text-primary opacity-20 pointer-events-none hidden lg:block" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary mb-6">
                Smart Poultry Management
              </p>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-foreground">
                Grow<br />
                Smarter.<br />
                <span className="text-primary">Farm Better.</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl"
            >
              The complete farm management platform built for West African poultry farmers. 
              Track batches, optimize feed formulations, and make data-driven decisions — even offline.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Button asChild size="lg" className="rounded-full font-bold px-8 h-13 text-base gap-2">
                <Link to="/register">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="rounded-full font-semibold px-8 h-13 text-base">
                <Link to="/login">Sign In</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── WAVE DIVIDER ─── */}
      <WaveDivider className="w-full h-10 md:h-16 text-primary" />

      {/* ─── STATS SECTION ─── */}
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-16"
          >
            Our Year in Numbers
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
            <AnimatedCounter target={500} suffix="+" label="Farms Onboarded" />
            <div className="md:mt-12">
              <AnimatedCounter target={1} suffix="M+" label="Birds Tracked" />
            </div>
            <div className="md:mt-6">
              <AnimatedCounter target={12} suffix="+" label="Regions Served" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-24 md:py-32 relative">
        <FeatherDecoration className="absolute top-8 right-6 w-16 h-40 text-primary opacity-25 rotate-12 pointer-events-none hidden lg:block" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 lg:gap-24 items-start">
            {/* Left — headline */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:sticky lg:top-32"
            >
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
                Everything You Need
              </p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-foreground">
                Built for the way you farm
              </h2>
              <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
                Six integrated modules that work together seamlessly — from day-old chicks 
                to market, from feed formulation to financial reports.
              </p>
            </motion.div>

            {/* Right — feature cards */}
            <div className="grid gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="group flex gap-5 p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground py-24 md:py-32">
        <SunflowerMotif className="absolute -top-12 -left-12 w-56 h-56 text-[hsl(var(--accent-gold))] opacity-40 pointer-events-none" />
        <LeafDecoration className="absolute bottom-4 right-[-1rem] w-24 h-32 text-primary-foreground opacity-30 rotate-[25deg] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Ready to transform your farm?
            </h2>
            <p className="mt-6 text-primary-foreground/80 text-lg leading-relaxed">
              Join hundreds of poultry farmers already using LampFarms to make smarter decisions every day.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="mt-8 rounded-full font-bold px-10 h-13 text-base gap-2"
            >
              <Link to="/register">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sprout className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">LampFarms</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Create Account</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} LampFarms. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
