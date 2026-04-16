import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

type BarColor = 'accent-gold' | 'primary' | 'accent-cyan' | 'accent-purple';
type BlockColor = 'blue' | 'green' | 'yellow' | 'purple';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
  barColor?: BarColor;
  /** Render number inside a colored block (matching UPA DI reference) */
  blockColor?: BlockColor;
}

const blockColorMap: Record<BlockColor, string> = {
  blue: 'bg-[#4A90D9]',
  green: 'bg-[#22C55E]',
  yellow: 'bg-[#F59E0B]',
  purple: 'bg-[#8B7EC8]',
};

const barColorMap: Record<string, string> = {
  'accent-gold': 'bg-[#F59E0B]',
  'primary': 'bg-primary',
  'accent-cyan': 'bg-[#06B6D4]',
  'accent-purple': 'bg-[#8B7EC8]',
};

export function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  label,
  duration = 2,
  barColor = 'primary',
  blockColor,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  /* ── Block mode: number inside colored rectangle ── */
  if (blockColor) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`${blockColorMap[blockColor]} rounded-2xl px-6 py-8 md:px-8 md:py-10 min-h-[140px] flex flex-col justify-end`}>
          <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white leading-none">
            {prefix}{count.toLocaleString()}{suffix}
          </div>
        </div>
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-pre-line leading-relaxed">
          {label}
        </div>
      </motion.div>
    );
  }

  /* ── Bar mode: plain number with colored bar underneath ── */
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      <div className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-foreground leading-none">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className={`mt-4 h-2 w-20 ${barColorMap[barColor] || 'bg-primary'}`} />
      <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground whitespace-pre-line">
        {label}
      </div>
    </motion.div>
  );
}
