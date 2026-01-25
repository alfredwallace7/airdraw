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

export async function decodeAudioData(
  data: Uint8Array | string,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    // Note: Creating a new worker for every call has some overhead, but it ensures
    // we don't block the main thread with heavy decoding.
    // For very high frequency calls, a persistent worker pool would be better.
    const worker = new AudioWorker();

    worker.onmessage = (e: MessageEvent) => {
      const { channels } = e.data;
      const frameCount = channels[0].length;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

      for (let i = 0; i < numChannels; i++) {
        buffer.copyToChannel(channels[i], i);
      }

      worker.terminate();
      resolve(buffer);
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

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
