## 2024-05-23 - Focus Restoration in Custom Modals
**Learning:** Custom modals (using `div` and conditional rendering) often break keyboard focus flow. When a modal closes, focus can get lost or reset to the start of the document, forcing keyboard users to navigate the entire page again.
**Action:** Always capture the element that opened the modal (using `useRef` or `document.activeElement`) and programmatically call `.focus()` on it when the modal unmounts or closes.
