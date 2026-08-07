import { useMotionValue, useSpring, MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { audioAnalyzer } from '../../../services/audio/AudioAnalyzer';
import { springs } from '../utils/springs';
import { OrbState } from '../../../types';

export interface AudioReactorOutputs {
  volume: MotionValue<number>;
  bass: MotionValue<number>;
  mid: MotionValue<number>;
  treble: MotionValue<number>;
  speechEnergy: MotionValue<number>;
}

export const useAudioReactor = (currentState: OrbState, intensity: number): AudioReactorOutputs => {
  const volume = useMotionValue(0);
  const bass = useMotionValue(0);
  const mid = useMotionValue(0);
  const treble = useMotionValue(0);
  const speechEnergy = useMotionValue(0);

  const smoothVolume = useSpring(volume, springs.responsive);
  const smoothBass = useSpring(bass, springs.heavy); // Bass is heavier, trails off slower
  const smoothMid = useSpring(mid, springs.responsive);
  const smoothTreble = useSpring(treble, springs.bouncy); // Treble is fast and bouncy
  const smoothEnergy = useSpring(speechEnergy, springs.stateTransition);

  useEffect(() => {
    let animationFrameId: number;

    const updateAudioReactivity = () => {
      const audioData = currentState === OrbState.Speaking 
        ? audioAnalyzer.getOutputAudioData()
        : audioAnalyzer.getAudioData();
      
      const v = audioData.volume * intensity;
      const m = audioData.mid * intensity;
      
      // Simulate bass and treble if missing from the raw analyzer for visual separation
      // In a real environment, the analyzer node would provide specific bins.
      const b = v * (1 + Math.sin(Date.now() / 300) * 0.2); 
      const t = v * (1 + Math.cos(Date.now() / 150) * 0.3);

      volume.set(v);
      bass.set(b);
      mid.set(m);
      treble.set(t);
      speechEnergy.set(v > 0.1 ? 1 : 0);

      animationFrameId = requestAnimationFrame(updateAudioReactivity);
    };

    updateAudioReactivity();

    return () => cancelAnimationFrame(animationFrameId);
  }, [currentState, intensity, volume, bass, mid, treble, speechEnergy]);

  return {
    volume: smoothVolume,
    bass: smoothBass,
    mid: smoothMid,
    treble: smoothTreble,
    speechEnergy: smoothEnergy
  };
};
