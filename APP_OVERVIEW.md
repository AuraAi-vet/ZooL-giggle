# ZooL | AI-Powered Vet Care - Application Overview

## 1. App Overview
**ZooL** is a comprehensive, dual-role (Veterinarian and Pet Owner) web application designed to streamline veterinary practice management and enhance pet care. It integrates cutting-edge Generative AI (Google Gemini) to assist veterinarians with clinical assessments, and pet owners with symptom triage and general care advice.

The application features role-based access:
- **Pet Owners** can manage pet profiles, securely store medical records, run immediate AI symptom checks, trigger SOS emergencies, utilize a real-time AI voice assistant for guidance, and search/book care services.
- **Veterinarians** have access to a clinical dashboard, allowing them to manage patients, generate automated SOAP notes via audio transcription, run AI differential diagnoses, evaluate clinical assessments, and manage their calendar/availability.

## 2. Technical Architecture & Tech Stack
- **Frontend framework:** React 18 with Vite
- **Styling:** Tailwind CSS with a highly custom, polished design system (Inter & Garamond fonts, semantic color mapping).
- **State Management:** Zustand (`useStore.ts`) for global state and syncing with Firestore.
- **Database & Authentication:** Firebase (Firestore) and Firebase Authentication.
- **Calendar:** `react-big-calendar` for appointment management.
- **Mapping:** `leaflet` with custom hooks for interactive service location management.
- **AI Integration:** `@google/genai` SDK using Gemini models for generating textual diagnoses, chat sessions, structured document parsing, speech-to-text, and AI-powered service search.
- **Live AI Audio:** Real-time WebRTC audio sessions with `gemini-2.0-flash-exp` (or Live API standard) for the Voice Assistant capabilities.
- **Cost Optimization Protocol:** A custom rate-limiting and daily-usage capping system implemented via `localStorage` and token tracking to prevent API abuse and control costs.

## 3. Directory Structure

```text
/src
├── App.tsx                    # Main entry point and layout shell. Handles routing/modals.
├── main.tsx                   # React root rendering.
├── index.css                  # Global Tailwind imports and font definitions.
├── types.ts                   # Global TypeScript interfaces (User, Pet, Record, etc.).
│
├── store/
│   └── useStore.ts            # Zustand store managing states and Firebase realtime sync.
│
├── services/
│   ├── geminiService.ts       # Centralized AI functions (Limits, Chat, Transcribe, Parse, Differentials, AI Search).
│   └── firebase.ts            # Firebase config and initialization.
│
├── views/
│   ├── LoginView.tsx          # Authentication flow.
│   ├── HomeView.tsx           # Pet Owner Dashboard.
│   ├── VetDashboardView.tsx   # Veterinarian Clinical Dashboard (with Calendar).
│   └── ServicesView.tsx       # AI-Powered Service Discovery and Map.
│
├── components/
│   ├── DiagnosticTool.tsx     # Vet-specific Differential Diagnosis UI.
│   ├── LiveAssistant.tsx      # WebSocket/Live API Voice Assistant UI.
│   ├── ServiceMap.tsx         # Interactive map for service locations.
│   └── ...                    # Other components.
│
└── lib/
    └── utils.ts               # Tailwind `cn()` merge utility.
```

## 4. Core Features & Processes

### A. Authentication & Role assignment
- Users log in via Google Auth.
- Upon first login, users select a role: **Pet Owner** or **Veterinarian**.
- The `useStore` hydrates the user profile and routes them to their respective dashboard.

### B. Veterinarian Workflow (VetDashboardView)
1. **Patient Management:** Vets see a list of patients (pets) globally or assigned to their clinic.
2. **Clinical Notes (SOAP):** Vets can record audio observations. `geminiService.ts` transcribes the audio and structures it into a standard Subjective, Objective, Assessment, Plan (SOAP) format.
3. **Differential Diagnostics:** Using the `DiagnosticTool`, vets input symptoms and vitals. The Gemini 3.1 Pro model evaluates the clinical presentation and returns a list of ranked differentials and recommended diagnostics.
4. **Calendar Management:** Integrated functionality using `react-big-calendar` to manage appointments and view provider availability.

### C. Pet Owner/Service Workflow (ServicesView & HomeView)
1. **AI-Powered Discovery:** Search pet services (vets, groomers, etc.) using AI-driven search that taps into the Gemini model for context-aware queries.
2. **Interactive Mapping:** View service locations on a map using `ServiceMap`. Clicking map markers animates the map to the location and highlights the corresponding service in the list.
3. **Service Booking:** Integrated workflow for selecting service types (e.g., 'vet'), viewing nearby providers, and initiating appointments.
4. **Pet Portfolios/Symptom Checker:** Owners can add pets, upload records, and use the symptom checker for AI triage advice.
5. **Live Voice Assistant:** Using the `LiveAssistant` component, owners can speak naturally to an AI Vet Assistant.

### D. Cost Optimization & Rate Limiting
To ensure application scalability and control costs, a hard cap is placed on AI interactions:
- Found in `src/services/geminiService.ts` -> `checkLimits()`.
- Implements both short-term **Rate Limiting** (e.g., 1 request per 3 seconds) and a **Daily Cap** (Max 50 requests/day).
- Enforced locally across all AI endpoints (Diagnostics, Live Audio, Transcriptions, AI Search).

## 5. Security & Data Integrity
- **Firestore Rules:** Collections like `users`, `pets`, `records`, `appointments`, and `clinics` are strictly gated. Users can only read/write their own data; vets have scoped access.
- **Immutability:** AI logic runs structurally. Malicious inputs are filtered out, and rate-limits protect against denial-of-wallet attacks.
- **Deployment:** Security rules are automatically deployed via integrated CI/CD scripts to ensure consistent protection.
