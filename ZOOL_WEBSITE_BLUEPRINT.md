# ZooL (zool.info) Website Blueprint & Architectural Master Plan

## 1. Project Analysis & Strategic Vision

**Objective:** To deploy a fully functional, AI-powered veterinary practice management platform on the `zool.info` domain, bridging the gap between clinical efficiency and pet owner engagement.

**Target Audience Segments:**
1.  **Pet Owners (B2C):** Seeking transparency, easy booking, push notifications, and digital health records for their pets.
2.  **Veterinary Clinicians (B2B):** Requiring fast, accurate, AI-assisted tools for diagnosis, note-taking, and patient triage with zero UI friction.
3.  **Clinic Administrators (B2B):** Needing high-level analytics, throughput monitoring, and resource management.
4.  **Service Providers (B2B):** Groomers, boarders, and techs needing agile, kanban-style task management.

**Core Value Proposition:** Unifying clinical management, pet owner engagement, and AI-driven insights into a single, seamless, responsive web application utilizing a modern tech stack (React, Node.js/Express backend for secure Gemini API access, and Firebase Firestore/Auth).

---

## 2. Advanced Structural Architecture

### Application Stack (Full-Stack SPA)
* **Frontend:** React 18+ powered by Vite.
* **Backend:** Node.js + Express (compiled via `esbuild` to `dist/server.cjs`), enabling secure BFF (Backend for Frontend) architecture.
* **Component Library:** Headless Radix UI + Custom Tailwind CSS for unparalleled control over design tokens.
* **Database:** Firebase Firestore (NoSQL) configured with strict role-based access control (RBAC).
* **Authentication:** Firebase Auth (Google Sign-In integration + Email/Password).

### Module Isolation (Component Hierarchy)
* `/src/components/ui/` - Abstracted, reusable visual elements (Cards, Buttons, Dialogs, Bento Boxes).
* `/src/components/layout/` - Structural shell components (Sidebar, BottomNav, Topbar).
* `/src/views/` - Dedicated route view pages representing distinct personas.
* `/src/lib/` - Service instances (Firebase config, utility helpers).
* `/src/hooks/` - Isolated state logic avoiding unnecessary React DOM re-renders.

---

## 3. Visual Design System & Aesthetics (Tactile Modernist)

We enforce a strict "Tactile Modernist" aesthetic combining high data density with a premium, consumer-grade feel.

### Typography (The "Vibe")
*   **Display (Headers/Macros):** `Space Grotesk` (Modern, geometric, instantly recognizable).
*   **Body (UI Text/Microcopy):** `Inter` (Highly legible, neutral scale).
*   **Data (Vitals/Code/Metrics):** `JetBrains Mono` (Technical, precise alignment, brutalist accents).

### Color & Theming (Emerald & Slate)
*   **Base:** `Slate-50` (`#f8fafc`) background for clean, high-contrast layouts.
*   **Cards:** Pure white (`#ffffff`) with subtle, multi-layered shadows (`shadow-sm`, `shadow-md` on hover).
*   **Primary Brand:** Emerald Green (`#10b981`) and deep Teal gradients – conveying health, trust, and growth.
*   **Accent/AI Elements:** Deep Indigo (`#4f46e5`) bridging intelligence and technology.

### Structural Styling Tokens
*   **Bento Grid Architecture:** Heavily utilizing CSS Grid (`grid-cols-1 md:grid-cols-3 xl:grid-cols-4`) to form fluid "Bento Boxes". This displays multiple tools simultaneously without scattered lists.
*   **Border Radii:** Universal `rounded-2xl` on large layout containers, `rounded-lg` on inner interactive elements.
*   **Glassmorphism:** Strategic use of `backdrop-blur-md bg-white/70` for sticky headers or floating action panels to preserve context underneath.

### Hardware-Accelerated Micro-Interactions (Framer Motion)
*   **Page Transitions:** Smooth 0.2s fade and subtle up-slide when switching routes.
*   **Hover States:** `hover:-translate-y-1 hover:shadow-lg transition-all duration-300`.
*   **Tap Feedback:** Physical feedback scaled at `whileTap={{ scale: 0.98 }}` for all primary buttons.
*   **Staggered Lists:** Loading queues (like the patient Flowboard) animate in item-by-item rather than flashing onto the screen abruptly.

---

## 4. Full Functional Blueprint & User Roles

### Auth & Identity Gateway
*   **Google OAuth Login:** Clean, one-click sign-in via Firebase Auth explicitly designed into the `LoginView`.
*   **Role Identification:** Once authenticated, the app reads the `users` collection to check role claims, seamlessly routing the user to their specific workspace.

### Workspace 1: Pet Owner Dashboard (The "Health Halo")
*   **Pet Profiles Bento:** Visual cards outlining vitals, vaccination dates, and weight trends.
*   **AI-Assisted Booking Portal:** A smooth, wizard-like flow linking directly to clinic availability.
*   **Real-time Status Feed:** Push notifications updating the owner when their pet is in surgery, recovery, or ready for pickup.

### Workspace 2: Clinician Command (Flowboard)
*   **Spatial Triage Queue:** 3-column kanban board (Waiting, Active, Completed).
*   **Aura AI Briefings:** Selecting a patient dynamically fetches the last 3 visit records and uses the backend Gemini API to synthesize an instant overview.
*   **Smart SOAP Engine (One-Click Charting):** Dedicated interface enabling clinicians to generate Subjective, Objective, Assessment, and Plan notes instantly derived from shorthand inputs.
*   **Diagnostic Media Suite:** Multimodal image uploads (e.g., X-rays, rashes) routed to specialized AI models for second opinions.

### Workspace 3: Administrator Command (Ops Center)
*   **Live Analytics:** Dashboards mapping patient volume and wait times powered by `recharts`.
*   **Surge Predictors:** Real-time capacity alerts monitoring clinical throughput efficiency.

---

## 5. Development & Deployment Integration Plan for zool.info

### Infrastructure & Pipeline
1.  **Server Architecture:** The Node.js Express server is configured as the singular entry point, serving static Vite assets (`/dist`) while masking secure routes (`/api/gemini`) to proxy interactions seamlessly.
2.  **Container Bindings:** Application explicitly binds to `process.env.PORT || 3000` to conform to PaaS/Cloud Run routing requirements.
3.  **DNS & Ingress:** Mapping `zool.info` to the production Cloud Run instance using A/CNAME records.

### Security & AI Configuration
*   **Firestore Hardening:** Implementing strict Security Rules ensuring users can only read their own data (`request.auth.uid == userId`) unless they hold a clinician or admin claim.
*   **Gemini Context Isolation:** Prompts constructed on the backend append strict system instructions ("You are Aura, a veterinary AI... Do not prescribe medication without human review"), enforcing AI guardrails.

### CI/CD Deployment Flow
*   **Pre-commit:** Enforced by local `eslint`.
*   **Build Chain:** `vite build && esbuild server.ts`.
*   **CD Automation:** GitHub Actions monitor the `main` branch, automatically building and swapping containers upon success for zero-downtime deployments.
