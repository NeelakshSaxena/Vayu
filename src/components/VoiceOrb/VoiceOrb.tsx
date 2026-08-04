import React, { useEffect, useRef } from 'react';
import { useOrbStore } from '../../stores/useOrbStore';
import { audioAnalyzer } from '../../utils/AudioAnalyzer';
import { OrbState, Mood } from '../../types';
import './VoiceOrb.css';

export const VoiceOrb: React.FC = () => {
  const orbRef = useRef<HTMLDivElement>(null);
  const currentState = useOrbStore((state) => state.state);
  const currentMood = useOrbStore((state) => state.mood);
  const intensity = useOrbStore((state) => state.intensity);

  useEffect(() => {
    let animationFrameId: number;

    const updateAudioReactivity = () => {
      if (!orbRef.current) return;

      const audioData = audioAnalyzer.getAudioData();
      
      // Base sizes multiplied by user's intensity slider
      let orbSize = 350;
      let innerSize = 170;
      let glowIntensity = 1 * intensity;
      let animationSpeed = 6 / intensity;

      if (currentState === OrbState.Listening || currentState === OrbState.Speaking) {
        // Massive scaling and glowing driven by volume and intensity
        orbSize = 350 + (audioData.volume * 150 * intensity); 
        innerSize = 170 + (audioData.mid * 80 * intensity);  
        glowIntensity = (1 + audioData.volume * 15) * intensity;
        
        // Ensure animation speed doesn't hit 0 or go negative
        animationSpeed = Math.max(0.5, (6 - audioData.volume * 5) / intensity);
      } else if (currentState === OrbState.Thinking) {
        // Thinking state pulses gently
        const time = Date.now() / 1000;
        orbSize = 350 + Math.sin(time * 2) * (15 * intensity);
        glowIntensity = 2.0 * intensity;
        animationSpeed = 4 / intensity;
      } else if (currentState === OrbState.Error) {
        // Error state rapid jagged pulsing
        const time = Date.now() / 1000;
        orbSize = 350 + Math.sin(time * 20) * (20 * intensity);
        glowIntensity = 3.0 * intensity;
      }

      // Smoothly apply via CSS Custom Properties
      orbRef.current.style.setProperty('--orb-size', `${orbSize}px`);
      orbRef.current.style.setProperty('--inner-size', `${innerSize}%`);
      orbRef.current.style.setProperty('--glow-intensity', `${glowIntensity}`);
      orbRef.current.style.setProperty('--animation-speed', `${animationSpeed}s`);

      animationFrameId = requestAnimationFrame(updateAudioReactivity);
    };

    updateAudioReactivity();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentState, intensity]); // Re-run effect if intensity or state changes

  // Map Moods to unique internal orb colors
  const getMoodColors = (mood: Mood) => {
    switch (mood) {
      case Mood.Calm: return { c1: '#1E5BFF', c2: '#6FD8FF' }; // Deep Blue & Cyan
      case Mood.Happy: return { c1: '#FF9900', c2: '#FFD700' }; // Orange & Gold
      case Mood.Excited: return { c1: '#FF2A00', c2: '#FF8800' }; // Crimson & Orange
      case Mood.Curious: return { c1: '#00FF88', c2: '#00FFFF' }; // Mint & Cyan
      case Mood.Serious: return { c1: '#880022', c2: '#440055' }; // Dark Red & Deep Purple
      case Mood.Sad: return { c1: '#224466', c2: '#112244' }; // Slate & Midnight
      case Mood.Confident: return { c1: '#8800FF', c2: '#FF00AA' }; // Purple & Hot Pink
      case Mood.Friendly: return { c1: '#FF55AA', c2: '#FFDD55' }; // Pink & Warm Yellow
      case Mood.Playful: return { c1: '#00FF44', c2: '#FF00AA' }; // Lime & Pink
      case Mood.Focused: return { c1: '#FFFFFF', c2: '#88CCFF' }; // White & Ice Blue
      default: return { c1: '#1E5BFF', c2: '#6FD8FF' };
    }
  };

  // Map States to unique vignette colors (Leaking environment lights), scaled by intensity
  const getStateVignette = (state: OrbState, currentIntensity: number) => {
    // Helper to clamp alpha between 0 and 1
    const getAlpha = (baseAlpha: number) => Math.min(1.0, baseAlpha * currentIntensity).toFixed(2);
    
    switch (state) {
      case OrbState.Listening: return `rgba(0, 255, 100, ${getAlpha(0.3)})`; // Gentle Green Glow
      case OrbState.Speaking: return `rgba(0, 200, 255, ${getAlpha(0.4)})`; // Gentle Cyan Glow
      case OrbState.Thinking: return `rgba(255, 200, 0, ${getAlpha(0.3)})`; // Gentle Yellow Glow
      case OrbState.Error: return `rgba(255, 0, 0, ${getAlpha(0.5)})`; // Harsh Red Glow
      case OrbState.Sleeping: return `rgba(100, 0, 255, ${getAlpha(0.2)})`; // Dim Purple Glow
      case OrbState.Idle: return 'transparent'; // No vignette
      default: return 'transparent';
    }
  };

  const colors = getMoodColors(currentMood);
  const vignette = getStateVignette(currentState, intensity);

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-black">
      <div className="orb-wrapper">
        {/* Pass the colors to CSS as style variables */}
        <div 
          className="orb-container" 
          ref={orbRef}
          style={{ 
            '--color-1': colors.c1, 
            '--color-2': colors.c2 
          } as React.CSSProperties}
        >
          <div className="orb">
            <div className="orb-inner" />
            <div className="orb-inner" />
          </div>
        </div>
      </div>
      
      {/* State Vignette - dynamically changes background ambient light based on State */}
      <div 
        className="absolute inset-0 pointer-events-none transition-colors duration-1000 ease-in-out" 
        style={{ 
          background: `radial-gradient(circle at center, transparent 20%, ${vignette} 100%)`,
          mixBlendMode: 'screen',
        }} 
      />
    </div>
  );
};
