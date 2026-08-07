import { Mood } from '../types';
import type { AnimationParams } from '../types';

export const moodPresets: Record<Mood, AnimationParams> = {
  [Mood.Calm]: {
    speed: 0.2,
    breathing: 0.5,
    noiseStrength: 0.3,
    glow: 0.6,
    bloom: 1.5,
    scale: 1.0,
    rippleStrength: 0.1,
    rotationSpeed: 0.1,
    particleIntensity: 0.2,
    colorA: [0.1, 0.3, 0.8], // Blue
    colorB: [0.2, 0.5, 1.0], // Light Blue
    emission: 0.5,
    edgeGlow: 0.8,
  },
  [Mood.Happy]: {
    speed: 0.6,
    breathing: 1.0,
    noiseStrength: 0.6,
    glow: 0.8,
    bloom: 2.0,
    scale: 1.1,
    rippleStrength: 0.4,
    rotationSpeed: 0.3,
    particleIntensity: 0.8,
    colorA: [0.0, 0.8, 0.8], // Cyan
    colorB: [0.2, 1.0, 0.8], // Turquoise
    emission: 0.8,
    edgeGlow: 1.0,
  },
  [Mood.Excited]: {
    speed: 1.2,
    breathing: 1.5,
    noiseStrength: 1.0,
    glow: 1.2,
    bloom: 3.0,
    scale: 1.2,
    rippleStrength: 0.8,
    rotationSpeed: 0.6,
    particleIntensity: 1.5,
    colorA: [1.0, 0.4, 0.0], // Orange
    colorB: [1.0, 0.6, 0.2], // Yellow-Orange
    emission: 1.2,
    edgeGlow: 1.5,
  },
  [Mood.Curious]: {
    speed: 0.4,
    breathing: 0.8,
    noiseStrength: 0.7,
    glow: 0.7,
    bloom: 1.8,
    scale: 1.05,
    rippleStrength: 0.5,
    rotationSpeed: 0.4,
    particleIntensity: 0.5,
    colorA: [0.5, 0.1, 0.8], // Purple
    colorB: [0.7, 0.3, 1.0], // Light Purple
    emission: 0.7,
    edgeGlow: 1.0,
  },
  [Mood.Serious]: {
    speed: 0.1,
    breathing: 0.2,
    noiseStrength: 0.1,
    glow: 0.4,
    bloom: 1.0,
    scale: 0.95,
    rippleStrength: 0.05,
    rotationSpeed: 0.05,
    particleIntensity: 0.1,
    colorA: [0.8, 0.8, 0.85], // White-Silver
    colorB: [1.0, 1.0, 1.0], // White
    emission: 0.4,
    edgeGlow: 0.5,
  },
  [Mood.Sad]: {
    speed: 0.1,
    breathing: 0.3,
    noiseStrength: 0.2,
    glow: 0.3,
    bloom: 0.8,
    scale: 0.9,
    rippleStrength: 0.05,
    rotationSpeed: 0.02,
    particleIntensity: 0.05,
    colorA: [0.05, 0.1, 0.4], // Dark Blue
    colorB: [0.1, 0.2, 0.6], // Deep Blue
    emission: 0.2,
    edgeGlow: 0.4,
  },
  [Mood.Confident]: {
    speed: 0.3,
    breathing: 0.6,
    noiseStrength: 0.4,
    glow: 0.7,
    bloom: 1.5,
    scale: 1.1,
    rippleStrength: 0.2,
    rotationSpeed: 0.2,
    particleIntensity: 0.4,
    colorA: [0.0, 0.6, 1.0], // Strong Blue
    colorB: [0.2, 0.8, 1.0], // Bright Blue
    emission: 0.7,
    edgeGlow: 0.9,
  },
  [Mood.Friendly]: {
    speed: 0.5,
    breathing: 0.8,
    noiseStrength: 0.5,
    glow: 0.7,
    bloom: 1.8,
    scale: 1.05,
    rippleStrength: 0.3,
    rotationSpeed: 0.25,
    particleIntensity: 0.6,
    colorA: [0.2, 0.8, 0.4], // Green
    colorB: [0.4, 1.0, 0.6], // Light Green
    emission: 0.6,
    edgeGlow: 0.8,
  },
  [Mood.Playful]: {
    speed: 0.8,
    breathing: 1.2,
    noiseStrength: 0.8,
    glow: 0.9,
    bloom: 2.2,
    scale: 1.15,
    rippleStrength: 0.6,
    rotationSpeed: 0.5,
    particleIntensity: 1.0,
    colorA: [1.0, 0.2, 0.6], // Pink
    colorB: [1.0, 0.5, 0.8], // Light Pink
    emission: 0.9,
    edgeGlow: 1.2,
  },
  [Mood.Focused]: {
    speed: 0.15,
    breathing: 0.3,
    noiseStrength: 0.15,
    glow: 0.5,
    bloom: 1.2,
    scale: 0.98,
    rippleStrength: 0.1,
    rotationSpeed: 0.1,
    particleIntensity: 0.2,
    colorA: [0.6, 0.8, 1.0], // White-Blue
    colorB: [0.8, 0.9, 1.0], // Ice White
    emission: 0.5,
    edgeGlow: 0.6,
  }
};
