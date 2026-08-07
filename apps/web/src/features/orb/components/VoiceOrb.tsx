import React, { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useOrbStore } from '../../../stores/useOrbStore';
import { OrbState } from '../../../types';
import { useSettingsStore } from '../../../stores/useSettingsStore';

import { useAudioReactor } from '../engines/useAudioReactor';
import { useInteractionEngine } from '../engines/useInteractionEngine';
import { useStateAnimator } from '../engines/useStateAnimator';
import { useAmbientEngine } from '../engines/useAmbientEngine';
import { useBreathing } from '../hooks/useBreathing';

import { OrbCore } from './OrbCore';

import './VoiceOrb.css';

export interface VoiceOrbProps {
  isMini?: boolean;
  orbStateOverride?: OrbState;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ isMini = false, orbStateOverride }) => {
  const storeState = useOrbStore((state) => state.state);
  const currentState = isMini && orbStateOverride !== undefined ? orbStateOverride : storeState;
  const currentMood = useOrbStore((state) => state.mood);
  const intensity = useOrbStore((state) => state.intensity);
  const theme = useSettingsStore((state) => state.theme);

  // 1. Audio Engine
  const audio = useAudioReactor(currentState, intensity);

  // 2. Interaction Engine
  const interaction = useInteractionEngine(isMini);

  // 3. State & Micro-expression Engine
  const stateAnim = useStateAnimator(currentState, currentMood, isMini, theme, audio);

  // 4. Ambient Engine
  const ambient = useAmbientEngine(currentState, theme, audio, intensity);
  
  // 5. Breathing Hook
  const breath = useBreathing(currentState === OrbState.Idle || currentState === OrbState.Thinking);

  // Composition: Combine base scale from state with breathing and audio volume
  const combinedScale = useTransform(
    [stateAnim.baseScale, breath, audio.volume],
    ([base, br, vol]) => {
      let s = (base as number) * (br as number);
      if (currentState === OrbState.Listening || currentState === OrbState.Speaking) {
        s += (vol as number) * 0.4 * intensity;
      }
      return s;
    }
  );

  const baseSize = isMini ? 40 : 350;

  if (isMini) {
    return (
      <motion.div 
        className="relative flex justify-center items-center rounded-full pointer-events-auto cursor-pointer"
        style={{ 
          width: baseSize, height: baseSize,
          scaleX: combinedScale, scaleY: combinedScale
        }}
      >
        <OrbCore colors={stateAnim.colors} audio={audio} state={currentState} ambient={ambient} theme={theme} />
      </motion.div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0 z-0 overflow-hidden" style={{ perspective: 1000 }}>
      {/* Orb Wrapper for Y translation (e.g. moving down when active) */}
      <motion.div 
        className="w-full h-full flex justify-center items-center"
        style={{ y: stateAnim.baseY, transformStyle: "preserve-3d" }}
      >
        {/* The Orb Shell combining scale, rotation, micro-expressions, and parallax */}
        <motion.div 
          className="relative flex justify-center items-center rounded-full cursor-pointer"
          animate={stateAnim.microControls}
          style={{ 
            width: baseSize, 
            height: baseSize,
            scaleX: combinedScale,
            scaleY: combinedScale,
            rotateX: interaction.rotateX,
            rotateY: interaction.rotateY,
            x: interaction.translateX,
            y: interaction.translateY,
          }}
        >
          <OrbCore colors={stateAnim.colors} audio={audio} state={currentState} ambient={ambient} theme={theme} />
        </motion.div>
      </motion.div>
      
      {/* State Vignette */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className={`absolute pointer-events-none rounded-full ${
            currentState === OrbState.Thinking ? 'animate-vignette-rotate' : ''
          } ${
            currentState === OrbState.Speaking ? 'animate-vignette-pulse' : ''
          }`}
          style={{ 
            width: '150vmax', height: '150vmax',
            top: '50%', left: '50%',
            marginTop: '-75vmax', marginLeft: '-75vmax',
            background: `radial-gradient(ellipse at 45% 55%, transparent 15%, rgba(${ambient.vignetteColor}, 1) 70%)`,
            mixBlendMode: theme === 'light' ? 'multiply' : 'screen',
            opacity: ambient.vignetteAlpha
          }} 
        />
      </div>
    </div>
  );
};

