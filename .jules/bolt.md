## 2026-01-20 - React Draw Loop Optimization
**Learning:** In high-frequency React apps (60fps canvas drawing), relying on `useEffect` to synchronize state updates for drawing logic often introduces an extra render cycle per frame. By moving logic into the event handler (`onResults`) and using Refs for mutable intermediate state, we can batch updates and reduce renders by 50%.
**Action:** For animation loops in React, prefer direct updates in callbacks + one state sync over cascading `useEffect` chains.

## 2026-01-24 - Canvas Path2D Overhead
**Learning:** Instantiating `Path2D` objects from SVG path strings inside a high-frequency render loop (60fps) introduces significant overhead due to string allocation and path parsing.
**Action:** For dynamic canvas rendering, prefer direct `CanvasRenderingContext2D` method calls (e.g., `moveTo`, `quadraticCurveTo`) over `Path2D` unless caching the path object is possible and beneficial.

## 2026-01-22 - Decoupled React Animation Loop
**Learning:** Even with optimized effects, updating React state for 60fps data (e.g. cursor positions) forces the entire component tree to re-render, creating unnecessary overhead.
**Action:** For high-frequency visual updates, replace `useState` with `useRef` and drive the rendering via a `requestAnimationFrame` loop that reads refs directly, bypassing the React render cycle completely.
