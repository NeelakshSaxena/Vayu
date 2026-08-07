import { useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { OrbState, Mood } from '../../../types';
import { springs } from '../utils/springs';
import { useMicroExpressions } from '../hooks/useMicroExpressions';
import type { AudioReactorOutputs } from './useAudioReactor';

export interface StateAnimatorOutputs {
  baseScale: MotionValue<number>;
  baseY: MotionValue<string>;
  microControls: any;
  colors: { c1: string, c2: string };
}

export const useStateAnimator = (
  state: OrbState, 
  mood: Mood, 
  isMini: boolean,
  theme: 'dark' | 'light',
  audio: AudioReactorOutputs
): StateAnimatorOutputs => {
  const scale = useMotionValue(1);
  const y = useMotionValue(0); 
  
  const smoothScale = useSpring(scale, springs.stateTransition);
  const smoothY = useSpring(y, springs.stateTransition);
  const baseY = useTransform(smoothY, (val) => `${val}vh`);

  const microControls = useMicroExpressions(state);

  useEffect(() => {
    let targetScale = 1;
    let targetY = 0;

    if (!isMini) {
      switch (state) {
        case OrbState.Idle: targetY = 0; targetScale = 1; break;
        case OrbState.Listening: targetY = 35; targetScale = 1.1; break;
        case OrbState.Thinking: targetY = 35; targetScale = 0.95; break;
        case OrbState.Speaking: targetY = 35; targetScale = 1.1; break;
        case OrbState.Sleeping: targetY = 20; targetScale = 0.9; break;
        case OrbState.Error: targetY = 35; targetScale = 1.05; break;
      }
    }

    scale.set(targetScale);
    y.set(targetY);
  }, [state, isMini, scale, y]);

  const getMoodColors = (m: Mood, t: 'dark' | 'light') => {
    const isLight = t === 'light';
    switch (m) {
      case Mood.Calm: return isLight ? { c1: '#0a3299', c2: '#1699cc' } : { c1: '#1E5BFF', c2: '#6FD8FF' }; 
      case Mood.Happy: return isLight ? { c1: '#cc7a00', c2: '#cca800' } : { c1: '#FF9900', c2: '#FFD700' };
      case Mood.Excited: return isLight ? { c1: '#cc2200', c2: '#cc6d00' } : { c1: '#FF2A00', c2: '#FF8800' };
      case Mood.Curious: return isLight ? { c1: '#00cc6d', c2: '#00cccc' } : { c1: '#00FF88', c2: '#00FFFF' };
      case Mood.Serious: return isLight ? { c1: '#66001a', c2: '#330040' } : { c1: '#880022', c2: '#440055' };
      case Mood.Sad: return isLight ? { c1: '#172e45', c2: '#0b172e' } : { c1: '#224466', c2: '#112244' };
      case Mood.Confident: return isLight ? { c1: '#6600cc', c2: '#cc0088' } : { c1: '#8800FF', c2: '#FF00AA' };
      case Mood.Friendly: return isLight ? { c1: '#cc4488', c2: '#ccb144' } : { c1: '#FF55AA', c2: '#FFDD55' };
      case Mood.Playful: return isLight ? { c1: '#00cc36', c2: '#cc0088' } : { c1: '#00FF44', c2: '#FF00AA' };
      case Mood.Focused: return isLight ? { c1: '#999999', c2: '#5ca3cc' } : { c1: '#FFFFFF', c2: '#88CCFF' };
      default: return isLight ? { c1: '#0a3299', c2: '#1699cc' } : { c1: '#1E5BFF', c2: '#6FD8FF' };
    }
  };

  return {
    baseScale: smoothScale,
    baseY,
    microControls,
    colors: getMoodColors(mood, theme)
  };
};
