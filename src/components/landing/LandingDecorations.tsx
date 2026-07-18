import { motion } from 'framer-motion';

/**
 * Multi-pointed star burst — matches reference yellow burst shape.
 * Rendered with 16 triangular rays from center.
 */
export function YellowStarBurst({ className = '' }: { className?: string }) {
  const rays = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {rays.map((angle) => (
        <polygon
          key={angle}
          points="200,200 185,60 200,0 215,60"
          fill="currentColor"
          fillOpacity="0.65"
          transform={`rotate(${angle} 200 200)`}
        />
      ))}
      <circle cx="200" cy="200" r="50" fill="currentColor" fillOpacity="0.8" />
    </svg>
  );
}

/**
 * Organic leaf/branch shape for side accents
 */
export function LeafBranch({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M60 10C25 50 5 100 15 170C25 175 50 155 60 100C70 155 95 175 105 170C115 100 95 50 60 10Z"
        fill="currentColor"
        fillOpacity="0.45"
      />
      <path
        d="M60 10L60 170"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="2.5"
      />
      <path d="M60 55C42 62 25 85 20 115" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M60 55C78 62 95 85 100 115" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M60 85C47 88 32 102 28 130" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M60 85C73 88 88 102 92 130" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Organic wave divider — used as section transitions
 */
export function WaveDivider({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 60" fill="none" preserveAspectRatio="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 30C200 10 400 50 600 30C800 10 1000 50 1200 30V60H0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Auth panel — text-only logo, botanical decorations, used on Login/Register/Forgot/Reset
 */
export function AuthPanel() {
  return (
    <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/95 via-primary to-[hsl(142,71%,25%)] text-primary-foreground p-12">
      {/* Star burst accent */}
      <YellowStarBurst className="absolute -top-16 -right-16 w-72 h-72 text-[hsl(var(--accent-gold))] opacity-60" />

      {/* Leaf decorations */}
      <LeafBranch className="absolute top-12 -left-6 w-36 h-52 text-primary-foreground rotate-[-20deg] opacity-50" />
      <LeafBranch className="absolute bottom-20 right-4 w-28 h-40 text-primary-foreground rotate-[30deg] opacity-30" />

      {/* Wave accent */}
      <div className="absolute bottom-0 left-0 right-0">
        <WaveDivider className="w-full h-12 text-primary-foreground/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 text-center max-w-sm"
      >
        <h2 className="text-5xl font-black uppercase tracking-tight mb-6 leading-[0.9]">
          Grow<br />Smarter.<br />Farm Better.
        </h2>
        <p className="text-primary-foreground/80 text-base leading-relaxed">
          Smart poultry management trusted by farmers across West Africa.
        </p>
      </motion.div>
    </div>
  );
}
