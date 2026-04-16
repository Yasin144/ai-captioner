import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.1';

env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber = null;

function safeClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'bigint') return Number(obj);
        if (typeof obj === 'function') return undefined;
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => safeClone(item));
    }
    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = safeClone(obj[key]);
            if (val !== undefined) cloned[key] = val;
        }
    }
    return cloned;
}

self.onmessage = async (e) => {
    if (e.data.type === 'init') {
        try {
            if (!transcriber) {
                // Reduced from base.en down to tiny.en to aggressively prevent WebRTC/WASM memory crashes on slower laptops
                transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
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
            const safeResult = safeClone(result);
            self.postMessage({ type: 'result', result: safeResult });
        } catch (err) {
            self.postMessage({ type: 'error', error: err.message });
        }
    }
};
