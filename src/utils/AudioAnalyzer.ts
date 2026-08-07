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

  private outContext: AudioContext | null = null;
  private outAnalyser: AnalyserNode | null = null;
  private outDataArray: Uint8Array | null = null;
  private outSource: MediaElementAudioSourceNode | null = null;
  private outAudioElement: HTMLAudioElement | null = null;
  private outSmoothedData: AudioData = {
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    speaking: false,
    silence: true,
  };

  private smoothingFactor = 0.8;
  private silenceThreshold = 0.05;

  private isInitializing = false;
  private stream: MediaStream | null = null;

  // Recording state for REST API
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingPromiseResolve: ((blob: Blob) => void) | null = null;

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

      // Setup MediaRecorder for Sarvam REST API
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        if (this.recordingPromiseResolve) {
          this.recordingPromiseResolve(audioBlob);
          this.recordingPromiseResolve = null;
        }
      };

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount as any);
    } catch (error) {
      console.error('Failed to initialize microphone', error);
    } finally {
      this.isInitializing = false;
    }
  }

  public startRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.audioChunks = [];
      this.mediaRecorder.start();
    }
  }

  public stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      this.recordingPromiseResolve = resolve;
      this.mediaRecorder.stop();
    });
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
    const bassEnd = Math.floor(length * 0.1);
    const midEnd = Math.floor(length * 0.6);

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

    this.smoothedData.volume = this.lerp(this.smoothedData.volume, volume, 1 - this.smoothingFactor);
    this.smoothedData.bass = this.lerp(this.smoothedData.bass, bass, 1 - this.smoothingFactor);
    this.smoothedData.mid = this.lerp(this.smoothedData.mid, mid, 1 - this.smoothingFactor);
    this.smoothedData.treble = this.lerp(this.smoothedData.treble, treble, 1 - this.smoothingFactor);

    this.smoothedData.speaking = this.smoothedData.volume > this.silenceThreshold;
    this.smoothedData.silence = !this.smoothedData.speaking;

    return this.smoothedData;
  }

  public attachOutput(audioElement: HTMLAudioElement) {
    if (this.outAudioElement === audioElement) {
      if (this.outContext?.state === 'suspended') {
        this.outContext.resume();
      }
      return;
    }

    if (!this.outContext) {
      this.outContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (!this.outAnalyser) {
      this.outAnalyser = this.outContext.createAnalyser();
      this.outAnalyser.fftSize = 512;
      this.outAnalyser.smoothingTimeConstant = 0.5;
      this.outDataArray = new Uint8Array(this.outAnalyser.frequencyBinCount);
      this.outAnalyser.connect(this.outContext.destination);
    }

    if (this.outSource) {
      this.outSource.disconnect();
    }

    try {
      this.outSource = this.outContext.createMediaElementSource(audioElement);
      this.outSource.connect(this.outAnalyser);
      this.outAudioElement = audioElement;
    } catch (e) {
      console.warn("MediaElementSource creation failed:", e);
    }
    
    // Resume context if it was suspended due to async execution delays
    if (this.outContext.state === 'suspended') {
      this.outContext.resume();
    }
  }

  public getOutputAudioData(): AudioData {
    if (!this.outAnalyser || !this.outDataArray) {
      return this.outSmoothedData;
    }

    this.outAnalyser.getByteFrequencyData(this.outDataArray);

    let sum = 0;
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;

    const length = this.outDataArray.length;
    const bassEnd = Math.floor(length * 0.1);
    const midEnd = Math.floor(length * 0.6);

    for (let i = 0; i < length; i++) {
      const val = this.outDataArray[i] / 255.0;
      sum += val;

      if (i < bassEnd) bassSum += val;
      else if (i < midEnd) midSum += val;
      else trebleSum += val;
    }

    const volume = sum / length;
    const bass = bassSum / bassEnd;
    const mid = midSum / (midEnd - bassEnd);
    const treble = trebleSum / (length - midEnd);

    this.outSmoothedData.volume = this.lerp(this.outSmoothedData.volume, volume, 1 - this.smoothingFactor);
    this.outSmoothedData.bass = this.lerp(this.outSmoothedData.bass, bass, 1 - this.smoothingFactor);
    this.outSmoothedData.mid = this.lerp(this.outSmoothedData.mid, mid, 1 - this.smoothingFactor);
    this.outSmoothedData.treble = this.lerp(this.outSmoothedData.treble, treble, 1 - this.smoothingFactor);

    this.outSmoothedData.speaking = this.outSmoothedData.volume > this.silenceThreshold;
    this.outSmoothedData.silence = !this.outSmoothedData.speaking;

    return this.outSmoothedData;
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
