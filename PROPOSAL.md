# Cost-Effective Logging Mechanism Proposal

## Current Architecture Analysis (`geminiService.ts`)
Currently, `geminiService.ts` does not centralize AI interaction logging (prompts, responses, tokens) to an external database or analytics service. Rate limiting and usage are tracked synchronously via `localStorage` with a simple counter (`localStorage.setItem(USAGE_KEY, ...)`). For any cloud-based telemetry, writing every single request to a database (Firestore/Cloud Logging) individually would incur high write costs, and tracking complete token-heavy chat histories would consume excessive bandwidth and storage.

Specifically for **chat sessions** (`getChatSession`) and **symptom analysis** (`analyzeSymptoms`):
- `getChatSession` uses the SDK's built-in chat history, which can grow infinitely and consume massive token quotas and logging space if we were to log the entire transcript per turn.
- `analyzeSymptoms` can process large multimodal (image + text) inputs, leading to large base64 logs if blindly recorded.

## Proposed Modifications for Batching and Summarizing Logs

### 1. In-Memory Batching Queue
Instead of logging to a database (or local storage for analytics) on every API request, push interaction metadata (timestamp, feature name, token estimate) into an in-memory queue.
- **Trigger:** Flush the queue to the backend (e.g., Firestore) only when the queue size reaches `N` (e.g., 10 items) or after a specific interval using a debounced write.

### 2. Conversation Summarization (For Chat)
For `getChatSession`, to reduce token costs on the Gemini API *and* logging costs:
- When a chat exceeds `X` turns, use a lightweight, low-cost Gemini model (like Flash-Lite) to summarize the previous context into a single dense paragraph. 
- Replace the older messages in the history array with this summary.
- Log the summarized session state rather than every individual user/bot message.

### 3. Payload Stripping (For Symptom Analysis & General)
- Do not log `imageBase64` or raw `transcript` strings. Log a hashed fingerprint or simple boolean `hasImage: true` to save on database storage costs and avoid PII leaks.
- Extract intent tags (e.g., `feature: symptom-analysis`, `severity: high`) instead of raw prompts.

### 4. Implementation details for `geminiService.ts`
Implement `logAInteractionBatch` that will be called in `checkLimits` or individual API methods.

```typescript
interface AILogBatch {
  feature: string;
  tokensEstimated: number;
  timestamp: string;
  success: boolean;
  model: string;
}

const interactionQueue: AILogBatch[] = [];
let batchTimeout: NodeJS.Timeout | null = null;

export const logAInteractionBatch = (log: AILogBatch) => {
  interactionQueue.push(log);
  
  if (interactionQueue.length >= 10) {
    flushAILogs();
  } else if (!batchTimeout) {
    batchTimeout = setTimeout(flushAILogs, 15000); // Flush every 15 seconds
  }
};

const flushAILogs = async () => {
  if (interactionQueue.length === 0) return;
  const batchToUpload = [...interactionQueue];
  interactionQueue.length = 0; // clear
  if (batchTimeout) { clearTimeout(batchTimeout); batchTimeout = null; }
  
  // Example: Group by feature over the batch period to compress before sending
  const summary = batchToUpload.reduce((acc, curr) => {
    acc[curr.feature] = (acc[curr.feature] || 0) + curr.tokensEstimated;
    return acc;
  }, {} as Record<string, number>);

  try {
    // Send payload to backend instead of N individual documents
    console.log("Flushed batched AI logs summary: ", summary);
  } catch (error) {
    console.error("Batch log failed", error);
  }
};
```
