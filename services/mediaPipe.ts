import { Hands, Results, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export class HandTrackingService {
  private hands: Hands;
  private camera: Camera | null = null;
  private onResults: (results: Results) => void;

  constructor(onResults: (results: Results) => void) {
    this.onResults = onResults;

    this.hands = new Hands({
      locateFile: (file) => {
        const url = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
        console.log('MediaPipe loading:', file, 'from', url);
        return url;
      },
    });

    this.hands.setOptions({
      maxNumHands: 2, // Track both hands
      modelComplexity: 0, // Lite model for speed
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults(this.onResults);
  }

  async start(
    videoElement: HTMLVideoElement,
    width: number = 1280,
    height: number = 720,
  ): Promise<void> {
    if (this.camera) return;

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        // ⚡ OPTIMIZATION: Use createImageBitmap for async off-thread downscaling
        // This avoids blocking the main thread with synchronous canvas drawImage calls
        let bitmap: ImageBitmap | undefined;
        try {
          bitmap = await createImageBitmap(videoElement, {
            resizeWidth: 640,
            resizeHeight: 360,
          });
          // Cast to any because @mediapipe/hands types don't explicitly include ImageBitmap despite runtime support
          await this.hands.send({ image: bitmap as any });
        } catch (e) {
          console.error('Frame processing error:', e);
        } finally {
          if (bitmap) {
            bitmap.close();
          }
        }
      },
      width: width,
      height: height,
    });

    return this.camera.start();
  }

  stop() {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
  }
}
