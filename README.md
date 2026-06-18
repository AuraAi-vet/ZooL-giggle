# ZooL | AI-Powered Vet Care

ZooL is a comprehensive, dual-role (Veterinarian and Pet Owner) web application designed to streamline veterinary practice management and enhance pet care. It integrates cutting-edge Generative AI (Google Gemini) and WebLLM (Phi-3) to assist veterinarians with clinical assessments, and pet owners with symptom triage and general care advice.

## Current Architectural State (Trial Launch Phase)
- **Frontend Core:** React 18 + Vite with Tailwind CSS. Incorporates a high-performance Bento Grid architecture for dashboards.
- **Backend Infrastructure:** Firebase Firestore with IndexedDB multi-tab persistence and offline-first capabilities.
- **Real-Time Communications:** Daily.co WebRTC integration for secure telemedicine sessions.
- **Local Geographic Services:** OpenStreetMap (Overpass API) spatial queries prioritized with aggressive IndexedDB tile caching to reduce dependency on live Google Maps grounding.

## Security Protocols & Data Compliance
- **Auth & Access Control:** Strict Firebase Role-Based Access Control distinguishing Providers from Owners.
- **Trial Launch Safeties:** Stripe payment processing is currently paused for the trial evaluation; all bookings process instantly as complimentary premium rounds.
- **Telehealth Security:** HIPAA-compliant parameters configured via Daily.co WebRTC rooms.
- **Government Portals Linkage:** Initial foundation for e-Samrudha ID validation in `HealthView` to prevent unauthenticated medical exports.

## Active AI Optimizations
- **Dual-Model Fallback Engine:** Cloud-first Gemini insights seamlessly fall back to local in-browser WebLLM (Phi-3) when network loss occurs or cloud latency is high.
- **Cost Minimization & Token Constraints:** Implementation of `PromptOptimizer` to aggressively prune filler tokens before transmission, alongside telemetry graphs tracking daily credit caps and API exhaustion.
- **Centralized Telemetry:** Live interception and batching of runtime interaction and error logs to a dedicated `aiInteractionLogs` Firestore collection, enabling administrative observability without slowing down the primary client loop.

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables based on `.env.example`.
3. Start development server: `npm run dev`

