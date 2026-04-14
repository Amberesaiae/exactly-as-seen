import { motion } from 'framer-motion';

export function LeafDecoration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M60 10C30 40 10 80 15 130C20 130 50 120 60 80C70 120 100 130 105 130C110 80 90 40 60 10Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M60 10C60 10 60 60 60 130"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />
      <path d="M60 50C45 55 30 70 25 90" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
      <path d="M60 50C75 55 90 70 95 90" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
    </svg>
  );
}

export function FeatherDecoration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M40 5C20 30 5 80 10 150C15 155 30 140 40 100C40 140 38 155 35 170L40 195L45 170C42 155 40 140 40 100C50 140 65 155 70 150C75 80 60 30 40 5Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="M40 5L40 195" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.2" />
    </svg>
  );
}

export function CirclePattern({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
      <circle cx="100" cy="100" r="65" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
      <circle cx="100" cy="100" r="40" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
      <circle cx="100" cy="100" r="15" fill="currentColor" fillOpacity="0.06" />
    </svg>
  );
}

export function DotsGrid({ className = '' }: { className?: string }) {
  const dots = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      dots.push(
        <circle key={`${r}-${c}`} cx={15 + c * 22} cy={15 + r * 22} r="2" fill="currentColor" fillOpacity={0.06 + (r + c) * 0.008} />
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
    <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-primary-foreground p-12">
      {/* Decorative elements */}
      <LeafDecoration className="absolute -top-10 -right-6 w-40 h-52 text-primary-foreground rotate-12 opacity-60" />
      <FeatherDecoration className="absolute bottom-10 -left-4 w-24 h-56 text-primary-foreground -rotate-12 opacity-50" />
      <CirclePattern className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 text-primary-foreground opacity-40" />
      <DotsGrid className="absolute bottom-20 right-8 w-32 h-32 text-primary-foreground opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 text-center max-w-sm"
      >
        <h2 className="text-3xl font-extrabold tracking-tight mb-4">Grow Smarter.<br />Farm Better.</h2>
        <p className="text-primary-foreground/80 text-base leading-relaxed">
          Smart poultry management trusted by farmers across West Africa. Track batches, optimize feed, and grow with confidence.
        </p>
      </motion.div>
    </div>
  );
}
