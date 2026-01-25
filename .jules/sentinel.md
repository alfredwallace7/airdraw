## 2024-05-22 - [CSP Implementation]
**Vulnerability:** Missing Content Security Policy (CSP) allowed loading resources from arbitrary domains.
**Learning:** React/Vite apps using Import Maps require `unsafe-inline` for `script-src` unless nonces/hashes are used. Google Fonts require both `style-src` (googleapis.com) and `font-src` (gstatic.com).
**Prevention:** Implemented a CSP in `index.html` whitelisting specific CDNs (jsdelivr, aistudiocdn) and API endpoints (Google GenAI).

## 2024-05-24 - [LLM Input Validation]
**Vulnerability:** Implicit trust in LLM tool call arguments cast to `any` could lead to runtime errors if the model returns malformed data.
**Learning:** LLMs are external systems and their outputs (even structured tool calls) must be treated as untrusted input.
**Prevention:** Added runtime type checking (`typeof`, `Number.isFinite`) for `updatePointer` arguments in `GeminiLiveService` before usage.

## 2024-05-25 - [Unpinned CDN Dependencies]
**Vulnerability:** Loading libraries from `cdn.jsdelivr.net` without a specific version number defaults to the latest version, exposing the app to potential supply chain attacks or breaking changes.
**Learning:** Runtime dependency loading via `locateFile` or similar mechanisms bypasses `package.json` version constraints. Explicitly pinning versions in URLs is crucial for reproducibility and security.
**Prevention:** Updated `services/mediaPipe.ts` to pin `@mediapipe/hands` to version `0.4.1675469240` in the CDN URL.
