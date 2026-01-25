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
**Learning:** Redrawing the entire canvas history (O(N)) on every new stroke completion causes performance degradation as the session length increases.
**Action:** Implement incremental drawing by tracking rendered state. Only draw new paths (O(1)) unless a full invalidation (resize/undo) occurs.
**Learning:** Redrawing the entire canvas history on every new stroke (O(N)) becomes a bottleneck as the number of paths grows. By tracking the number of already-rendered paths, we can switch to an incremental draw strategy (O(1)) for the common "append" case.
**Action:** When managing a canvas with an append-only data model, use a ref to track rendered state and only draw the delta, falling back to full redraws only for clears, resets, or resizes.

## 2026-01-26 - Async Video Frame Processing
**Learning:** For high-frequency video processing (e.g. MediaPipe), using an intermediate `<canvas>` with `drawImage` (synchronous, main-thread) to downscale frames introduces significant blocking overhead. Replacing it with `createImageBitmap` (asynchronous, off-thread) with resize options allows the browser to optimize decoding and scaling, freeing up the main thread for UI and drawing.
**Action:** When processing video frames for AI models, prefer `createImageBitmap(video, { resizeWidth, resizeHeight })` over `canvas.drawImage`.

## 2026-02-04 - Off-Thread Base64 Decoding
**Learning:** Decoding Base64 strings to binary arrays (using `atob` and loops) on the main thread is an O(N) operation that blocks the event loop, causing jank during high-frequency audio updates (e.g. Gemini Live).
**Action:** Move Base64 decoding logic into a Web Worker. Workers support `atob`, allowing the expensive string parsing and array construction to happen in parallel without affecting UI frame rate.

## 2026-02-05 - Conditional DOM Hit-Testing
**Learning:** Calling `document.elementFromPoint` in a high-frequency loop (60fps) triggers synchronous layout/reflow, consuming significant frame budget.
**Action:** Guard expensive DOM queries with state checks (e.g. `isDrawing`) so they only run when interaction is actually occurring, not during passive hovering.

## 2026-02-06 - GC Reduction in Hot Loops
**Learning:** In high-frequency loops like MediaPipe `onResults` (30-60fps), repeatedly allocating small objects and arrays (e.g., return values, `.filter()` results) creates significant garbage collection pressure, leading to frame drops.
**Action:** Use mutable result objects (passed via Refs) and simple `for` loops instead of array methods (`filter`, `map`) in critical animation paths to reuse memory and maintain stable frame rates.
## 2026-02-06 - Conditional Canvas Copy
**Learning:** Copying a large canvas (e.g. 1920x1080) for "preview" effects (like X-ray eraser) every frame consumes massive bandwidth (120MP/s @ 60fps) and should be avoided for passive states like hovering.
**Action:** Guard expensive canvas composition operations so they only run when the user is actively modifying the canvas (drawing), not just selecting a tool.

## 2026-02-18 - Zero-Allocation Loop Data Passing
**Learning:** Returning new objects and arrays from helper functions called inside high-frequency loops (e.g. 60fps MediaPipe callbacks) creates significant Garbage Collection pressure, leading to frame drops.
**Action:** Use "Output Buffers" (mutable arrays/objects passed as arguments) for helper functions in hot paths, updating them in-place instead of returning new instances.

## 2026-02-23 - Long Stroke DOM Optimization
**Learning:** Even with "isDrawing" checks, continuous drawing gestures (long strokes) still trigger per-frame DOM queries if the logic conflates "drawing" with "clicking".
**Action:** Explicitly check for stroke length or duration to distinguish between a "click" (short) and a "draw" (long), and disable DOM hit-testing during the latter.
