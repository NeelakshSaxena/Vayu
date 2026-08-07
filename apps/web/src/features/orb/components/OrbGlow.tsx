import React from 'react';
import { motion, useTransform } from 'framer-motion';
import type { AmbientEngineOutputs } from '../engines/useAmbientEngine';

export interface OrbGlowProps {
  ambient: AmbientEngineOutputs;
  colors: { c1: string, c2: string };
  theme: 'dark' | 'light';
}

export const OrbGlow: React.FC<OrbGlowProps> = ({ ambient, colors, theme }) => {
  const glowColor = theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.4)';

  const filterString = useTransform(ambient.glowIntensity, (intensity) => {
    const i = intensity as number;
    return `drop-shadow(0 0 ${10 * i}px ${colors.c1}) drop-shadow(0 0 ${20 * i}px ${colors.c2}) drop-shadow(0 0 ${40 * i}px ${glowColor})`;
  });

  return (
    <motion.div 
      className="absolute inset-0 rounded-full"
      style={{
        filter: filterString,
      }}
    />
  );
};
