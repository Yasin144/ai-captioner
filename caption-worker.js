import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.1';

env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber = null;

self.onmessage = async (e) => {
    if (e.data.type === 'init') {
        try {
            if (!transcriber) {
                transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', {
                    progress_callback: data => {
                        self.postMessage({ type: 'progress', data });
                    }
                });
            }
            self.postMessage({ type: 'init_done' });
        } catch (err) {
            self.postMessage({ type: 'error', error: err.message });
        }
    } else if (e.data.type === 'transcribe') {
        try {
            const { audioDataArray, options, duration } = e.data;
            const result = await transcriber(audioDataArray, {
                ...options,
                chunk_callback: (chunk) => {
                    self.postMessage({ type: 'chunk_progress', chunk, duration });
                }
            });
            self.postMessage({ type: 'result', result });
        } catch (err) {
            self.postMessage({ type: 'error', error: err.message });
        }
    }
};
