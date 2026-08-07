import { create } from 'zustand';
import { Mood, OrbState } from '../types';

interface OrbStore {
  state: OrbState;
  mood: Mood;
  intensity: number;
  errorMessage: string | null;
  setState: (state: OrbState) => void;
  setMood: (mood: Mood) => void;
  setIntensity: (intensity: number) => void;
  setErrorMessage: (msg: string | null) => void;
}

export const useOrbStore = create<OrbStore>((set) => ({
  state: OrbState.Idle,
  mood: Mood.Calm,
  intensity: 0.4, // Base multiplier
  errorMessage: null as string | null,
  setState: (state: OrbState) => set({ state }),
  setMood: (mood: Mood) => set({ mood }),
  setIntensity: (intensity: number) => set({ intensity }),
  setErrorMessage: (errorMessage: string | null) => set({ errorMessage }),
}));
