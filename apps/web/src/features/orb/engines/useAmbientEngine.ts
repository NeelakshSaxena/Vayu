import { useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { OrbState } from '../../../types';
import { springs } from '../utils/springs';
import type { AudioReactorOutputs } from './useAudioReactor';

export interface AmbientEngineOutputs {
  glowIntensity: MotionValue<number>;
  vignetteAlpha: MotionValue<number>;
  vignetteColor: string;
}

export const useAmbientEngine = (
  state: OrbState,
  theme: 'dark' | 'light',
  audio: AudioReactorOutputs,
  intensityMultiplier: number
): AmbientEngineOutputs => {
  const glow = useMotionValue(1);
  const vignette = useMotionValue(0);
  
  const smoothGlow = useSpring(glow, springs.responsive);
  const smoothVignette = useSpring(vignette, springs.stateTransition);

  useEffect(() => {
    let baseGlow = 1 * intensityMultiplier;
    let vAlpha = 0;

    switch (state) {
      case OrbState.Listening: 
        baseGlow = 1.2 * intensityMultiplier;
        vAlpha = 0.3 * Math.min(1, intensityMultiplier);
        break;
      case OrbState.Speaking: 
        baseGlow = 1.4 * intensityMultiplier;
        vAlpha = 0.4 * Math.min(1, intensityMultiplier);
        break;
      case OrbState.Thinking: 
        baseGlow = 1.5 * intensityMultiplier;
        vAlpha = 0.3 * Math.min(1, intensityMultiplier);
        break;
      case OrbState.Error: 
        baseGlow = 3.0 * intensityMultiplier;
        vAlpha = 0.5 * Math.min(1, intensityMultiplier);
        break;
      case OrbState.Sleeping:
        baseGlow = 0.5 * intensityMultiplier;
        vAlpha = 0.2 * Math.min(1, intensityMultiplier);
        break;
      case OrbState.Idle:
      default:
        baseGlow = 1.0 * intensityMultiplier;
        vAlpha = 0;
        break;
    }

    glow.set(baseGlow);
    vignette.set(vAlpha);

  }, [state, intensityMultiplier, glow, vignette]);

  // Dynamic glow scaling with audio bass
  const dynamicGlow = useTransform([smoothGlow, audio.bass], ([g, b]) => {
    return (g as number) + (b as number) * 2;
  });

  const getVignetteColor = () => {
    switch (state) {
      case OrbState.Listening: return `0, 255, 100`; 
      case OrbState.Speaking: return `0, 200, 255`; 
      case OrbState.Thinking: return `255, 200, 0`; 
      case OrbState.Error: return `255, 0, 0`; 
      case OrbState.Sleeping: return `100, 0, 255`; 
      default: return `0, 0, 0`;
    }
  };

  return {
    glowIntensity: dynamicGlow as MotionValue<number>,
    vignetteAlpha: smoothVignette,
    vignetteColor: getVignetteColor()
  };
};
