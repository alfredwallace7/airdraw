## 2026-01-20 - React Draw Loop Optimization
**Learning:** In high-frequency React apps (60fps canvas drawing), relying on `useEffect` to synchronize state updates for drawing logic often introduces an extra render cycle per frame. By moving logic into the event handler (`onResults`) and using Refs for mutable intermediate state, we can batch updates and reduce renders by 50%.
**Action:** For animation loops in React, prefer direct updates in callbacks + one state sync over cascading `useEffect` chains.
