import { useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import { randomRange } from '../utils/noise';

export const useBreathing = (isActive: boolean) => {
  const breathValue = useMotionValue(1);
  const breathSpring = useSpring(breathValue, { damping: 60, stiffness: 40, mass: 4 });
  
  useEffect(() => {
    if (!isActive) {
      breathValue.set(1);
      return;
    }
    
    let timeoutId: NodeJS.Timeout;
    
    const cycleBreath = async () => {
      // Inhale
      const inhaleTarget = randomRange(1.01, 1.03);
      breathValue.set(inhaleTarget);
      
      // Hold inhale
      const inhaleHold = randomRange(3600, 4400);
      await new Promise(resolve => { timeoutId = setTimeout(resolve, inhaleHold) });
      
      // Exhale
      const exhaleTarget = randomRange(0.98, 0.995);
      breathValue.set(exhaleTarget);
      
      // Hold exhale
      const exhaleHold = randomRange(3800, 4400);
      await new Promise(resolve => { timeoutId = setTimeout(resolve, exhaleHold) });
      
      // Repeat
      if (isActive) {
        cycleBreath();
      }
    };
    
    cycleBreath();
    
    return () => clearTimeout(timeoutId);
  }, [isActive, breathValue]);

  return breathSpring;
};
