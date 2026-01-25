## 2025-05-02 - Visibility Transitions vs Accessibility
**Learning:** This app frequently uses `opacity-0 pointer-events-none` for smooth visibility transitions. While visually effective, this leaves content in the accessibility tree, creating "ghost" content for screen readers.
**Action:** Always pair `opacity-0` transitions with `aria-hidden={!isVisible}` (or `visibility: hidden` via JS timeout) to ensure the accessibility tree matches the visual state.
