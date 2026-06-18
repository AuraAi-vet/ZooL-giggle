# ZooL App: Improvement & Technical Debt Report

## 1. AI Integration & Model Stability
**Issue:** The recent `500 Rpc failed` error was caused by hardcoded, deprecated, or non-existent generative model identifiers (`gemini-3-flash-preview`, `gemini-3.1-flash-lite`, `gemini-3.1-flash-live-preview`).
**Improvement Needed:**
- **Dynamic Model Configuration:** Abstract model strings into environment variables (e.g., `VITE_GEMINI_MODEL`, `VITE_GEMINI_LIVE_MODEL`) to allow zero-downtime updates when Google upgrades their model versions.
- **Graceful Downgrade:** Implement a retry mechanism that falls back from experimental/preview models to stable endpoints (e.g., fallback to `gemini-2.5-flash` if experimental APIs fail).

## 2. API Error Handling & User Experience
**Issue:** When the AI call failed during the insights generation, the error was logged to the console, but the application lacked a robust visual fallback pattern in some components.
**Improvement Needed:**
- **Global Toast Notifications:** Implement a global notification system (like `react-hot-toast` or `sonner`) to catch and display readable errors.
- **Circuit Breakers:** Prevent the UI from spamming API calls if an endpoint repeatedly returns 500 errors. 

## 3. Data Persistence & Synchronization
**Issue:** The app currently relies heavily on `localStorage` for storing AI usage limits, pet profiles, and health records (via the custom Zustand store or context).
**Improvement Needed:**
- **Backend Setup:** Integrate Firebase Firestore to securely store user data and synchronize it across multiple devices.
- **Robust Offline Mode:** Implement IndexedDB or robust Service Worker caching (PWA enhancements) because pet owners and vets might need to access digital health records in areas with poor cellular reception (e.g., at dog parks or clinic backrooms).

## 4. State Management Performance
**Issue:** The large unified layout and top-level application state can trigger unnecessary re-renders.
**Improvement Needed:**
- **Atomic State:** Refactor any monolithic state objects into atomic slices (e.g., separating user profile state, AI metric state, and health record state) so that independent components only render when precisely necessary.

## 5. WebRTC & Live Assistant Stability
**Issue:** The Live Assistant connects via the Gemini Live API utilizing experimental Multimodal features.
**Improvement Needed:**
- **AudioContext Management:** Browsers strictly suspend audio contexts without explicit user interaction. Make sure the "Listen" button proactively resumes the context.
- **Connection Resiliency:** Implement auto-reconnection logic with exponential backoff if the Gemini WebSocket abruptly drops.

## 6. Build Quality & CI Checks
**Issue:** Minor syntax errors (like invalid Unicode escape sequences in template literals) can silently break the `vite-plugin-pwa` build process.
**Improvement Needed:**
- Enforce stricter ESLint and Prettier formatting rules as pre-commit hooks.
- Increase Vitest unit test coverage specifically focusing on the AI parsing utility functions (`GeminiAIService.ts` and `geminiService.ts`) to ensure robust JSON extraction from LLM outputs.
