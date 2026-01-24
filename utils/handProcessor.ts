import { Point } from '../types';

// Linear interpolation for smoothing
const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
};

export interface LayoutMetrics {
    scaledW: number;
    scaledH: number;
    offsetX: number;
    offsetY: number;
}

export const calculateLayoutMetrics = (
    screenDims: { width: number; height: number },
    videoDims: { width: number; height: number }
): LayoutMetrics | null => {
    if (videoDims.width <= 0 || videoDims.height <= 0 || screenDims.width <= 0 || screenDims.height <= 0) {
        return null;
    }

    const videoW = videoDims.width;
    const videoH = videoDims.height;
    const screenW = screenDims.width;
    const screenH = screenDims.height;

    const videoRatio = videoW / videoH;
    const screenRatio = screenW / screenH;

    let scaledW, scaledH, offsetX, offsetY;

    if (screenRatio > videoRatio) {
        const scale = screenW / videoW;
        scaledW = screenW;
        scaledH = videoH * scale;
        offsetX = 0;
        offsetY = (scaledH - screenH) / 2;
    } else {
        const scale = screenH / videoH;
        scaledW = videoW * scale;
        scaledH = screenH;
        offsetX = (scaledW - screenW) / 2;
        offsetY = 0;
    }
    return { scaledW, scaledH, offsetX, offsetY };
};

export interface HandProcessingResult {
    positions: (Point | null)[];
    isDrawing: boolean[];
}

// Process multiple hands from MediaPipe results
export const processMultipleHands = (
    landmarks: any[],
    dims: { width: number; height: number },
    layoutMetrics: LayoutMetrics | null,
    lastCursorPositions: { current: (Point | null)[] },
    gestureHistories: { current: boolean[][] },
    GESTURE_HISTORY_SIZE: number
): HandProcessingResult => {
    const maxHands = 2;
    const positions: (Point | null)[] = [null, null];
    const isDrawing: boolean[] = [false, false];

    // Process each detected hand (up to 2)
    for (let handIndex = 0; handIndex < Math.min(landmarks.length, maxHands); handIndex++) {
        const handLandmarks = landmarks[handIndex];
        const indexTip = handLandmarks[8];

        // Gesture detection
        const middleFolded = handLandmarks[12].y > handLandmarks[10].y;
        const ringFolded = handLandmarks[16].y > handLandmarks[14].y;
        const pinkyFolded = handLandmarks[20].y > handLandmarks[18].y;
        const rawDrawingGesture = middleFolded && ringFolded && pinkyFolded;

        // Stabilize gesture using history buffer
        if (!gestureHistories.current[handIndex]) {
            gestureHistories.current[handIndex] = [];
        }

        gestureHistories.current[handIndex].push(rawDrawingGesture);
        if (gestureHistories.current[handIndex].length > GESTURE_HISTORY_SIZE) {
            gestureHistories.current[handIndex].shift();
        }

        const drawingFrames = gestureHistories.current[handIndex].filter(g => g).length;
        const isDrawingGesture = drawingFrames >= Math.ceil(GESTURE_HISTORY_SIZE / 2);

        // Map coordinates to screen
        let screenX: number;
        let screenY: number;

        if (layoutMetrics) {
            const { scaledW, scaledH, offsetX, offsetY } = layoutMetrics;

            const rawX = indexTip.x * scaledW;
            const rawY = indexTip.y * scaledH;

            const screenX_uncorrected = rawX - offsetX;
            const screenY_uncorrected = rawY - offsetY;

            // Mirror horizontally
            screenX = dims.width - screenX_uncorrected;
            screenY = screenY_uncorrected;
        } else {
            screenX = dims.width - (indexTip.x * dims.width);
            screenY = indexTip.y * dims.height;
        }

        // Apply smoothing
        const lastPos = lastCursorPositions.current[handIndex];
        if (lastPos) {
            const dx = screenX - lastPos.x;
            const dy = screenY - lastPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const smoothingFactor = Math.min(0.8, Math.max(0.2, 0.2 + (distance * 0.01)));

            screenX = lerp(lastPos.x, screenX, smoothingFactor);
            screenY = lerp(lastPos.y, screenY, smoothingFactor);
        }

        const newPos = { x: screenX, y: screenY };
        lastCursorPositions.current[handIndex] = newPos;

        positions[handIndex] = newPos;
        isDrawing[handIndex] = isDrawingGesture;
    }

    // Reset positions for missing hands
    for (let i = landmarks.length; i < maxHands; i++) {
        lastCursorPositions.current[i] = null;
        gestureHistories.current[i] = [];
        positions[i] = null;
        isDrawing[i] = false;
    }

    return { positions, isDrawing };
};
