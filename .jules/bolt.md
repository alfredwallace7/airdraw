## 2026-03-05 - Cursor Sprite Caching
**Learning:** Drawing complex cursors (arcs, dashes, strokes) using vector commands every frame (60fps) incurs redundant CPU overhead (function calls) and GPU rasterization costs.
**Action:** Pre-render static cursors to off-screen canvases and use `drawImage` (blitting). Benchmarks show a ~6x reduction in JS function call overhead for normal cursors and ~1.5x for complex eraser cursors, in addition to unmeasured GPU savings.
