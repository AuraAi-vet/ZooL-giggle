# ZooL Phase 2: Complete Functional Blueprint & AI Optimization Plan

This document outlines the strategy for the next phase of ZooL's development, specifically focusing on hybridizing AI features, optimizing costs, reducing API dependency, and efficiently grouping Gemini models.

---

## 1. Gemini Model Assignments & Tiering

To maximize performance while minimizing costs, features are mapped to specific Gemini models based on their complexity requirements.

| Feature | Recommended Model | Rationale & Configuration |
| :--- | :--- | :--- |
| **RuRu Live Assistant** | `gemini-2.5-flash` / `gemini-1.5-flash` | Lowest latency, cheapest per token. High volume, conversational. Use restricted `maxOutputTokens: 200` to prevent runaway generation. |
| **Quick Log Summarizer** | `gemini-2.5-flash` | Batch processes background data. Use `temperature: 0.2` for deterministic, brief summaries. |
| **Diagnostic Tool (Text)** | `gemini-1.5-pro` | Requires deep reasoning and accurate medical context. Higher cost, gated behind stricter usage limits or Premium. |
| **Biospatial Radar (Vision)**| `gemini-1.5-pro` | Required for multi-modal analysis (X-rays, wound images, stool analysis). |

---

## 2. Google Grounding Integration (Low Cost & High Performance)

Grounding should **not** be globally enabled to save the integration cost. It should be dynamically injected only when necessary.

**A. Google Search Grounding (`googleSearchRetrieval`)**
*   **Use Cases:** SOS Poisoning, newly discovered regional animal diseases (e.g., local parvovirus outbreaks, recall of certain dog foods).
*   **Cost Saver Strategy:** Only trigger if the initial local heuristic detects keywords like *crisis, outbreak, poison, recall, emergency*.

**B. Google Maps Platform (Places/Routes API)**
*   **Integration:** Instead of using the Gemini API to "guess" local vets, bypass the LLM and use a direct lightweight Google Maps Places query for `<user_location> 24/7 veterinary clinic`.
*   **Benefit:** Zero hallucination, fractions of a cent compared to an LLM token query, instant loading.

---

## 3. Cost Optimization & Limiters (API Reduction)

We will implement a layered architecture to protect against excessive API use.

### A. The "Local First, AI Second" Architecture
1.  **Rule-Based Interceptors:** Use Regex and keyword matching. If the user asks "How much water should my dog drink?", intercept locally.
    *   *Local Fallback:* `(Dog Weight in kg) * 50-60ml = Daily Water`. Display immediately. Zero API cost.
2.  **Vector Caching / IndexedDB:** Store past AI interactions locally via `localForage`. If the query has >90% text similarity to a cached query (e.g., "what to feed dog with upset stomach"), serve the cached response instantly.

### B. Functional Usage Limiters
*   **Token Caps:** Hardcode `maxOutputTokens` for all non-diagnostic chat interactions to 150-250 tokens.
*   **Debouncing & Throttling:** The Live Assistant will require the user to stop typing for 1.5 seconds before sending an API request.
*   **Tiered Daily Quotas (Firebase Enforced):**
    *   *Free Tier:* 10 Standard RuRu Messages/day, 1 Diagnostic Scan/week.
    *   *Premium Tier:* Unlimited Standard, 10 Diagnostic Scans/day.

---

## 4. Blueprint to Bypass APIs (Functional Alternatives)

To lower reliance on AI, core features will be rewritten to function completely offline or using deterministic logic.

### Alternative Feature Development Blueprint:

#### 1. Preventive Care & Reminders
*   **Current State:** AI suggests vaccines. (High Cost, slow).
*   **Optimized Approach:** Use static JSON tables based on the WSAVA (World Small Animal Veterinary Association) guidelines. The app calculates ages locally against the JSON matrix and triggers local push notifications. AI is only used to explain *why* the vaccine is important if the user hits "Learn More."

#### 2. Breed Intelligence & Analytics
*   **Current State:** Generates stats dynamically per breed.
*   **Optimized Approach:** Pre-compile a `breed-database.json` via AI *once* during development. The app queries the local JSON file. Instant load times, 0 API usage.

#### 3. Diagnostic Tool (Triage Level)
*   **Current State:** Sends all symptoms out to Gemini Pro.
*   **Optimized Approach (Decision Trees):** Build a local interactive "Triage Decision Tree". 
    *   *Is the pet breathing heavily? -> Are gums blue? -> Emergency.* 
    *   Only if the decision tree fails to map the overlapping symptoms, it passes the context to Gemini Pro for the final difficult assessment.

#### 4. Weight Chart & Heat mapping
*   **Current State:** Relying on AI to interpret weight curves.
*   **Optimized Approach:** Use mathematical interpolations locally (moving averages, Body Condition Score formulas). We only send the *delta* (e.g., "-10% body weight in 2 weeks") to the LLM to get a "concern statement."

---

## 5. Next Phase Roadmap Integration

1.  **Local Context Hub Phase:** Implement the Local Heuristics engine (`src/services/localIntelligence.ts`) replacing 40% of standard API hits with math and JSON lookups.
2.  **Tiered Gatekeeper Phase:** Hook up Firebase Firestore usage counters to enforce the 10-message limits and switch UI states to "Premium Required".
3.  **Grounding Trigger Phase:** Refactor the Chat/SOS modules to parse intent *locally* and only append `googleSearchRetrieval` tools if the urgency requires external web knowledge.
4.  **Community & Vets Phase (WebRTC/WebSockets):** Transition the vet dashboard to use standard real-time DB listeners instead of LLM-summarized patient dashboards.
