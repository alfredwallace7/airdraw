import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export class HandTrackingService {
    private hands: Hands;
    private camera: Camera | null = null;
    private onResults: (results: Results) => void;
    private processCanvas: HTMLCanvasElement;
    private processCtx: CanvasRenderingContext2D;

    constructor(onResults: (results: Results) => void) {
        this.onResults = onResults;

        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2, // Track both hands
            modelComplexity: 0, // Lite model for speed
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.onResults);

        // Create offscreen canvas for downscaled processing
        this.processCanvas = document.createElement('canvas');
        this.processCanvas.width = 640;
        this.processCanvas.height = 360; // 16:9 aspect ratio
        this.processCtx = this.processCanvas.getContext('2d')!;
    }

    start(videoElement: HTMLVideoElement) {
        if (this.camera) return;

        this.camera = new Camera(videoElement, {
            onFrame: async () => {
                // Draw high-res video to low-res canvas for processing
                this.processCtx.drawImage(videoElement, 0, 0, this.processCanvas.width, this.processCanvas.height);
                await this.hands.send({ image: this.processCanvas });
            },
            width: 1280, // High Res for Display
            height: 720
        });

        this.camera.start();
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
    }
}
