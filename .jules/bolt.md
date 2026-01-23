## 2026-01-20 - React Draw Loop Optimization
**Learning:** In high-frequency React apps (60fps canvas drawing), relying on `useEffect` to synchronize state updates for drawing logic often introduces an extra render cycle per frame. By moving logic into the event handler (`onResults`) and using Refs for mutable intermediate state, we can batch updates and reduce renders by 50%.
**Action:** For animation loops in React, prefer direct updates in callbacks + one state sync over cascading `useEffect` chains.

## 2026-01-24 - Canvas Path2D Overhead
**Learning:** Instantiating `Path2D` objects from SVG path strings inside a high-frequency render loop (60fps) introduces significant overhead due to string allocation and path parsing.
**Action:** For dynamic canvas rendering, prefer direct `CanvasRenderingContext2D` method calls (e.g., `moveTo`, `quadraticCurveTo`) over `Path2D` unless caching the path object is possible and beneficial.

## 2026-01-22 - Decoupled React Animation Loop
**Learning:** Even with optimized effects, updating React state for 60fps data (e.g. cursor positions) forces the entire component tree to re-render, creating unnecessary overhead.
**Action:** For high-frequency visual updates, replace `useState` with `useRef` and drive the rendering via a `requestAnimationFrame` loop that reads refs directly, bypassing the React render cycle completely.

## 2026-01-25 - Loop-Invariant DOM Access
**Learning:** Accessing DOM properties (like `videoWidth`) inside a tight loop (e.g., per-hand processing) triggers unnecessary layout/reflow checks and redundant arithmetic.
**Action:** Lift invariant calculations and DOM reads out of loops, especially in high-frequency functions like `requestAnimationFrame` callbacks or MediaPipe `onResults`.

## 2026-01-26 - Incremental Canvas Drawing
**Learning:** Redrawing the entire canvas history on every new stroke (O(N)) becomes a bottleneck as the number of paths grows. By tracking the number of already-rendered paths, we can switch to an incremental draw strategy (O(1)) for the common "append" case.
**Action:** When managing a canvas with an append-only data model, use a ref to track rendered state and only draw the delta, falling back to full redraws only for clears, resets, or resizes.

## 2026-01-26 - Async Video Frame Processing
**Learning:** For high-frequency video processing (e.g. MediaPipe), using an intermediate `<canvas>` with `drawImage` (synchronous, main-thread) to downscale frames introduces significant blocking overhead. Replacing it with `createImageBitmap` (asynchronous, off-thread) with resize options allows the browser to optimize decoding and scaling, freeing up the main thread for UI and drawing.
**Action:** When processing video frames for AI models, prefer `createImageBitmap(video, { resizeWidth, resizeHeight })` over `canvas.drawImage`.
