import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  label: string;
  duration?: number;
  barColor?: 'accent-gold' | 'primary' | 'accent-cyan';
  /** When true, renders white text for use inside colored blocks */
  inBlock?: boolean;
}

export function AnimatedCounter({
  target,
  suffix = '',
  label,
  duration = 2,
  barColor = 'primary',
  inBlock = false,
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

  if (inBlock) {
    // Inside a colored block — large white number only
    return (
      <div ref={ref}>
        <div className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white leading-none">
          {count.toLocaleString()}{suffix}
        </div>
      </div>
    );
  }

  const barColorMap: Record<string, string> = {
    'accent-gold': 'bg-accent-gold',
    'primary': 'bg-primary',
    'accent-cyan': 'bg-accent-cyan',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      <div className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-foreground leading-none">
        {count.toLocaleString()}{suffix}
      </div>
      <div className={`mt-4 h-2 w-20 ${barColorMap[barColor] || 'bg-primary'}`} />
      <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
}
