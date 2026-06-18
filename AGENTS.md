# ZooL Agent Guidelines & Conventions

These guidelines are automatically loaded as instructions for all AI models and agents working on ZooL. Ensure all implementations strictly adhere to these design and functional boundaries.

---

## 🚀 Cost & API Safeguards (Crucial)

### 1. Gemini API Mitigation Protocols
* **High-Demand Handling**: Always handle `503 Unavailable` or `429 Quota Exhausted` errors from the Gemini API. Return high-quality, clinical-fallback static suggestions and insights gracefully without throwing runtime UI errors.
* **Pruning and Optimization**: Pushes to Gemini must be compressed using `PromptOptimizer` or utility functions like `pruneFillerText` to reduce token overhead.

### 2. Stripe Payments Paused (Trial Launch Phase)
* **Status**: **Payments are paused** until post-trial evaluation.
* **Direct Booking**: All bookings must skip Stripe session creations (`/api/create-checkout-session`) and instantly persist to Firebase/local-storage as complimentary premium trials. 
* **UI Indicator**: Maintain high-visibility "🎁 ZooL Trial Mode Active" indicators with clear alerts to build trust.

---

## 🗺️ Interactive Maps & Services Locator
* **Default Display**: The interactive Services locator map is enabled by default (`showMap = true`) to locate vets, groomers, pharmacies, and hotels nearby.
* **Map Sizing & Responsiveness**: Map and canvas components must adapt dynamically to screen size variations using native `ResizeObserver` callbacks or tailwind layouts rather than fixed viewport width percentages.

---

## 📊 Administrative Observability (Telemetry)
* **Cost Optimization Hub**: Maintain the interactive **AI Token & Credit Telemetry** hub inside `/src/views/AdminDashboardView.tsx`.
* **Visualizations**: Use **Recharts** Area and Bar charts to display pre-optimized character counts, transmitted parameters, and daily credit caps.
* **Interactive Sandbox**: Maintain the live prompt compression playground allowing interactive testing of compression margins.
