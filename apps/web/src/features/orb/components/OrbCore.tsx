import React from 'react';
import { motion, useTransform } from 'framer-motion';
import type { AudioReactorOutputs } from '../engines/useAudioReactor';
import type { AmbientEngineOutputs } from '../engines/useAmbientEngine';
import { OrbState } from '../../../types';
import './VoiceOrb.css';

export interface OrbCoreProps {
  colors: { c1: string, c2: string };
  audio: AudioReactorOutputs;
  state: OrbState;
  ambient: AmbientEngineOutputs;
  theme: 'dark' | 'light';
}

export const OrbCore: React.FC<OrbCoreProps> = ({ colors, audio, state, ambient, theme }) => {
  const innerScale = useTransform(audio.mid, (mid) => 1 + (mid * 0.2));
  
  // Use speech energy to drive the CSS animation speed variable
  const animationSpeed = useTransform(audio.speechEnergy, (energy) => {
    return `${Math.max(2, 8 - (energy * 6))}s`;
  });
  
  const glowColor = theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.4)';

  // Drop-shadow only works when applied to a container holding non-transparent elements!
  const filterString = useTransform(ambient.glowIntensity, (intensity) => {
    const i = intensity as number;
    return `drop-shadow(0 0 ${10 * i}px ${colors.c1}) drop-shadow(0 0 ${20 * i}px ${colors.c2}) drop-shadow(0 0 ${40 * i}px ${glowColor})`;
  });

  return (
    <motion.div 
      className="orb-container"
      style={{
        width: '100%',
        height: '100%',
        filter: filterString,
        '--color-1': colors.c1,
        '--color-2': colors.c2,
        '--animation-speed': animationSpeed,
      } as any}
    >
      <div className="orb">
        <motion.div 
          className="orb-inner"
          style={{ scale: innerScale }}
        />
        <motion.div 
          className="orb-inner"
          style={{ scale: innerScale }}
        />
      </div>
    </motion.div>
  );
};
