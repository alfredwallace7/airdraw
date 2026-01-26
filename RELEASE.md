# Release Notes

## v0.1.0 - Initial Public Release
- Full **AirDraw** application with camera‑based hand tracking and drawing.
- Support for 2‑hand simultaneous drawing, pencil/eraser tools, and dynamic brush sizing.
- Responsive UI with settings panel, video opacity control, and help overlay.
- Optimized canvas rendering using separate static & active layers and requestAnimationFrame.

## v0.1.1 - Performance Improvements
- Memoized `CanvasLayer` to reduce React re‑renders during drawing.
- Added incremental redraw logic for static paths to avoid O(N) canvas clears.
- Cached perfect‑freehand strokes with a WeakMap to prevent repeated calculations.
- Updated documentation and README with usage instructions.
