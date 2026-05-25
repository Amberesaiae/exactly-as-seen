import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, Bird, FlaskConical, HeartPulse, LineChart, WifiOff, ShieldCheck, Zap } from 'lucide-react';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { Eyebrow } from '@/components/landing/LandingLayout';
import { LandingNav } from '@/components/landing/LandingNav';

const IMG = {
  hero: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=80&auto=format&fit=crop',
  field: 'https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?w=1200&q=80&auto=format&fit=crop', // Ghanaian farm setting
  poultry: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=1200&q=80&auto=format&fit=crop',
  hands: 'https://images.unsplash.com/photo-1592982537447-7440770faae9?w=1200&q=80&auto=format&fit=crop',
  feed: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1200&q=80&auto=format&fit=crop',
  panorama: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1800&q=80&auto=format&fit=crop',
  farmer1: 'https://images.unsplash.com/photo-1542601906990-b4d3fb75bb21?w=600&q=80&auto=format&fit=crop', // Kwesi
  farmer2: 'https://images.unsplash.com/photo-1506484334402-40ff44e58046?w=600&q=80&auto=format&fit=crop', // Adama
  blog1: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80&auto=format&fit=crop',
  blog2: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=900&q=80&auto=format&fit=crop',
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function Welcome() {
  return (
    <div className="bg-background text-foreground selection:bg-primary/20">
      <LandingNav />
      {/* HERO SECTION */}
      <section id="platform" className="relative mx-auto max-w-[1400px] px-6 pb-20 pt-32 lg:px-10 lg:pb-32 lg:pt-40">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-10 items-center">
          <motion.div initial="hidden" animate="show" variants={staggerContainer} className="lg:col-span-7">
            <motion.div variants={fadeUp}>
              <Eyebrow>Precision Poultry · West African Heritage</Eyebrow>
            </motion.div>
            <motion.h1 variants={fadeUp} className="mt-8 text-5xl sm:text-7xl lg:text-[100px] font-black leading-[0.9] tracking-tighter">
              The <span className="italic font-serif font-normal text-primary">quiet</span> rhythm of <br />
              high-yield farming.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-10 max-w-xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              LampFarms bridges the gap between traditional wisdom and precision data. From custom feed mixes to vaccination alerts, we give you the tools to lead your flock with absolute clarity.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-12 flex flex-wrap items-center gap-4">
              <Link to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4.5 text-sm font-bold text-background hover:bg-foreground/90 transition shadow-2xl shadow-foreground/20">
                Start your free farm <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href="#solutions" className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-8 py-4.5 text-sm font-bold hover:bg-foreground/5 transition">
                Explore the modules
              </a>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" animate="show" variants={fadeUp}
                      transition={{ delay: 0.3 }} className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] bg-secondary group">
              <img src={IMG.hands} alt="West African farmer handling healthy poultry"
                   className="h-full w-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
              
              {/* Floating Stat Card */}
              <div className="absolute -bottom-6 -left-6 right-6 lg:right-auto lg:w-[320px] rounded-3xl bg-background/95 backdrop-blur-xl p-6 shadow-2xl border border-foreground/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-full bg-primary/10"><Bird className="h-5 w-5 text-primary" /></div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-3 py-1 rounded-full">Live Data</div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Flock Health Index</span>
                    <span className="text-2xl font-black tracking-tight">98.4%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '98.4%' }} transition={{ duration: 1.5, delay: 1 }} className="h-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* THE OFFLINE-FIRST PROMISE */}
      <section id="resources" className="bg-foreground text-background py-24 lg:py-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-background/20 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
                <WifiOff className="h-3 w-3" /> Built for the field
              </div>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[0.95] mb-8">
                The <span className="text-primary italic font-serif font-normal">Offline-First</span><br />Promise.
              </h2>
              <p className="text-background/70 text-lg leading-relaxed max-w-xl mb-12">
                We know that the best farms aren't always where the strongest signal is. LampFarms works entirely offline, syncing your data automatically when you're back in range. No lost mortality logs, no missed feed records.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <FeatureItem icon={<Zap className="h-5 w-5" />} title="Zero Latency" desc="Instant logging, even in the deep field." />
                <FeatureItem icon={<ShieldCheck className="h-5 w-5" />} title="Safe Sync" desc="Automated, conflict-free cloud backup." />
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-background/5 rounded-[32px] border border-background/10 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 inline-flex p-4 rounded-full bg-primary/20 text-primary">
                    <WifiOff className="h-8 w-8" />
                  </div>
                  <div className="text-2xl font-black tracking-tight">Offline Mode Active</div>
                  <p className="text-background/40 text-sm mt-2">Data will sync when connection is restored.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTIONS MODULES */}
      <section id="solutions" className="py-24 lg:py-40 bg-secondary/20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="max-w-3xl mb-24">
            <Eyebrow>Integrated Ecosystem</Eyebrow>
            <h2 className="mt-8 text-5xl sm:text-7xl font-black tracking-tighter leading-[0.95]">
              Four modules. <br />
              Built for <span className="text-primary">clarity</span>.
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <ModuleCard 
              image={IMG.poultry} 
              icon={<Bird className="h-6 w-6" />}
              title="Flock Intelligence"
              subtitle="Batch Management"
              desc="Track every batch from chick arrival to final harvest. Real-time FCR, mortality alerts, and weight trends."
              tags={['FCR Tracking', 'Mortality Alerts', 'Age Curves']}
            />
            <ModuleCard 
              image={IMG.feed} 
              icon={<FlaskConical className="h-6 w-6" />}
              title="Feed Lab"
              subtitle="Nutrition Optimizer"
              desc="The region's most advanced feed calculator. Mix concentrates, full custom rations, or manual formulations."
              tags={['Pyomo LP Optimizer', 'Safety Bounds', 'Cost Calculation']}
            />
            <ModuleCard 
              image={IMG.field} 
              icon={<HeartPulse className="h-6 w-6" />}
              title="Care & Water"
              subtitle="Health Protocols"
              desc="Never miss a vaccination. Automated schedules tuned to West African species and withdrawal warnings."
              tags={['Vaccination Logic', 'Withdrawal Tracking', 'Water Logs']}
            />
            <ModuleCard 
              image={IMG.panorama} 
              icon={<LineChart className="h-6 w-6" />}
              title="Yield & Ledger"
              subtitle="Financial Analytics"
              desc="Know your true cost per bird. Reconcile expenses, revenue, and harvest yield into an honest margin."
              tags={['Profit/Loss', 'Unit Costing', 'Cost Privacy']}
            />
          </div>
        </div>
      </section>

      {/* IMPACT METRICS */}
      <section id="impact" className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-40">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5">
            <Eyebrow>Real Impact</Eyebrow>
            <h2 className="mt-8 text-5xl font-black tracking-tighter leading-[0.95] mb-10">
              Leading the yield <br />across West Africa.
            </h2>
            <div className="space-y-8">
              <ImpactStat number="500+" label="Active farms utilizing digital tracking" />
              <ImpactStat number="18%" label="Average reduction in mortality rates" />
              <ImpactStat number="92%" label="Vaccination compliance rate" />
            </div>
          </div>
          <div className="lg:col-span-7 bg-foreground rounded-[40px] p-8 lg:p-16 text-background">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
               <AnimatedCounter target={500} suffix="+" label={'Active\nFarms'} barColor="primary" />
               <AnimatedCounter target={12400} label={'Daily Birds\nTracked'} barColor="accent-cyan" />
               <AnimatedCounter target={18} prefix="−" suffix="%" label={'Mortality\nReduction'} barColor="accent-gold" />
               <AnimatedCounter target={90} suffix="%" label={'Health\nCompliance'} barColor="accent-purple" />
             </div>
          </div>
        </div>
      </section>

      {/* VOICES FROM THE FIELD */}
      <section className="bg-foreground text-background py-24 lg:py-40 overflow-hidden relative">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-background/20 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
              Field Reports
            </div>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.95]">
              Voices from <br /><span className="text-primary italic font-serif font-normal">the field</span>.
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Testimonial 
              image={IMG.farmer1}
              name="Kwesi Appiah"
              role="Layer Farmer · Kumasi, Ghana"
              quote="Before LampFarms I was guessing at feed mixes. Now I plug in what's at the market and the optimizer shows me the cheapest safe ration in seconds."
            />
            <Testimonial 
              image={IMG.farmer2}
              name="Adama Traoré"
              role="Broiler Co-op · Tamale, Nigeria"
              quote="The offline mode is what made it real for us. We log mortality from the house, and it just syncs when the network comes back. It's the quietest part of my day."
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:py-40">
        <div className="relative overflow-hidden rounded-[50px] bg-secondary/50 border border-foreground/5 p-12 lg:p-24 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-primary/10 blur-[120px] pointer-events-none" />
          <Eyebrow>Start your journey</Eyebrow>
          <h2 className="mt-10 text-5xl sm:text-8xl font-black tracking-tighter leading-[0.9] mb-12">
            Build a <span className="italic font-serif font-normal">smarter</span> farm <br />today.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-10 py-5 text-sm font-bold text-background hover:bg-foreground/90 transition shadow-2xl shadow-foreground/20">
              Create free account <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-10 py-5 text-sm font-bold hover:bg-foreground/5 transition">
              Sign in to dashboard
            </Link>
          </div>
          <p className="mt-12 text-sm text-muted-foreground font-medium">
            No credit card required. Free for your first flock. Unlimited offline logging.
          </p>
        </div>
      </section>

    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-primary mb-2">
        {icon}
        <span className="text-sm font-black tracking-tight">{title}</span>
      </div>
      <p className="text-background/50 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

function ModuleCard({ image, icon, title, subtitle, desc, tags }: { image: string; icon: React.ReactNode; title: string; subtitle: string; desc: string; tags: string[] }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="group">
      <div className="bg-background rounded-[40px] overflow-hidden border border-foreground/5 hover:shadow-2xl transition-all duration-700">
        <div className="grid md:grid-cols-2">
          <div className="aspect-square lg:aspect-auto overflow-hidden bg-secondary">
            <img src={image} alt={title} className="h-full w-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
          </div>
          <div className="p-8 lg:p-12 flex flex-col">
            <div className="flex items-center gap-3 text-primary mb-8">
              <div className="p-3 rounded-2xl bg-primary/10">{icon}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em]">{subtitle}</div>
            </div>
            <h3 className="text-3xl font-black tracking-tighter mb-4 leading-tight">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">{desc}</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {tags.map(t => <span key={t} className="text-[9px] font-bold uppercase tracking-wider bg-secondary/50 px-3 py-1.5 rounded-full">{t}</span>)}
            </div>
            <div className="mt-auto inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:text-primary transition-colors">
              Explore Module <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ImpactStat({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-6 group">
      <div className="text-4xl font-black tracking-tighter text-primary group-hover:scale-110 transition-transform duration-500">{number}</div>
      <div className="h-px flex-1 bg-foreground/10" />
      <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground w-32">{label}</div>
    </div>
  );
}

function Testimonial({ image, name, role, quote }: { image: string; name: string; role: string; quote: string }) {
  return (
    <div className="bg-background/5 border border-background/10 rounded-[40px] p-10 lg:p-16">
      <div className="flex items-center gap-6 mb-10">
        <img src={image} alt={name} className="h-16 w-16 rounded-full object-cover ring-4 ring-primary/20" />
        <div>
          <div className="text-xl font-black tracking-tight text-background">{name}</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mt-1">{role}</div>
        </div>
      </div>
      <blockquote className="text-2xl lg:text-3xl font-medium tracking-tight text-background/90 leading-snug italic">
        "{quote}"
      </blockquote>
    </div>
  );
}
