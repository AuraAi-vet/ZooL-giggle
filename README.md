# ZooL | AI-Powered Vet Care

ZooL is a comprehensive, dual-role (Veterinarian and Pet Owner) web application designed to streamline veterinary practice management and enhance pet care. It integrates cutting-edge Generative AI (Google Gemini) to assist veterinarians with clinical assessments, and pet owners with symptom triage and general care advice.

## Latest Updates

- **Provider Dashboard Enhancements:** Added a dedicated 'Service Catalog' section allowing providers to add, edit, and remove service listings with pricing and duration.
- **Appointment Booking:** Added confirmation dialogs for blocking availability slots.
- **AI Integration Improvements:**
  - `AIView` now sends enhanced pet context (name, age, breed, chronic conditions) to Gemini for more tailored advice.
  - `ServicesView` now properly integrates with the `searchPetServicesAI` function, ensuring search results stay synchronized with the interactive map markers.
- **Stability Fixes:**
  - Resolved TypeScript errors in `LiveAssistant.tsx` and `RuRuIcon.tsx`.
  - Fixed type definitions in `ProviderDashboardView.tsx`.
  - Aligned Vite versioning for build stability (`^8.0.0`).

## Key Features

- **Pet Owner Dashboard:** Manage pet profiles, medical records, symptom triage, AI voice assistant, and service booking.
- **Veterinarian Dashboard:** Manage patients, clinical SOAP notes (via audio), AI differential diagnostics, and appointment scheduling.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Backend/DB:** Firebase (Firestore & Auth)
- **AI:** @google/genai (Gemini)
- **Mapping:** Leaflet
- **Calendar:** react-big-calendar

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables based on `.env.example`.
3. Start development server: `npm run dev`
