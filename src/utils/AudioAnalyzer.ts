export interface AudioData {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  speaking: boolean;
  silence: boolean;
}

class AudioAnalyzer {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private dataArray: any = null;
  
  private smoothedData: AudioData = {
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    speaking: false,
    silence: true,
  };

  private smoothingFactor = 0.8;
  private silenceThreshold = 0.05; // 5% volume threshold

  private isInitializing = false;
  private stream: MediaStream | null = null;

  public async initialize() {
    if (this.context || this.isInitializing) return;
    this.isInitializing = true;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.5;

      this.source = this.context.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount as any);
    } catch (error) {
      console.error('Failed to initialize microphone', error);
    } finally {
      this.isInitializing = false;
    }
  }

  public getAudioData(): AudioData {
    if (!this.analyser || !this.dataArray) {
      return this.smoothedData;
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    let sum = 0;
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;

    const length = this.dataArray.length;
    const bassEnd = Math.floor(length * 0.1); // 0 - 10%
    const midEnd = Math.floor(length * 0.6); // 10% - 60%
    // treble is 60% - 100%

    for (let i = 0; i < length; i++) {
      const val = this.dataArray[i] / 255.0;
      sum += val;

      if (i < bassEnd) bassSum += val;
      else if (i < midEnd) midSum += val;
      else trebleSum += val;
    }

    const volume = sum / length;
    const bass = bassSum / bassEnd;
    const mid = midSum / (midEnd - bassEnd);
    const treble = trebleSum / (length - midEnd);

    // Exponential smoothing
    this.smoothedData.volume = this.lerp(this.smoothedData.volume, volume, 1 - this.smoothingFactor);
    this.smoothedData.bass = this.lerp(this.smoothedData.bass, bass, 1 - this.smoothingFactor);
    this.smoothedData.mid = this.lerp(this.smoothedData.mid, mid, 1 - this.smoothingFactor);
    this.smoothedData.treble = this.lerp(this.smoothedData.treble, treble, 1 - this.smoothingFactor);

    this.smoothedData.speaking = this.smoothedData.volume > this.silenceThreshold;
    this.smoothedData.silence = !this.smoothedData.speaking;

    return this.smoothedData;
  }

  public stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
  }

  private lerp(start: number, end: number, amt: number) {
    return (1 - amt) * start + amt * end;
  }
}

// Export a singleton instance
export const audioAnalyzer = new AudioAnalyzer();
