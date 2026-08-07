import { create } from 'zustand';

interface SettingsStore {
  theme: 'dark' | 'light';
  appMode: 'hands-free' | 'hands-on';
  showDevControls: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  setAppMode: (mode: 'hands-free' | 'hands-on') => void;
  setShowDevControls: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'dark' as 'dark' | 'light',
  appMode: 'hands-free' as 'hands-free' | 'hands-on',
  showDevControls: false,
  setTheme: (theme: 'dark' | 'light') => set({ theme }),
  setAppMode: (appMode: 'hands-free' | 'hands-on') => set({ appMode }),
  setShowDevControls: (showDevControls: boolean) => set({ showDevControls }),
}));
