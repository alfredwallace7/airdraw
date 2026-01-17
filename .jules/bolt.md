## 2025-05-18 - Canvas Eraser Optimization
**Learning:** In a layered canvas app, simulating 'erasing' on the active layer by re-rendering all static paths is a major bottleneck (O(N)).
**Action:** Use `ctx.drawImage` to copy the static canvas to the active layer (O(1)) and hide the static layer during the operation. This maintains visual correctness while drastically improving performance.
