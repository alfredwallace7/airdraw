## 2024-05-22 - [Canvas Eraser Optimization]
**Learning:** In dual-canvas drawing apps (static + active), re-rendering all static paths onto the active layer for eraser previews is an O(N) bottleneck.
**Action:** Use `ctx.drawImage` to copy the static canvas bitmap to the active layer (O(1)) and temporarily hide the static layer to achieve the same visual result with significantly better performance.
