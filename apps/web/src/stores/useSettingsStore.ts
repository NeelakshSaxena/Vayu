import { create } from 'zustand';

export type LLMProviderType = 'openrouter' | 'runpod' | 'mock';

interface SettingsStore {
  theme: 'dark' | 'light';
  appMode: 'hands-free' | 'hands-on';
  showDevControls: boolean;
  provider: LLMProviderType;
  setTheme: (theme: 'dark' | 'light') => void;
  setAppMode: (mode: 'hands-free' | 'hands-on') => void;
  setShowDevControls: (show: boolean) => void;
  setProvider: (provider: LLMProviderType) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'dark',
  appMode: 'hands-free',
  showDevControls: false,
  provider: 'runpod',
  setTheme: (theme) => set({ theme }),
  setAppMode: (appMode) => set({ appMode }),
  setShowDevControls: (showDevControls) => set({ showDevControls }),
  setProvider: (provider) => set({ provider }),
}));
