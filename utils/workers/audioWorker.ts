
self.onmessage = (e: MessageEvent) => {
  const { data, numChannels } = e.data;
  // data is an ArrayBuffer here because we transferred it
  const dataInt16 = new Int16Array(data);
  const frameCount = dataInt16.length / numChannels;

  // Prepare array of Float32Arrays for each channel
  const channels: Float32Array[] = [];
  const buffers: ArrayBuffer[] = [];

  for (let c = 0; c < numChannels; c++) {
    const floatBuffer = new Float32Array(frameCount);
    channels.push(floatBuffer);
    buffers.push(floatBuffer.buffer);
  }

  // De-interleave and convert
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = channels[channel];
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }

  // Transfer buffers back to main thread
  // In DedicatedWorkerGlobalScope, postMessage signature is (message: any, transfer: Transferable[])
  // TypeScript's default 'self' type might be Window | Worker, causing confusion.
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ channels }, buffers);
};
