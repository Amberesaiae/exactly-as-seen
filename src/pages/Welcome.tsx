import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sprout, Bird, Wheat, Heart, Egg, Wallet, WifiOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { LeafDecoration, FeatherDecoration, CirclePattern, DotsGrid } from '@/components/landing/LandingDecorations';

const features = [
  { icon: Bird, title: 'Batch Management', desc: 'Track every flock from day-old chicks to market weight with lifecycle tracking.' },
  { icon: Wheat, title: 'Feed Calculator', desc: 'Three formulation methods with West African safety protocols built in.' },
  { icon: Heart, title: 'Health Tracking', desc: 'Vaccination schedules, medication logs, and mortality monitoring.' },
  { icon: Egg, title: 'Egg Production', desc: 'Daily collection records with quality grading and production analytics.' },
  { icon: Wallet, title: 'Finance & Stock', desc: 'Expenses, revenue, and inventory with automatic feed-to-finance sync.' },
  { icon: WifiOff, title: 'Offline-First', desc: 'Works without internet. Data syncs automatically when you reconnect.' },
];

export default function Welcome() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">LampFarms</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full font-semibold">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full font-semibold">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 md:px-12 text-center">
        {/* Decorations */}
        <LeafDecoration className="absolute top-12 left-6 md:left-20 w-28 h-36 text-primary opacity-40 -rotate-12" />
        <FeatherDecoration className="absolute bottom-16 right-6 md:right-16 w-20 h-48 text-primary opacity-30 rotate-6" />
        <CirclePattern className="absolute top-1/3 right-1/4 w-48 h-48 text-primary opacity-20 hidden md:block" />
        <DotsGrid className="absolute bottom-24 left-1/4 w-28 h-28 text-primary opacity-20 hidden md:block" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-3xl"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            Grow Smarter.<br />
            <span className="text-primary">Farm Better.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            The all-in-one poultry management platform built for West African farmers. Track batches, optimize feed, and grow your farm with confidence.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full text-base font-bold px-8 gap-2">
              <Link to="/register">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full text-base font-semibold px-8">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-secondary/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground mb-12">
            Our Year in Numbers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <AnimatedCounter target={500} suffix="+" label="Farms Managed" />
            <AnimatedCounter target={1000000} suffix="+" label="Birds Tracked" />
            <AnimatedCounter target={12} suffix="+" label="Countries" />
          </div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Everything You Need
            </h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-lg mx-auto">
              Six powerful modules designed for real farming operations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground py-20 md:py-24 px-6 md:px-12">
        <LeafDecoration className="absolute -top-8 -left-6 w-36 h-48 text-primary-foreground opacity-20 rotate-45" />
        <FeatherDecoration className="absolute -bottom-8 -right-4 w-24 h-52 text-primary-foreground opacity-15 -rotate-12" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Join hundreds of farmers already using LampFarms to boost productivity.
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-full text-base font-bold px-8 gap-2">
            <Link to="/register">Create Free Account <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 md:px-12 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">LampFarms</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Create Account</Link>
          </div>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} LampFarms</span>
        </div>
      </footer>
    </div>
  );
}
