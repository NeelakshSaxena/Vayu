import { create } from 'zustand';

interface VoiceStore {
  micActive: boolean;
  interimTranscript: string;
  setMicActive: (active: boolean) => void;
  setInterimTranscript: (transcript: string) => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  micActive: false,
  interimTranscript: "",
  setMicActive: (micActive: boolean) => set({ micActive }),
  setInterimTranscript: (interimTranscript: string) => set({ interimTranscript }),
}));
