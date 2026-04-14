import { motion } from 'framer-motion';

export function SunflowerMotif({ className = '' }: { className?: string }) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="100"
          cy="100"
          rx="28"
          ry="60"
          fill="currentColor"
          fillOpacity="0.55"
          transform={`rotate(${angle} 100 100)`}
        />
      ))}
      <circle cx="100" cy="100" r="24" fill="currentColor" fillOpacity="0.8" />
      <circle cx="100" cy="100" r="16" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

export function LeafDecoration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M60 10C30 40 10 80 15 130C20 130 50 120 60 80C70 120 100 130 105 130C110 80 90 40 60 10Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
      <path
        d="M60 10C60 10 60 60 60 130"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="2"
      />
      <path d="M60 50C45 55 30 70 25 90" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M60 50C75 55 90 70 95 90" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M60 70C50 72 38 82 33 100" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
      <path d="M60 70C70 72 82 82 87 100" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
    </svg>
  );
}

export function FeatherDecoration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M40 5C20 30 5 80 10 150C15 155 30 140 40 100C40 140 38 155 35 170L40 195L45 170C42 155 40 140 40 100C50 140 65 155 70 150C75 80 60 30 40 5Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path d="M40 5L40 195" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
    </svg>
  );
}

export function WaveDivider({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 60" fill="none" preserveAspectRatio="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 30C200 10 400 50 600 30C800 10 1000 50 1200 30V60H0Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M0 30C200 10 400 50 600 30C800 10 1000 50 1200 30"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function DotsGrid({ className = '' }: { className?: string }) {
  const dots = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      dots.push(
        <circle key={`${r}-${c}`} cx={15 + c * 22} cy={15 + r * 22} r="2.5" fill="currentColor" fillOpacity={0.1 + (r + c) * 0.012} />
      );
    }
  }
  return (
    <svg viewBox="0 0 140 140" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {dots}
    </svg>
  );
}

export function AuthPanel() {
  return (
    <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground p-12">
      {/* Sunflower accent */}
      <SunflowerMotif className="absolute -top-16 -right-16 w-64 h-64 text-[hsl(var(--accent-gold))] rotate-12 opacity-70" />

      {/* Leaf decorations */}
      <LeafDecoration className="absolute top-12 -left-6 w-32 h-44 text-primary-foreground rotate-[-20deg] opacity-60" />
      <LeafDecoration className="absolute bottom-20 right-4 w-24 h-32 text-primary-foreground rotate-[30deg] opacity-40" />

      {/* Feather */}
      <FeatherDecoration className="absolute bottom-10 -left-2 w-20 h-48 text-primary-foreground -rotate-12 opacity-50" />

      {/* Dots */}
      <DotsGrid className="absolute bottom-24 right-12 w-28 h-28 text-primary-foreground opacity-40" />

      {/* Wave accent */}
      <div className="absolute bottom-0 left-0 right-0">
        <WaveDivider className="w-full h-12 text-primary-foreground" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 text-center max-w-sm"
      >
        <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
          Grow Smarter.<br />Farm Better.
        </h2>
        <p className="text-primary-foreground/85 text-lg leading-relaxed">
          Smart poultry management trusted by farmers across West Africa. Track batches, optimize feed, and grow with confidence.
        </p>
      </motion.div>
    </div>
  );
}
