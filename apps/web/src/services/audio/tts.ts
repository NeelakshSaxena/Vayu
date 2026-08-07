import { audioAnalyzer } from './AudioAnalyzer';

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function pcmToWav(pcmData: ArrayBuffer, sampleRate = 44100, numChannels = 1) {
  const bytesPerSample = 2; // 16-bit PCM
  const byteRate = sampleRate * numChannels * bytesPerSample;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(new Uint8Array(pcmData));

  return buffer;
}

export const playTTS = async (text: string, onPlay: () => void, onEnded: () => void, onError: (error: Error) => void) => {
  try {
    const apiKey = import.meta.env.VITE_OPEN_ROUTER_KEY || "";
    const response = await fetch("https://openrouter.ai/api/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "fish-audio/s2.1-pro-free:free",
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.status} ${await response.text()}`);
    }

    const pcmBuffer = await response.arrayBuffer();
    const wavBuffer = pcmToWav(pcmBuffer, 44100, 1);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);
    audio.crossOrigin = "anonymous";

    audioAnalyzer.attachOutput(audio);

    audio.onplay = onPlay;
    audio.onended = () => {
      onEnded();
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => onError(new Error("Audio playback failed"));

    await audio.play();
  } catch (err: any) {
    onError(err);
  }
};
