import { useState, useEffect, useRef } from 'react';
import { useOrbStore } from '../stores/useOrbStore';
import { OrbState } from '../types';

export function useScreensaver(delayMs: number = 30000) {
  const [isScreensaver, setIsScreensaver] = useState(false);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    const reset = () => {
      setIsScreensaver(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (useOrbStore.getState().state === OrbState.Idle) {
          setIsScreensaver(true);
        }
      }, delayMs);
    };

    const handleEvent = () => reset();

    // Bind events
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, handleEvent));
    reset();

    // Subscribe to state changes directly from store instead of depending on React renders
    const unsubscribe = useOrbStore.subscribe((state) => {
      if (state.state !== OrbState.Idle) {
        setIsScreensaver(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else {
        reset();
      }
    });

    return () => {
      events.forEach(e => window.removeEventListener(e, handleEvent));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      unsubscribe();
    };
  }, [delayMs]);

  return isScreensaver;
}
