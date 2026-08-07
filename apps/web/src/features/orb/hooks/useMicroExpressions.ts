import { useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { OrbState } from '../../../types';
import { randomRange } from '../utils/noise';

export const useMicroExpressions = (state: OrbState): any => {
  const controls = useAnimation();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true;

    const runExpressions = async () => {
      if (!isActive) return;

      if (state === OrbState.Idle) {
        // Occasional glance (20 - 40s)
        await new Promise(r => { timeoutId = setTimeout(r, randomRange(20000, 40000)) });
        if (!isActive || state !== OrbState.Idle) return;
        
        await controls.start({ rotateY: randomRange(-15, 15), rotateX: randomRange(-5, 5), transition: { duration: 1, ease: "easeInOut" } });
        await new Promise(r => { timeoutId = setTimeout(r, randomRange(1000, 3000)) });
        if (!isActive || state !== OrbState.Idle) return;
        
        await controls.start({ rotateY: 0, rotateX: 0, transition: { duration: 1.5, ease: "easeInOut" } });
      } 
      else if (state === OrbState.Listening) {
        // Head tilt (5 - 12s)
        await new Promise(r => { timeoutId = setTimeout(r, randomRange(5000, 12000)) });
        if (!isActive || state !== OrbState.Listening) return;
        
        const tilt = randomRange(-8, 8);
        await controls.start({ rotateZ: tilt, transition: { duration: 0.8, ease: "easeInOut" } });
        await new Promise(r => { timeoutId = setTimeout(r, randomRange(2000, 4000)) });
        if (!isActive || state !== OrbState.Listening) return;
        
        await controls.start({ rotateZ: 0, transition: { duration: 1, ease: "easeInOut" } });
      }
      else if (state === OrbState.Thinking) {
        // Rotational hesitation
        await new Promise(r => { timeoutId = setTimeout(r, randomRange(2000, 5000)) });
        if (!isActive || state !== OrbState.Thinking) return;
        
        await controls.start({ scale: 0.98, transition: { duration: 0.5 } });
        await new Promise(r => { timeoutId = setTimeout(r, randomRange(500, 1500)) });
        if (!isActive || state !== OrbState.Thinking) return;
        
        await controls.start({ scale: 1, transition: { duration: 0.5 } });
      }
      else if (state === OrbState.Speaking) {
        // Gentle rhythmic nod (simulating sentence rhythm, 3-6s)
        await new Promise(r => { timeoutId = setTimeout(r, randomRange(3000, 6000)) });
        if (!isActive || state !== OrbState.Speaking) return;
        
        await controls.start({ rotateX: -5, y: 10, transition: { duration: 0.4, ease: "easeOut" } });
        await controls.start({ rotateX: 0, y: 0, transition: { duration: 0.8, ease: "easeInOut" } });
      }

      else {
        // Fallback delay for unhandled states (like Error) to prevent infinite synchronous loops
        await new Promise(r => { timeoutId = setTimeout(r, 1000) });
      }

      if (isActive) {
        runExpressions();
      }
    };

    runExpressions();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      // Reset micro expression state gently
      controls.start({ rotateX: 0, rotateY: 0, rotateZ: 0, y: 0, scale: 1, transition: { duration: 1 } });
    };
  }, [state, controls]);

  return controls;
};
