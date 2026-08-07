import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use local models only
env.allowRemoteModels = false;
env.allowLocalModels = true;
// Vite serves the public directory at the root /
env.localModelPath = '/models/';

// Use the exact model name that we cloned
const MODEL_NAME = 'whisper-medium';

class PipelineFactory {
    static task = 'automatic-speech-recognition' as any;
    static model = MODEL_NAME;
    static instance: any = null;

    static async getInstance(progress_callback: (info: any) => void) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, {
                progress_callback,
            });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const { type, audioData } = event.data;

    if (type === 'load') {
        try {
            self.postMessage({ status: 'loading', message: 'Loading model...' });
            await PipelineFactory.getInstance((info) => {
                self.postMessage({ status: 'progress', info });
            });
            self.postMessage({ status: 'ready' });
        } catch (error) {
            self.postMessage({ status: 'error', error: String(error) });
        }
    } else if (type === 'transcribe') {
        try {
            self.postMessage({ status: 'processing' });
            
            const transcriber = await PipelineFactory.getInstance(() => {});
            
            // audioData is expected to be a Float32Array of PCM audio at 16000Hz
            const result = await transcriber(audioData, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english',
                task: 'transcribe',
            });

            self.postMessage({ status: 'complete', text: result.text });
        } catch (error) {
            self.postMessage({ status: 'error', error: String(error) });
        }
    }
});
