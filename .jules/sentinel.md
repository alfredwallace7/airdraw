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

## 2024-05-26 - [MediaPipe Input Validation]
**Vulnerability:** Accessing MediaPipe landmark arrays without checking for existence or length could cause main-thread crashes if the library returned malformed or partial data.
**Learning:** External libraries, even trusted ones like MediaPipe, can behave unexpectedly. Client-side crash resilience requires validating all external data structures before access.
**Prevention:** Added explicit null and length checks (`< 21`) for `handLandmarks` in `utils/handProcessor.ts` before accessing specific indices.

## 2024-05-27 - [Error Message Sanitization]
**Vulnerability:** Propagating raw `error.message` to the UI in `GeminiLiveService` could leak sensitive details (like API keys or internal paths) if the underlying library throws a detailed error.
**Learning:** Never trust external library error messages to be safe for user display.
**Prevention:** Replaced raw error message propagation with a generic "Failed to connect" message in `services/geminiLive.ts`, while keeping detailed logs for developers.
