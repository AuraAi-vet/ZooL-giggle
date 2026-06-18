## 2026-06-17 - [Hardcoded Secrets Removal]
**Vulnerability:** Firebase `apiKey` and other config parameters were hardcoded in `firebase-applet-config.json` and committed to the repository.
**Learning:** Even though Firebase client IDs/keys are considered public relative to the application codebase, they shouldn't be hardcoded into JSON files pushed to the repository because it can lead to unnecessary leakage or override correctly supplied environment variables. Hardcoding also makes it difficult to change environments.
**Prevention:** Always rely on `import.meta.env` (for Vite apps) to supply environment configurations, and keep fallback JSON files clean of any actual sensitive data.
