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
  const theme = useOrbStore((state) => state.theme);

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
  const getMoodColors = (mood: Mood, currentTheme: 'dark' | 'light') => {
    const isLight = currentTheme === 'light';
    switch (mood) {
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

  const colors = getMoodColors(currentMood, theme);
  const vignette = getStateVignette(currentState, intensity);

  return (
    <div className="w-full h-full absolute inset-0 z-0 overflow-hidden">
      <div 
        className="orb-wrapper transition-transform duration-700 ease-in-out"
        style={{
          // Move the orb down by 35% of the screen height when active (listening/speaking)
          transform: currentState === OrbState.Idle ? 'translateY(0)' : 'translateY(35vh)',
        }}
      >
        {/* Pass the colors to CSS as style variables */}
        <div 
          className="orb-container" 
          ref={orbRef}
          style={{ 
            '--color-1': colors.c1, 
            '--color-2': colors.c2,
            '--orb-bg': theme === 'light' ? '#ffffff' : '#060606',
            '--glow-color': theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.4)',
          } as React.CSSProperties}
        >
          <div className="orb">
            <div className="orb-inner" />
            <div className="orb-inner" />
          </div>
        </div>
      </div>
      
      {/* State Vignette - dynamically changes background ambient light based on State */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className={`absolute pointer-events-none transition-all duration-1000 ease-in-out rounded-full ${
            currentState === OrbState.Thinking ? 'animate-vignette-rotate' : ''
          } ${
            currentState === OrbState.Speaking ? 'animate-vignette-pulse' : ''
          }`}
          style={{ 
            width: '150vmax',
            height: '150vmax',
            top: '50%',
            left: '50%',
            marginTop: '-75vmax',
            marginLeft: '-75vmax',
            background: `radial-gradient(ellipse at 45% 55%, transparent 15%, ${vignette} 70%)`,
            mixBlendMode: theme === 'light' ? 'multiply' : 'screen',
          }} 
        />
      </div>
    </div>
  );
};
