import { audioAnalyzer } from './AudioAnalyzer';

export interface MicHandlers {
  onInterimResult: (text: string) => void;
  onFinalResult: (text: string) => void;
  onError: (error: Error) => void;
  onSilence: () => void;
}

class MicrophoneService {
  private recognition: any = null;
  private silenceTimer: any = null;
  private micActive: boolean = false;
  private handlers: MicHandlers | null = null;

  async start(handlers: MicHandlers) {
    if (this.micActive) return;
    this.handlers = handlers;

    await audioAnalyzer.initialize();
    audioAnalyzer.startRecording();
    this.micActive = true;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = 0; i < event.results.length; ++i) {
          interim += event.results[i][0].transcript;
        }
        if (this.handlers) this.handlers.onInterimResult(interim);

        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.silenceTimer = setTimeout(() => {
          if (this.handlers) this.handlers.onSilence();
        }, 2000);
      };

      this.recognition.onerror = () => {
        if (this.handlers) this.handlers.onError(new Error("Speech recognition error"));
      };

      this.recognition.start();

      if (this.silenceTimer) clearTimeout(this.silenceTimer);
      this.silenceTimer = setTimeout(() => {
        if (this.handlers) this.handlers.onSilence();
      }, 5000);
    }
  }

  async stop() {
    if (!this.micActive) return;

    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) { }
      this.recognition = null;
    }

    this.micActive = false;
    const audioBlob = await audioAnalyzer.stopRecording();
    
    if (!audioBlob) return;

    try {
      const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey
        },
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.message || `Sarvam STT failed with status ${response.status}`);
      }

      const result = await response.json();
      const finalText = result.transcript;

      if (finalText && finalText.trim() !== '') {
        if (this.handlers) this.handlers.onFinalResult(finalText);
      }
    } catch (error: any) {
      if (this.handlers) this.handlers.onError(error);
    }
  }
}

export const microphoneService = new MicrophoneService();
