## 2025-05-02 - Visibility Transitions vs Accessibility
**Learning:** This app frequently uses `opacity-0 pointer-events-none` for smooth visibility transitions. While visually effective, this leaves content in the accessibility tree, creating "ghost" content for screen readers.
**Action:** Always pair `opacity-0` transitions with `aria-hidden={!isVisible}` (or `visibility: hidden` via JS timeout) to ensure the accessibility tree matches the visual state.

## 2025-05-18 - Async Loading States for Hardware Access
**Learning:** Initiating hardware access (camera/mic) is an indeterminate async operation that varies wildly by device and permission state. Users often rage-click "Enable Camera" because the browser prompt doesn't immediately appear or the stream takes time to initialize.
**Action:** Always wrap hardware initialization in a distinct loading state (disabled button + spinner) that persists until the *stream is active*, not just until the function returns. Ensure error handling resets this state to allow retries.
