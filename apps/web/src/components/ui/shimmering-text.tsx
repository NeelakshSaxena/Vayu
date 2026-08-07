import React, { useMemo, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { cn } from '../../lib/utils';
import { useSettingsStore } from '../../stores/useSettingsStore';

export interface ShimmeringTextProps {
  text: string;
  duration?: number;
  delay?: number;
  repeat?: boolean;
  repeatDelay?: number;
  className?: string;
  startOnView?: boolean;
  once?: boolean;
  inViewMargin?: string;
  spread?: number;
  color?: string;
  shimmerColor?: string;
}

export function ShimmeringText({
  text,
  duration = 2,
  delay = 0,
  repeat = true,
  repeatDelay = 0.5,
  className,
  startOnView = true,
  once = false,
  inViewMargin,
  spread = 2,
  color,
  shimmerColor,
}: ShimmeringTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { 
    once, 
    margin: (inViewMargin as any) || "0px",
    amount: "some" 
  });
  
  const theme = useSettingsStore((state) => state.theme);
  const defaultColor = theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const defaultShimmer = theme === 'dark' ? '#ffffff' : '#000000';

  const shouldAnimate = startOnView ? isInView : true;

  const style = useMemo(() => ({
    '--color': color || defaultColor,
    '--shimmer': shimmerColor || defaultShimmer,
    '--spread': `${spread * 100}%`,
    backgroundImage: `linear-gradient(90deg, var(--color) 0%, var(--shimmer) 50%, var(--color) 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
    display: 'inline-block'
  } as React.CSSProperties), [color, defaultColor, shimmerColor, defaultShimmer, spread]);

  return (
    <motion.span
      ref={ref}
      className={cn(className)}
      style={style}
      initial={{ backgroundPosition: '200% center' }}
      animate={shouldAnimate ? { backgroundPosition: '-200% center' } : {}}
      transition={{
        duration,
        delay,
        repeat: repeat ? Infinity : 0,
        repeatDelay,
        ease: "linear"
      }}
    >
      {text}
    </motion.span>
  );
}
