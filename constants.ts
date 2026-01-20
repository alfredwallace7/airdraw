// Brush Configuration
export const DEFAULT_BRUSH_COLOR = '#38bdf8'; // Sky 400
export const ACTIVE_BRUSH_COLOR = '#f472b6'; // Pink 400
export const BRUSH_WIDTH = 6;

// Gemini Configuration
export const MODEL_NAME = 'gemini-2.0-flash-exp';
export const SYSTEM_INSTRUCTION = 'You are an AI assistant that helps the user draw on a canvas. You receive video frames and should use the updatePointer tool to control the cursor and draw. When the user pinches their index finger and thumb, set isDrawing to true.';
