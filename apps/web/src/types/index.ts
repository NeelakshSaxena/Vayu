export const OrbState = {
  Idle: "idle",
  Listening: "listening",
  Thinking: "thinking",
  Speaking: "speaking",
  Sleeping: "sleeping",
  Error: "error"
} as const;

export type OrbState = typeof OrbState[keyof typeof OrbState];

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const Mood = {
  Calm: 'Calm',
  Happy: 'Happy',
  Excited: 'Excited',
  Curious: 'Curious',
  Serious: 'Serious',
  Sad: 'Sad',
  Confident: 'Confident',
  Friendly: 'Friendly',
  Playful: 'Playful',
  Focused: 'Focused',
} as const;

export type Mood = typeof Mood[keyof typeof Mood];

export interface AnimationParams {
  speed: number;
  breathing: number;
  noiseStrength: number;
  glow: number;
  bloom: number;
  scale: number;
  rippleStrength: number;
  rotationSpeed: number;
  particleIntensity: number;
  colorA: [number, number, number];
  colorB: [number, number, number];
  emission: number;
  edgeGlow: number;
}
