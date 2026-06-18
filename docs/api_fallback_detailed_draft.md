# Detailed Draft: AI API Quota Management & Fallback Architecture

This document provides an in-depth analysis of methodologies to handle API limits (e.g., Gemini Quota Exceeded) while maintaining the operational integrity of the ZooL veterinary platform. It details implementation steps, impacts on app functionality and performance, and the observable outcomes for each method.

---

## 1. Local Fallback Triage Systems (Hardcoded Heuristics)

### **What is to be done:**
Create a robust, localized TypeScript service containing decision trees, regular expressions, and keyword-matching arrays focused strictly on veterinary emergencies (e.g., "bleeding", "collapse", "choking", "seizure"). The system intercepts user queries when the primary AI API fails or reaches its limits and cross-references the input against this local dictionary.

### **How it affects and reduces app function/performance:**
- **App Function:** AI intelligence is severely reduced. The app loses the ability to understand context, nuance, or complex multi-symptom descriptions. It operates strictly on a keyword basis, meaning it might trigger "emergency mode" for non-emergencies (e.g., "my dog is not choking") because it lacks semantic understanding. 
- **Performance:** App performance **improves**. Keyword matching is executed synchronously in less than a millisecond on the client-side, using virtually zero processing power and entirely bypassing network latency.

### **What will happen on implementation:**
If the AI quota is hit and a user types "My dog ate chocolate and is vomiting":
1. The API request is blocked or fails.
2. The local triage script processes the string, identifying the critical keywords "chocolate" and "vomiting".
3. The app instantly renders a hardcoded emergency protocol in the UI, legally advising the user to contact an emergency vet without making a network call.

---

## 2. Advanced Client-Side SLMs (WebLLM / WebGPU)

### **What is to be done:**
Integrate a small, locally-run AI model directly into the browser using WebAssembly and WebGPU (via libraries like Apache TVM or Transformers.js). A quantized version of a model (like Phi-3 Mini or Llama 3 8B) is downloaded and cached in the user's browser.

### **How it affects and reduces app function/performance:**
- **App Function:** Maintains a high level of semantic understanding compared to hardcoded heuristics. The local AI can still converse and reason, though it lacks the deep medical knowledge base and reasoning capabilities of massive cloud models like Gemini 3.1 Pro. The answers will be more generic.
- **Performance:** **Massive performance degradation on initial load and low-end devices.** Over 1-3 GB of model weights must be downloaded and cached by the client. Running the AI inference on the user's local hardware (GPU/CPU) will heavily consume their device battery, increase thermal output, and potentially cause UI stuttering on older mobile phones.

### **What will happen on implementation:**
When the quota hits:
1. The app detects the failure.
2. If the user's device supports WebGPU and the model is cached, it seamlessly routes the prompt to the local model.
3. The user experiences a slight delay in token generation (slower typing speed), and their device might get warm, but they receive a coherent, AI-generated response without cloud reliance.

---

## 3. Asynchronous Queue Processing (Deferred Tasks)

### **What is to be done:**
Implement a task queue messaging architecture (e.g., Firebase Cloud Tasks or Google Cloud Pub/Sub). Separate app requests into "Synchronous/Critical" (must be answered now) and "Asynchronous/Non-Critical" (can wait). Limit synchronous calls to strict daily caps.

### **How it affects and reduces app function/performance:**
- **App Function:** Modifies the user experience specifically for non-essential features (e.g., deep historical health record summarization, non-urgent diet plan generation). The app loses "instant gratification" for these features.
- **Performance:** Improves frontend responsiveness. Instead of the user staring at a loading spinner for 30 seconds while an API struggles with rate limits, the app immediately confirms the request and frees the UI thread. The system processes the request during off-peak hours (like midnight) when quotas reset or batch processing is cheaper.

### **What will happen on implementation:**
If a user requests a "Comprehensive 3-year health milestone summary":
1. Instead of loading, the UI displays: *"Your long-term health summary has been added to the processing queue to ensure highest accuracy. It will be delivered to your AI Vault within 12 hours."*
2. The task is processed overnight.
3. The user receives a push notification when the AI generation is complete.

---

## 4. Persistent Semantic Caching

### **What is to be done:**
Implement a vector database (like Pinecone, Weaviate, or pgvector) combined with an embedding service. When a question is asked (e.g., "Are grapes toxic to dogs?"), the system converts the text to a dense vector, searches the cache for closely matching past questions (e.g., >0.95 similarity), and returns the previously generated answer.

### **How it affects and reduces app function/performance:**
- **App Function:** No noticeable reduction in function for FAQ-style questions. However, the app loses personalization; the answer will be identical to the cached version and won't reference the user's specific pet name or context unless post-processed.
- **Performance:** Hugely improves performance and cost. Vector lookups take ~20-50ms, compared to the 1000ms+ generation time of an LLM. It completely bypasses token generation costs for repeated queries.

### **What will happen on implementation:**
A user asks a highly common veterinary question. The API gateway creates the vector, finds an exact semantic match in the cache, and instantly returns the cached string. No LLM generation occurs. The user gets an immediate, high-quality answer.

---

## 5. Graceful Functional Degradation (UI Lockout / Offlining)

### **What is to be done:**
Design the UI to logically decouple AI features from core utility features. Implement global state listeners for the API limit thresholds. When limits are reached, physically disable AI-generation buttons, swap complex AI components for static informational banners, and redirect users to manual workflows.

### **How it affects and reduces app function/performance:**
- **App Function:** The app temporarily stops being an "AI platform" and reverts to a traditional SAAS utility app. Users cannot use chat, automated symptom triage, or document OCR extraction. However, they CAN still book appointments, access saved health records manually, and message their actual mapped veterinarian.
- **Performance:** The app remains fully fast and stable, avoiding cascading timeout errors or frozen screens caused by blocked network requests. 

### **What will happen on implementation:**
When the quota flags as Exhausted:
1. The AI Chatbot input field greys out, locking user input.
2. A clear, branded banner appears: *"Cost Optimization Protocol: ZooL AI has reached its maximum daily compute threshold to maintain secure operations. Core features (Records, Clinic Bookings) remain active. AI assistance will resume at 00:00. In an emergency, use the SOS Veterinary Uplink."*
3. The experience remains transparent, professional, and protects the user from silent failures.
