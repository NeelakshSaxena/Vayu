import { useVoiceStore } from '../../../stores/useVoiceStore';
import { useOrbStore } from '../../../stores/useOrbStore';
import { microphoneService } from '../../../services/audio/microphone';
import { OrbState } from '../../../types';

export const useVoice = (onSpeechFinalized: (text: string) => void) => {
  const micActive = useVoiceStore((state) => state.micActive);
  const interimTranscript = useVoiceStore((state) => state.interimTranscript);
  const setMicActive = useVoiceStore((state) => state.setMicActive);
  const setInterimTranscript = useVoiceStore((state) => state.setInterimTranscript);
  const setState = useOrbStore((state) => state.setState);
  const setErrorMessage = useOrbStore((state) => state.setErrorMessage);

  const startMic = async () => {
    const state = useOrbStore.getState().state;
    if (state !== OrbState.Idle && state !== OrbState.Error) return;
    
    setState(OrbState.Listening);
    setInterimTranscript("");
    
    await microphoneService.start({
      onInterimResult: (text) => setInterimTranscript(text),
      onFinalResult: (text) => {
        setInterimTranscript("");
        setState(OrbState.Thinking);
        onSpeechFinalized(text);
      },
      onError: (error) => {
        console.error("Mic Error:", error);
        setErrorMessage(error.message || "Failed to transcribe audio");
        setState(OrbState.Error);
        setTimeout(() => { setState(OrbState.Idle); setErrorMessage(null); }, 3000);
      },
      onSilence: () => {
        stopMic();
      }
    });

    setMicActive(true);
  };

  const stopMic = async () => {
    if (!useVoiceStore.getState().micActive) return;
    setMicActive(false);
    await microphoneService.stop();
  };

  return { micActive, interimTranscript, startMic, stopMic };
};
