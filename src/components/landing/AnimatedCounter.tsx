import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  label: string;
  duration?: number;
  barColor?: 'accent-gold' | 'primary' | 'accent-cyan';
}

const barColorMap: Record<string, string> = {
  'accent-gold': 'bg-accent-gold',
  'primary': 'bg-primary',
  'accent-cyan': 'bg-accent-cyan',
};

export function AnimatedCounter({ target, suffix = '', label, duration = 2, barColor = 'primary' }: AnimatedCounterProps) {
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
      {/* Thick colored bar — matching reference */}
      <div className={`mt-4 h-2 w-20 ${barColorMap[barColor] || 'bg-primary'}`} />
      <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
}
