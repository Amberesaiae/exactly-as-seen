import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  label: string;
  duration?: number;
}

export function AnimatedCounter({ target, suffix = '', label, duration = 2 }: AnimatedCounterProps) {
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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <div className="text-7xl md:text-8xl font-black tracking-tighter text-foreground leading-none">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-3 h-px w-16 bg-primary/40" />
      <div className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
}
