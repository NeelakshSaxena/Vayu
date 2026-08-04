import { create } from 'zustand';
import { Mood, OrbState } from '../types';

interface OrbStore {
  state: OrbState;
  mood: Mood;
  intensity: number;
  setState: (state: OrbState) => void;
  setMood: (mood: Mood) => void;
  setIntensity: (intensity: number) => void;
}

export const useOrbStore = create<OrbStore>((set) => ({
  state: OrbState.Idle,
  mood: Mood.Calm,
  intensity: 0.4, // Base multiplier
  setState: (state: OrbState) => set({ state }),
  setMood: (mood: Mood) => set({ mood }),
  setIntensity: (intensity: number) => set({ intensity }),
}));
