# ZooL Bug Isolation Protocol

## 1. Objective

This protocol outlines the core mechanisms implemented inside the ZooL codebase to trap, isolate, and handle bugs, preventing complete system compromise. The primary goal is graceful degradation where components fail independently instead of cascading and bringing down the entire application.

## 2. Global Error Boundaries

The application handles rendering-specific crashes via standardized React Error Boundaries.
- If a specific widget (e.g., `DiagnosticTool` or `AreaChart`) experiences a fatal runtime error, the individual component tree is isolated.
- The UI safely outputs a localized error state while keeping core routing and other views functional.

## 3. Asynchronous Task Trapping

All major API requests and third-party integrations use strict `try...catch` isolation with fallback return types rather than throwing uncaught promised exceptions:
- **RuRu AI (Gemini) Service**: Rate limit exhaustion or connection issues will fall back gracefully inside the `geminiService.ts` returning error messages that the UI translates into user-friendly chatbot notifications (e.g., `LIMIT_REACHED_MSG`).
- **Database Reads/Writes (Zustand/store)**: We employ `handleFirestoreError` globally across `useStore.ts` to capture specific Cloud Firestore exceptions:
  - Intercepts `Missing or insufficient permissions` for granular feedback.
  - Mitigates quota exceeded / offline statuses asynchronously.
  - Automatically pipes system context into `toast.error()` alerts without terminating local React state sync.

## 4. Triage Strategy for Developers

When an anomaly is reported, developers must adhere to the following sequence:

1. **Verify Backend Status**: Look for authentication or permission-denied errors. Ensure `firestore.rules` grants sufficient rights. Use the dedicated Firestore Error Handler standard output.
2. **Examine AI Nodes**: If AI features fail, verify `useAILimit.ts` and `limitCheck.allowed` states to determine if the issue is budget exhaustion or a true prompt validation bug.
3. **Check Client State**: In the event of data sync failures, verify `IndexDB` state management through standard devtools (the app leverages local `idb-keyval` for persistent caching).
4. **Isolate the Module**: If reproducible, run modular unit tests (`npx vitest run src/services/__tests__`) locally to prove functionality without spinning up the entire frontend.
