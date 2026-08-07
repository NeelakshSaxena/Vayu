import { useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { springs } from '../utils/springs';

export interface InteractionEngineOutputs {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  translateX: MotionValue<number>;
  translateY: MotionValue<number>;
}

export const useInteractionEngine = (isMini: boolean): InteractionEngineOutputs => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Use observant spring for mouse tracking to simulate "looking"
  const smoothMouseX = useSpring(mouseX, springs.observant);
  const smoothMouseY = useSpring(mouseY, springs.observant);

  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-15, 15]);
  
  // Subtle parallax translation
  const translateX = useTransform(smoothMouseX, [-0.5, 0.5], [-20, 20]);
  const translateY = useTransform(smoothMouseY, [-0.5, 0.5], [-20, 20]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    
    if (!isMini) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (!isMini) window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMini, mouseX, mouseY]);

  return { rotateX, rotateY, translateX, translateY };
};
