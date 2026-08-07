import { create } from 'zustand';
import { Mood, OrbState } from '../types';

interface OrbStore {
  state: OrbState;
  mood: Mood;
  intensity: number;
  theme: 'dark' | 'light';
  appMode: 'hands-free' | 'hands-on';
  errorMessage: string | null;
  setState: (state: OrbState) => void;
  setMood: (mood: Mood) => void;
  setIntensity: (intensity: number) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setAppMode: (mode: 'hands-free' | 'hands-on') => void;
  setErrorMessage: (msg: string | null) => void;
}

export const useOrbStore = create<OrbStore>((set) => ({
  state: OrbState.Idle,
  mood: Mood.Calm,
  intensity: 0.4, // Base multiplier
  theme: 'dark' as 'dark' | 'light',
  appMode: 'hands-free' as 'hands-free' | 'hands-on',
  errorMessage: null as string | null,
  setState: (state: OrbState) => set({ state }),
  setMood: (mood: Mood) => set({ mood }),
  setIntensity: (intensity: number) => set({ intensity }),
  setTheme: (theme: 'dark' | 'light') => set({ theme }),
  setAppMode: (appMode: 'hands-free' | 'hands-on') => set({ appMode }),
  setErrorMessage: (errorMessage: string | null) => set({ errorMessage }),
}));
