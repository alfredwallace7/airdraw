import AudioWorker from './workers/audioWorker?worker';

// Convert a Blob to a Base64 string
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper for PCM audio decoding (required for setting up the session properly even if we don't expect audio back)
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ⚡ OPTIMIZATION: Reuse worker instance to avoid expensive creation/termination overhead
let worker: Worker | null = null;
interface PendingRequest {
  resolve: (value: AudioBuffer) => void;
  reject: (reason?: any) => void;
  ctx: AudioContext;
  sampleRate: number;
  numChannels: number;
}
const pendingRequests: PendingRequest[] = [];

export async function decodeAudioData(
  data: Uint8Array | string,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    if (!worker) {
      worker = new AudioWorker();

      worker.onmessage = (e: MessageEvent) => {
        const req = pendingRequests.shift();
        if (!req) return;

        const { resolve: reqResolve, reject: reqReject, ctx: reqCtx, sampleRate: reqSampleRate, numChannels: reqNumChannels } = req;
        const { channels } = e.data;

        try {
          const frameCount = channels[0].length;
          const buffer = reqCtx.createBuffer(reqNumChannels, frameCount, reqSampleRate);

          for (let i = 0; i < reqNumChannels; i++) {
            buffer.copyToChannel(channels[i], i);
          }

          reqResolve(buffer);
        } catch (error) {
          reqReject(error);
        }
      };

      worker.onerror = (err) => {
        console.error("AudioWorker error:", err);
        // Reject all pending requests as the worker state is compromised
        while (pendingRequests.length > 0) {
          const req = pendingRequests.shift();
          if (req) {
            req.reject(err);
          }
        }
        // Restart worker on error to ensure fresh state
        if (worker) {
          worker.terminate();
          worker = null;
        }
      };
    }

    pendingRequests.push({ resolve, reject, ctx, sampleRate, numChannels });

    // Send data to worker.
    if (typeof data === 'string') {
      worker.postMessage({ data, numChannels });
    } else {
      // We transfer the buffer to avoid copying.
      // WARNING: This operation detaches 'data.buffer', making the input 'data' array unusable in the main thread.
      const buffer = data.buffer;
      worker.postMessage({ data: buffer, numChannels }, [buffer]);
    }
  });
}
