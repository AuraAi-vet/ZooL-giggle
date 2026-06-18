import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { HealthRecord, PatientSnapshot, ProactiveSuggestion, Pet, Appointment, PublicAlert } from "../types";
import { getLocalFallbackResponse, analyzeQueryLocally } from "./localTriage";
import { generateLocalReminders, LocalSuggestion } from "./localIntelligence";
import { PromptOptimizer } from "../utils/promptOptimizer";

import { MAX_DAILY_CREDITS_FREE, MAX_DAILY_CREDITS_PREMIUM, AI_COST } from "../constants";
import { useStore } from "../store/useStore";

export const getMaxDailyCredits = () => {
  const profile = useStore.getState().userProfile;
  return profile?.isPremium ? MAX_DAILY_CREDITS_PREMIUM : MAX_DAILY_CREDITS_FREE;
};


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Optimizes AI prompts by minifying JSON and stripping common filler words
 * to reduce token consumption and improve latency.
 */
export const optimizeContext = (context: any): string => {
  if (!context) return "";
  
  if (typeof context === 'object') {
    // Check if the payload contains pets or records lists
    if (context.pets || context.records || Array.isArray(context) || ('name' in context && 'breed' in context)) {
      try {
        let pets: Pet[] = [];
        let records: HealthRecord[] = [];
        
        if (Array.isArray(context)) {
          pets = context.filter(item => 'breed' in item);
          records = context.filter(item => 'clinicalNotes' in item || 'description' in item);
        } else if (context.pets || context.records) {
          pets = context.pets || [];
          records = context.records || [];
        } else if ('breed' in context) {
          pets = [context];
        } else if ('clinicalNotes' in context || 'description' in context) {
          records = [context];
        }

        if (pets.length > 0 || records.length > 0) {
          const stats = PromptOptimizer.getOptimizationStats({ pets, records });
          const minified = PromptOptimizer.minifyPatientContext(pets, records);
          const legend = PromptOptimizer.getOptimizedMappingLegend();
          console.log(`[PromptOptimizer] Saved ${stats.percentSavings}% of tokens (${stats.originalChars} -> ${stats.compressedChars} chars)`);
          return `${legend}\n${minified}`;
        }
      } catch (err) {
        console.error("PromptOptimizer failed, falling back to basic optimization:", err);
      }
    }

    return JSON.stringify(context, (key, value) => {
      // Remove empty or null fields to save tokens
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        return undefined;
      }
      if (typeof value === 'string') {
        const str = value.replace(/\s+/g, ' ').trim();
        return str.replace(/\b(a|an|the|is|are|was|were|and|or|but|if|of|to|in|for|with|on|at|by|from)\b\s?/gi, '');
      }
      return value;
    });
  }
  
  return String(context)
    .replace(/\s+/g, ' ')
    .replace(/\b(a|an|the|is|are|was|were|and|or|but|if|of|to|in|for|with|on|at|by|from)\b\s?/gi, '')
    .trim();
};

export type AIPersona = 'doctor' | 'nutritionist' | 'behaviorist';

const getCache = (key: string) => {
  const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
  if (cached) {
    try {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) return data;
    } catch (e) {
      console.error("Cache parsing error", e);
    }
  }
  return null;
};

export const setCache = (key: string, data: any, ttlMs: number = 48 * 60 * 60 * 1000) => {
  localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({ 
    data, 
    expiry: Date.now() + ttlMs 
  }));
};

export const invalidateCacheByKeyPrefix = (prefix: string) => {
  const fullPrefix = CACHE_KEY_PREFIX + prefix;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(fullPrefix)) {
      localStorage.removeItem(key);
    }
  });
};
const embedCache = new Map<string, number[]>();
const lastRequestTimes = new Map<string, number>();

const normalizeQuery = (q: string) => q.toLowerCase().trim().replace(/\s+/g, ' ');

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString(36);
};

/**
 * Robust JSON parser with cleanup for AI-generated text.
 */
export const safeJSONParse = (text: string, fallback: any = {}) => {
  if (!text) return fallback;
  
  // Remove possible markdown wrappers
  let cleaned = text.replace(/```json/ig, '').replace(/```/g, '').trim();
  
  // Basic truncation repair
  if (cleaned.startsWith('[') && !cleaned.endsWith(']')) {
    // If it's an array and truncated, try to close the last object and the array
    if (cleaned.includes('},')) {
      cleaned = cleaned.substring(0, cleaned.lastIndexOf('},') + 1) + ']';
    } else {
      cleaned += ']';
    }
  } else if (cleaned.startsWith('{') && !cleaned.endsWith('}')) {
    cleaned += '}';
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Second pass repair for common multiline string errors
    try {
      // Replace unescaped newlines within quotes
      const repaired = cleaned.replace(/"([^"]*)"/g, (match) => {
        return match.replace(/\n/g, '\\n');
      });
      return JSON.parse(repaired);
    } catch (e2) {
      console.warn("safeJSONParse failed:", cleaned.slice(-50));
      return fallback;
    }
  }
};

// --- EMBEDDINGS TOOLING ---

export const getEmbedding = async (text: string): Promise<number[]> => {
  if (!text) return [];
  if (embedCache.has(text)) return embedCache.get(text)!;

  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: text,
    });
    const values = response.embeddings?.[0]?.values || [];
    if (values.length > 0) {
      embedCache.set(text, values);
      if (embedCache.size > 200) embedCache.delete(embedCache.keys().next().value!);
    }
    return values;
  } catch (err) {
    console.error("Embedding error:", err);
    return [];
  }
};

export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const semanticSearch = async (query: string, corpus: string[], topK: number = 3): Promise<{ text: string, score: number }[]> => {
  if (!query || !corpus || corpus.length === 0) return [];
  try {
    const queryEmbed = await getEmbedding(query);
    if (!queryEmbed || queryEmbed.length === 0) return [];

    const scored = await Promise.all(corpus.map(async (text) => {
      const e = await getEmbedding(text);
      return { text, score: cosineSimilarity(queryEmbed, e) };
    }));

    return scored
      .filter(item => item.score > 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (error) {
    console.error("Semantic search failed:", error);
    return [];
  }
};

// --- USAGE TRACKING ---
export const USAGE_KEY = 'zool_ai_usage';
const CACHE_KEY_PREFIX = 'zool_ai_cache_';

export enum AICost {
  LITE = AI_COST.LITE,
  STANDARD = AI_COST.STANDARD,
  GROUNDING_SEARCH = AI_COST.GROUNDING_SEARCH,
  GROUNDING_MAPS = AI_COST.GROUNDING_MAPS,
  HEAVY_REASONING = AI_COST.HEAVY_REASONING,
  IMAGE_ANALYSIS = AI_COST.IMAGE_ANALYSIS
}

// --- BATCH LOGGING MECHANISM FOR COST-EFFECTIVE TELEMETRY ---
export interface AILogBatch {
  feature: string;
  tokensEstimated: number;
  timestamp: string;
  success: boolean;
  model: string;
  costCredits?: number;
  conversationId?: string;
}

const interactionQueue: AILogBatch[] = [];
let batchTimeout: NodeJS.Timeout | null = null;

export const flushAILogs = async () => {
  if (interactionQueue.length === 0) return;
  const batchToUpload = [...interactionQueue];
  interactionQueue.length = 0; // clear
  if (batchTimeout) { clearTimeout(batchTimeout); batchTimeout = null; }

  try {
    if (!auth?.currentUser) {
      console.warn("Telemetry: Skipped batched AI logs flush; user not authenticated.");
      return;
    }
    
    // Write all events in the queue in a single batch operation rather than individual document writes to Firestore
    const batch = writeBatch(db);
    
    batchToUpload.forEach((log) => {
      const logRef = doc(collection(db, 'aiInteractionLogs'));
      batch.set(logRef, {
        userId: auth.currentUser?.uid || 'anonymous',
        feature: log.feature,
        tokensEstimated: log.tokensEstimated,
        timestamp: serverTimestamp(),
        success: log.success,
        model: log.model,
        costCredits: log.costCredits || 0,
        conversationId: log.conversationId || '',
        buffered: true
      });
    });

    await batch.commit();
    console.log(`Telemetry: Successfully flushed ${batchToUpload.length} AI interaction logs in a single batch operation.`);
  } catch (error) {
    console.error("Batch log flush failed", error);
  }
};

export const logAIInteraction = (log: AILogBatch) => {
  interactionQueue.push(log);
  if (interactionQueue.length >= 10) {
    flushAILogs();
  } else if (!batchTimeout) {
    batchTimeout = setTimeout(flushAILogs, 15000); // Flush every 15s
  }

  try {
    const usage = getUsage();
    usage.tokensUsed = (usage.tokensUsed || 0) + log.tokensEstimated;
    if (!usage.history) usage.history = [];
    usage.history.unshift(log);
    // Keep max 50 items in history to avoid huge localStorage size
    if (usage.history.length > 50) usage.history = usage.history.slice(0, 50);
    
    if (usage.features && log.feature && usage.features[log.feature]) {
      usage.features[log.feature].tokens = (usage.features[log.feature].tokens || 0) + log.tokensEstimated;
    }
    
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
    window.dispatchEvent(new CustomEvent('ai-usage-updated'));
  } catch (err) {}

  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ai_interaction', {
        'event_category': 'AI Feature Usage',
        'event_label': log.feature,
        'value': log.tokensEstimated,
        'is_success': log.success,
        'model': log.model
      });
    }
  } catch (err) {
    // Analytics failure shouldn't crash app
  }
};

/**
 * In-memory batch logging mechanism for cost-effective AI telemetry.
 * Accumulates AI logs and flushes them to Firestore after 10 items or 15 seconds.
 */
export const logAInteractionBatch = (log: AILogBatch) => {
  logAIInteraction(log);
};
// ------------------------------------------------------------------

export interface UsageData {
  date: string;
  count: number;
  creditsUsed: number;
  tokensUsed: number;
  features?: Record<string, { count: number, cost: number, tokens?: number }>;
  history?: AILogBatch[];
}

export const getUsage = (): UsageData => {
  try {
    const data = localStorage.getItem(USAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (!parsed.features) parsed.features = {};
      if (!parsed.tokensUsed) parsed.tokensUsed = 0;
      if (!parsed.history) parsed.history = [];
      return parsed;
    }
  } catch (e) {}
  return { date: new Date().toISOString().split('T')[0], count: 0, creditsUsed: 0, tokensUsed: 0, features: {}, history: [] };
};

export const resetUsage = () => {
  localStorage.setItem(USAGE_KEY, JSON.stringify({ date: new Date().toISOString().split('T')[0], count: 0, creditsUsed: 0, tokensUsed: 0, features: {}, history: [] }));
};

export const simulateMaxUsage = () => {
  const max = getMaxDailyCredits();
  localStorage.setItem(USAGE_KEY, JSON.stringify({ date: new Date().toISOString().split('T')[0], count: 100, creditsUsed: max, features: { 'simulation': { count: 100, cost: max } } }));
};

export const checkLimits = (key: string, cost: AICost = AICost.STANDARD, limitMs: number = 3000): { allowed: boolean; reason?: 'RATE_LIMIT' | 'DAILY_CAP' } => {
  const now = Date.now();
  const last = lastRequestTimes.get(key) || 0;
  
  // Throttle rapidly repeating requests to save costs
  if (now - last < limitMs) {
    console.warn(`RuRu AI: Rate limit hit for ${key}. Requested ${now - last}ms after last.`);
    return { allowed: false, reason: 'RATE_LIMIT' };
  }
  
  // Daily hard cap limit protocol
  const usage = getUsage();
  const today = new Date().toISOString().split('T')[0];
  if (usage.date !== today) {
    usage.date = today;
    usage.count = 0;
    usage.creditsUsed = 0;
    usage.features = {};
  }
  
  if (usage.creditsUsed + cost > getMaxDailyCredits()) {
    console.warn("RuRu AI: Daily credit budget exceeded. Cost optimization protocol engaged.");
    return { allowed: false, reason: 'DAILY_CAP' };
  }
  
  usage.count += 1;
  usage.creditsUsed += cost;
  if (!usage.features) usage.features = {};
  if (!usage.features[key]) usage.features[key] = { count: 0, cost: 0 };
  usage.features[key].count += 1;
  usage.features[key].cost += cost;

  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
    window.dispatchEvent(new CustomEvent('ai-usage-updated'));
  } catch (e) {}
  
  lastRequestTimes.set(key, now);
  return { allowed: true };
};

export const isDailyLimitReached = (): boolean => {
  const usage = getUsage();
  const today = new Date().toISOString().split('T')[0];
  if (usage.date !== today) return false;
  return usage.creditsUsed >= getMaxDailyCredits();
};

/**
 * Look-up dictionary mapping verbose symptom descriptions to concise, highly specific
 * clinical terms. Saves significant token overhead before sending payloads to Gemini.
 */
export const CLINICAL_SHORT_TOKENS: Record<string, string> = {
  "scratching constantly": "persistent pruritus",
  "constant scratching": "persistent pruritus",
  "scratching a lot": "persistent pruritus",
  "severe itching": "severe pruritus",
  "scratching": "pruritus",
  "itching": "pruritus",
  "itchy": "pruriginous",
  "losing hair": "alopecia",
  "hair loss": "alopecia",
  "bald patch": "focal alopecia",
  "bald spot": "focal alopecia",
  "watery eyes": "epiphora",
  "runny eyes": "epiphora",
  "bad breath": "halitosis",
  "foul mouth odor": "halitosis",
  "throwing up": "emesis",
  "vomiting": "emesis",
  "very lazy": "lethargy",
  "feeling lazy": "lethargy",
  "extremely tired": "severe lethargy",
  "lethargic": "lethargy",
  "energy loss": "lethargy",
  "tiredness": "lethargy",
  "not eating": "anorexia",
  "refusing food": "anorexia",
  "loss of appetite": "anorexia",
  "difficulty breathing": "dyspnea",
  "hard to breathe": "dyspnea",
  "breathing heavily": "dyspnea-tachypnea",
  "panting heavily": "dyspnea-tachypnea",
  "red skin": "erythema",
  "red patch": "erythematous lesion",
  "redness": "erythema",
  "swelling": "edema",
  "swollen leg": "limb edema",
  "swollen paw": "paw edema",
  "swollen face": "facial edema",
  "swollen": "edema",
  "limping": "lameness",
  "stiff walk": "gait-stiffness",
  "gasping for air": "stridor",
  "coughing": "tussis",
  "sneezing": "sternutatio",
  "runny nose": "rhinorrhea",
  "shaking uncontrollably": "motor tremors",
  "shaking": "tremor",
  "trembling": "tremor",
  "runny poop": "diarrhea",
  "loose motion": "diarrhea",
  "watery poop": "watery diarrhea",
  "blood in stool": "hematochezia",
  "bloody poop": "hematochezia",
  "blood in vomit": "hematemesis",
  "bloody vomit": "hematemesis",
  "hot to touch": "hyperthermia",
  "fever": "pyrexia",
  "bad smell": "malodor",
  "smelly": "malodorous",
  "dry skin": "xerosis",
  "peeling skin": "desquamation",
  "lick constantly": "obsessive licking",
  "licking constantly": "obsessive licking",
  "licking his paw": "paw-licking",
  "licking her paw": "paw-licking"
};

/**
 * Maps verbose caregiver symptoms and clinical synonyms to short clinical tokens
 * to reduce overall token usage.
 */
export const minifyClinicalTerms = (text: string): string => {
  if (!text) return "";
  let minified = text.toLowerCase();
  
  // Dynamic regex replacement mapping longer terms first to avoid partial matching collision
  const sortedEntries = Object.entries(CLINICAL_SHORT_TOKENS).sort((a, b) => b[0].length - a[0].length);
  for (const [verbose, short] of sortedEntries) {
    const escaped = verbose.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    minified = minified.replace(regex, short);
  }
  return minified;
};

export interface SymptomAnalysis {
  assessment: string;
  severity: 'low' | 'medium' | 'high' | 'emergency';
  findings: string[];
  recommendations: string[];
  suggestedSpecialist?: string;
  isVisualAnalysis: boolean;
}

const SYMPTOMS_SYSTEM_INSTRUCTION = "You are the ZooL Multimodal Diagnostic Engine: Senior Veterinary Specialist. Analyze pet health information to detect clinical markers. Clinical values/symptoms may be compressed to short veterinary tokens (e.g., pruritus, alopecia, epiphora, emesis, lethargy, anorexia, dyspnea, erythema). Decode and interpret these shorthand tokens properly in your structured clinical assessment. Your analysis must be structured and prioritize emergency triage. IMPORTANT SAFETY DIRECTIVE: DO NOT provide definitive medical diagnoses or prescribe treatments. Always state that this is an AI screening. For any signs of severe pain, respiratory distress, heavy bleeding, neurological issues, or if a lesion appears necrotic or ulcerated, declare SEVERITY: 'high' or 'emergency' and strongly advise the user to contact emergency veterinary services IMMEDIATELY. IMPORTANT: Keep in mind the context is India. Be aware of local environmental factors (e.g., intense heat, monsoon seasons, and how they impact pet health/common diseases like Tick Fever or Parvovirus).";

export const LIMIT_REACHED_MSG = "RuRu AI has reached its daily query limit. Please try again tomorrow.";

/**
 * Purpose: Medical triage and multimodal symptom analysis.
 * Logic: Specialized prompts for dermatological, ocular, and musculoskeletal visual assessment.
 */
export const analyzeSymptoms = async (symptoms: string, petInfo: string, imageBase64?: string): Promise<SymptomAnalysis | null> => {
  const prunedSymptoms = minifyClinicalTerms(symptoms);
  const prunedPetInfo = minifyClinicalTerms(petInfo);
  
  const contentHash = hashString(prunedSymptoms);
  const cacheKey = `analyzeSymptoms-${contentHash}-${hashString(prunedPetInfo)}-${imageBase64?.slice(-50)}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // PRIMARY LOCAL SHIELD: Text only bypass with WebLLM integration as primary layer
  if (!imageBase64) {
    const localAnalysis = analyzeQueryLocally(symptoms);
    if (localAnalysis.isEmergency && localAnalysis.message) {
       return {
         assessment: localAnalysis.message,
         severity: 'emergency',
         findings: ['Keyword-based emergency detection'],
         recommendations: ['Seek immediate emergency veterinary care', 'Do not wait for further AI analysis'],
         isVisualAnalysis: false
       };
    }

    // Attempt local Phi-3 execution via WebLLM to save cloud token costs and bypass Gemini quota limits
    try {
      console.log("[WebLLM] Processing query locally via Phi-3 model to save cloud costs...");
      const { getWebLLMResponse } = await import('./webLLMService');
      
      const webllmPrompt = `Perform a high-fidelity clinical assessment for pet symptoms:
      Symptoms: ${prunedSymptoms}
      Pet Info: ${prunedPetInfo}
      
      Respond strictly in the following JSON format without any wrapping markdown blocks:
      {
        "assessment": "Place a detailed supportive screening in markdown here",
        "severity": "low", "medium", "high", or "emergency",
        "findings": ["finding 1", "finding 2"],
        "recommendations": ["rec 1", "rec 2"],
        "suggestedSpecialist": "General Veterinarian",
        "isVisualAnalysis": false
      }`;
      const systemInstruction = "You are the ZooL Local Diagnostic Engine. Respond strictly in valid JSON format. Always recommend consulting a vet.";
      
      const rawResponse = await getWebLLMResponse(webllmPrompt, systemInstruction);
      const parsedResult = safeJSONParse(rawResponse, null) as SymptomAnalysis;
      if (parsedResult && parsedResult.assessment && parsedResult.severity) {
        console.log("[WebLLM] Local symptom analysis succeeded:", parsedResult);
        setCache(cacheKey, parsedResult);
        return parsedResult;
      }
    } catch (webLlmErr) {
      console.warn("[WebLLM] Primary local layer failed or model loading was skipped, cascading to Cloud Gemini:", webLlmErr);
    }
  }

  const cost = imageBase64 ? AICost.IMAGE_ANALYSIS : AICost.GROUNDING_SEARCH;
  const limitCheck = checkLimits('analysis', cost, 3000);
  if (!limitCheck.allowed) {
    if (limitCheck.reason === 'DAILY_CAP') throw new Error(LIMIT_REACHED_MSG);
    return null;
  }

  try {
    const analysisPrompt = imageBase64 
      ? `Perform a high-fidelity multimodal clinical assessment of this pet's visual symptoms.
         Context: ${optimizeContext(prunedPetInfo)}. 
         Observation Intent: ${optimizeContext(prunedSymptoms)}.
         
         EXAMINE THE IMAGE FOR:
         1. DERMATOLOGICAL: Conduct a comprehensive lesion analysis. Identify:
            - Primary vs. Secondary lesions (e.g., macules, papules, pustules, crusts, scales).
            - Pattern distribution (e.g., symmetric/bilateral vs. focal/asymmetric).
            - Color markers (e.g., erythema, hyperpigmentation, hypopigmentation, purpura/petechiae).
            - Surface textures (e.g., moist, exudative, sebaceous, lichenified, crusts/scabs).
            - Signifiers of irritation (e.g., signs of alopecia, excoriation).
            - Potential parasitic presence or evidence of associated self-trauma.
         2. OCULAR: Scan for conjunctival hyperemia, corneal opacity, or abnormal pupillary response.
         3. MUSCULOSKELETAL: Analyze posture for weight-shifting or limb swelling indicative of hidden inflammation.
         4. BIO-MARKERS: Look for any unusual growth, asymmetry, or discoloration in soft tissues.
         
         GUIDELINES: 
         - Use morphological descriptors (e.g., 'macular', 'papular', 'pustular').
         - Cross-reference findings with breed-specific genetic predispositions.
         - Maintain a composed, authoritative clinical tone for the caregiver.
         - Use Google Search to check for regional outbreaks of zoonotic or species-specific diseases.`
      : `Analyze these symptoms for a pet. Context: ${optimizeContext(prunedPetInfo)}. Symptoms: ${optimizeContext(prunedSymptoms)}. Focus on triage and ruling out immediate emergencies. Use Google Search to check for any current pet health alerts or common outbreaks in the region if relevant.`;

    const parts: any[] = [{ text: analysisPrompt }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1] || imageBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: [{ role: 'user', parts }],
      config: {
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
        systemInstruction: SYMPTOMS_SYSTEM_INSTRUCTION + " IMPORTANT: You MUST respond ONLY with a RAW JSON object exactly matching the requested structure: {\"assessment\": \"markdown string\", \"severity\": \"low\"|\"medium\"|\"high\"|\"emergency\", \"findings\": [\"string\"], \"recommendations\": [\"string\"], \"suggestedSpecialist\": \"string\", \"isVisualAnalysis\": boolean}. DO NOT wrap the output in markdown blocks like ```json or add any other text."
      }
    });

    const result = safeJSONParse(response.text, {}) as SymptomAnalysis;
    if (result.assessment) {
      setCache(cacheKey, result);
    }
    
    logAIInteraction({ feature: 'analyzeSymptoms', tokensEstimated: imageBase64 ? 500 : 100, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    
    return result;
  } catch (error: any) {
    logAIInteraction({ feature: 'analyzeSymptoms', tokensEstimated: 0, timestamp: new Date().toISOString(), success: false, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    console.error("Symptom analysis failed:", error);
    if (error?.status === 429 || error?.status === 503 || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("503")) {
      return {
        assessment: "Our Clinical AI engine is at high capacity. Based on generalized veterinary triage protocols, please monitor the pet closely, restrict physical exertion, and contact an emergency vet if symptoms drastically escalate.",
        severity: "medium",
        findings: ["Pending full diagnostic evaluation"],
        recommendations: ["Ensure constant access to fresh water", "Isolate in a quiet, temperature-controlled room", "Monitor breathing and vitals closely", "Consult nearby vet if symptoms persist beyond 24 hours"],
        suggestedSpecialist: "General Veterinarian",
        isVisualAnalysis: !!imageBase64
      } as SymptomAnalysis;
    }
    throw new Error("Unable to analyze symptoms at this time. Please check your network connection.");
  }
};

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/**
 * Purpose: Professional clinical documentation.
 * Logic: Uses advanced reasoning for senior-level veterinary documentation.
 */
export const generateSOAPNote = async (transcript: string): Promise<SOAPNote | null> => {
  const limitCheck = checkLimits('soap', AICost.LITE, 3000);
  if (!limitCheck.allowed) {
    if (limitCheck.reason === 'DAILY_CAP') throw new Error(LIMIT_REACHED_MSG);
    throw new Error("Rate limit exceeded. Please try again in a few seconds.");
  }

  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview", // Use lite for simple record drafting
      contents: `Generate a professional veterinary SOAP note from this transcript: ${transcript}`,
      config: {
        maxOutputTokens: 500,
        systemInstruction: "You are a senior veterinary scribe. Analyze clinical inputs and generate precise SOAP notes. Return ONLY valid JSON with keys: subjective, objective, assessment, plan.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjective: { type: Type.STRING },
            objective: { type: Type.STRING },
            assessment: { type: Type.STRING },
            plan: { type: Type.STRING }
          },
          required: ["subjective", "objective", "assessment", "plan"]
        }
      }
    });
    const result = safeJSONParse(response.text, null) as SOAPNote;
    logAIInteraction({ feature: 'generateSOAPNote', tokensEstimated: 500, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return result;
  } catch (error: any) {
    logAIInteraction({ feature: 'generateSOAPNote', tokensEstimated: 0, timestamp: new Date().toISOString(), success: false, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    console.error("SOAP note generation failed:", error);
    if (error?.status === 429 || error?.status === 503 || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("503")) {
      return {
        subjective: "Provider reported clinical observations (Engine delayed processing).",
        objective: "Pending structured extraction of vitals and examination data.",
        assessment: "Clinical Assessment deferred due to API volume. Re-process later.",
        plan: "1. Monitor vitals\n2. Maintain current care protocol\n3. Sync notes when system load normalizes."
      } as SOAPNote;
    }
    throw new Error("Unable to draft notes right now. Please check your network.");
  }
};

/**
 * Purpose: General pet care chatbot with personality support.
 */
let activeConversationId = `conv_${Date.now()}`;

export const getChatSession = (context: string, persona: AIPersona = 'doctor', summary?: string, conversationId?: string) => {
  if (conversationId) {
    activeConversationId = conversationId;
  } else if (!summary) {
    activeConversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
  }

  const limitCheck = checkLimits('chat-session', AICost.GROUNDING_SEARCH, 1000);
  if (!limitCheck.allowed && limitCheck.reason === 'DAILY_CAP') {
    throw new Error(LIMIT_REACHED_MSG);
  }

  logAIInteraction({ feature: 'getChatSession', tokensEstimated: 500, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview", conversationId: activeConversationId });

  const personaInstructions = {
    doctor: "Senior Veterinary Specialist focused on triage and clinical medicine.",
    nutritionist: "Veterinary Nutritionist specializing in dietary management, metabolic health, and custom meal planning.",
    behaviorist: "Pet Behaviorist focused on psychological health, anxiety reduction, and positive reinforcement training."
  };

  const summaryInstruction = summary ? `\n\nEARLIER CONVERSATION SUMMARY: ${optimizeContext(summary)}\nUse this summary to maintain continuity with previous turns.` : '';

  return ai.chats.create({
    model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
    config: {
      maxOutputTokens: 800,
      systemInstruction: `You are RuRu, an elite, highly empathetic AI Veterinary Support Assistant, Triage Specialist, and Booking Agent. Current Role: ${personaInstructions[persona]}
Use the following context: ${optimizeContext(context)}.${summaryInstruction}
 
CORE DIRECTIVES (VETERINARY SUPPORT & CRISIS MANAGEMENT):
1. **CRITICAL CRISIS TRIAGE:** If a user reports symptoms indicating a potential life-threatening emergency (e.g., severe hemorrhage, acute respiratory distress, cyanosis, collapse, seizures, severe trauma, suspected toxic ingestion like xylitol or chocolate, or gastric dilatation-volvulus), you MUST immediately shift to **CRITICAL CRISIS MODE**. Emit a calm but firm warning, outline exact first-aid stabilizing steps in clear bullet points, and unequivocally instruct the user to seek immediate professional emergency veterinary care. Do NOT downplay severe symptoms.
2. **MEDICAL BOUNDARIES & SAFETY:** DO NOT provide definitive medical diagnoses or prescribe specific medications (especially human medications like NSAIDs which are highly toxic to pets). Always state clearly that you are providing an AI triage screening and support, not a replacement for an in-person veterinary exam.
3. **DEVELOPMENT & OBSERVATION:** For non-emergency symptoms (e.g., mild lethargy, intermittent vomiting without blood), guide the user on observation protocols (e.g., fasting, hydration checks, mucous membrane color checks) and advise when to escalate to an in-person visit.
4. **EMOTIONAL SUPPORT:** Pet emergencies are terrifying. Always acknowledge feelings first. Be a stable, calming, and deeply supportive presence.
5. **SEARCH GROUNDING:** Use Google Search to verify current health trends, recall alerts, emergency protocols, or to find nearest 24/7 service availability.
6. **COMMUNITY & ACCESSIBILITY:** Proactively mention subsidised community clinics or affordable veterinary resources if relevant to the user's inquiry.
7. **BOOKING AGENT:** If the user wants to book, cancel, or check appointments, use the provided tool functions. Always clarify details (Date, Time, Pet Name, Service) before booking.
`,
      tools: [
        { googleSearch: {} },
        { 
          functionDeclarations: [
            {
              name: "book_appointment",
              description: "Book a new appointment. Ensure you have asked the user for the date, time, pet name, and service type before calling this.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  petName: { type: Type.STRING, description: "Name of the pet." },
                  serviceName: { type: Type.STRING, description: "Type of service or reason. E.g. 'General Checkup'" },
                  type: { type: Type.STRING, description: "Type of appointment: 'visit', 'telehealth', 'grooming', 'other'." },
                  date: { type: Type.STRING, description: "Date of appointment in YYYY-MM-DD format." },
                  time: { type: Type.STRING, description: "Time of appointment in HH:MM format (e.g., '14:30')." },
                  reason: { type: Type.STRING, description: "Detailed reason." }
                },
                required: ["petName", "serviceName", "type", "date", "time"]
              }
            },
            {
              name: "get_appointments",
              description: "Retrieve a list of the user's currently scheduled appointments.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING, description: "Optional. Filter by status: 'scheduled', 'completed', 'cancelled'." }
                }
              }
            },
            {
              name: "cancel_appointment",
              description: "Cancel an existing appointment. Call get_appointments first to find the appointment ID.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "The ID of the appointment to cancel." }
                },
                required: ["id"]
              }
            }
          ] 
        }
      ]
    }
  });
};

// Removed moved utilities
export const getPetAdvice = async (query: string, context: string): Promise<string> => {
  const normalizedQuery = normalizeQuery(query);
  const cacheKey = `${normalizedQuery}-${context}`;
  
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // 1. PRIMARY SHIELD: Check local triage first before using any limits or APIs
  const localAnalysis = analyzeQueryLocally(query);
  if (localAnalysis.message) {
    // We found a direct local answer or an emergency that doesn't need AI verification
    return localAnalysis.message;
  }

  // Use lite for advice unless specific search-heavy query is detected
  const isSearchNeeded = /near|latest|update|current|alert|recall/i.test(query);
  const cost = isSearchNeeded ? AICost.GROUNDING_SEARCH : AICost.LITE;
  const limitCheck = checkLimits('advice', cost, 1000);
  if (!limitCheck.allowed) {
    if (limitCheck.reason === 'DAILY_CAP') {
      const fallback = getLocalFallbackResponse(query);
      if (fallback) return fallback;
      try {
        const { getWebLLMResponse } = await import('./webLLMService');
        const llmFallback = await getWebLLMResponse(query, context);
        return llmFallback + "\n\n*(Local AI Fallback)*";
      } catch (err) {
        return LIMIT_REACHED_MSG;
      }
    }
    return "I'm thinking... please wait a moment before your next question.";
  }

  try {
    // RAG Semantic Grounding
    const pastAdvices: string[] = [];
    const relevantPastInfo = [];
    
    const semanticContext = '';

    const response = await ai.models.generateContent({
      model: isSearchNeeded ? import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" : import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: query,
      config: {
        maxOutputTokens: 200,
        systemInstruction: `You are ZooL, a highly empathetic, reassuring, and knowledgeable pet care assistant. You are chatting directly with a pet owner who may be anxious or facing an emergency. Use the following context about the user's pets: ${context}. ${semanticContext} Use Google Search to provide up-to-date and accurate information regarding pet health, nutrition, and safety.
Keep your answers concise, exceptionally friendly, and supportive.

CRITICAL GUIDELINES:- Always acknowledge the owner's feelings first (e.g., "I understand this is stressful," "Take a deep breath").
- For emergencies, state clearly and calmly: "This sounds like an emergency. Please contact your nearest emergency veterinarian immediately or use the SOS button in the app."
- Do not provide definitive medical diagnoses. Suggest possible reasons gently and ALWAYS advise consulting a vet for medical evaluation.
- IMPORTANT: Keep in mind the context is India. Be aware of local environmental factors (e.g., intense heat, monsoon seasons, and how they impact pet health/common diseases like Tick Fever or Parvovirus).`,
        tools: [{ googleSearch: {} }]
      }
    });

    const result = response.text || "I'm not sure how to answer that.";
    setCache(cacheKey, result, 24 * 60 * 60 * 1000); // Cache for 24 hours

    try {
      logAIInteraction({ feature: 'getPetAdvice', tokensEstimated: 200, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    } catch (e) {
      console.warn("Telemetry log failed, but advice retrieved.", e);
    }

    return result;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("AI Quota exhausted, using fallback.");
      try {
        const { getWebLLMResponse } = await import('./webLLMService');
        const llmFallback = await getWebLLMResponse(query, context);
        return llmFallback + "\n\n*(Local AI Fallback)*";
      } catch (err) {
        return "I seem to be taking a short break right now. Please try asking again in a few minutes.";
      }
    }
    console.error("AI Advice failed:", error);
    return "Sorry, I'm having trouble connecting to my brain right now.";
  }
};



/**
 * Purpose: Data extraction from medical documents.
 * Logic: Uses Thinking mode for high-precision extraction of structured data from medical images.
 */
export const parseMedicalRecord = async (imageBase64: string): Promise<Partial<HealthRecord> | null> => {
  const cacheKey = imageBase64.slice(-100);
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  const limitCheck = checkLimits('parse', AICost.IMAGE_ANALYSIS, 5000);
  if (!limitCheck.allowed) {
    if (limitCheck.reason === 'DAILY_CAP') {
      console.warn("Parse skipped due to daily cap");
    }
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: optimizeContext("Extract medical record details from this image. Return JSON with title, date (YYYY-MM-DD), type (vaccination, checkup, medication, or other), and description.") },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(',')[1] || imageBase64
            }
          }
        ]
      },
      config: {
        maxOutputTokens: 200,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            date: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['vaccination', 'checkup', 'medication', 'other'] },
            description: { type: Type.STRING }
          },
          required: ["title", "date", "type", "description"]
        }
      }
    });

    const result = safeJSONParse(response.text, null);
    if (result && result.title) {
      setCache(cacheKey, result);
    }
    logAIInteraction({ feature: 'parseMedicalRecord', tokensEstimated: 400, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return result;
  } catch (error: any) {
    logAIInteraction({ feature: 'parseMedicalRecord', tokensEstimated: 0, timestamp: new Date().toISOString(), success: false, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    console.error("Record parsing failed:", error);
    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error(LIMIT_REACHED_MSG);
    }
    throw new Error("Unable to parse the medical record. Please ensure the image is clear and try again.");
  }
};

export interface ClinicalAnalysis {
  severity: 'low' | 'moderate' | 'high';
  differentials: string[];
  assessment: string;
  plan: string[];
}

export interface ClinicalAssessment {
  likelihood: string;
  possibilities: string[];
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Purpose: Advanced clinical diagnostic assistant for vets.
 * Logic: Cross-references patient data with regional outbreaks and veterinary medical knowledge.
 */
export const getDifferentialDiagnosis = async (pet: Pet, history: HealthRecord[], clinicalQuery: string): Promise<ClinicalAnalysis> => {
  const limitCheck = checkLimits('differentials', AICost.HEAVY_REASONING, 3000);
  if (!limitCheck.allowed) {
    if (limitCheck.reason === 'DAILY_CAP') throw new Error(LIMIT_REACHED_MSG);
    throw new Error("Rate limit exceeded. Please wait a moment.");
  }

  try {
    const historyText = optimizeContext(history.slice(0, 10).map(h => `${h.date}: ${h.type} - ${h.title} (${h.description})`).join('\n'));
    const prompt = `You are a clinical veterinary diagnostic reasoning engine. Formulate a list of differential diagnoses based on the following patient data:
    
    PATIENT: ${optimizeContext(`${pet.name} (${pet.breed}, ${pet.age}y, ${pet.weight}kg)`)}
    CLINICAL FOCUS: ${optimizeContext(clinicalQuery)}
    HISTORY:
    ${historyText || 'No prior records.'}

    Return a structured clinical assessment. Cross-reference with known breed predispositions and regional health alerts if relevant.`;

    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
        systemInstruction: "You are a senior veterinary diagnostic specialist. Your analysis must be evidence-based and professional. IMPORTANT: You MUST respond ONLY with a RAW JSON object: {\"severity\": \"low\"|\"moderate\"|\"high\", \"differentials\": [\"string\"], \"assessment\": \"markdown string\", \"plan\": [\"string\"]}. DO NOT wrap the output in markdown blocks like ```json or add any other text.",
        tools: [{ googleSearch: {} }]
      }
    });

    const result = safeJSONParse(response.text, {
      severity: 'moderate',
      differentials: ['Undetermined clinical presentation'],
      assessment: 'Unable to synthesize precise diagnostic path. Manual evaluation required.',
      plan: ['Conduct physical exam', 'Monitor vitals']
    }) as ClinicalAnalysis;

    logAIInteraction({ feature: 'getDifferentialDiagnosis', tokensEstimated: 800, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return result;
  } catch (error: any) {
    logAIInteraction({ feature: 'getDifferentialDiagnosis', tokensEstimated: 0, timestamp: new Date().toISOString(), success: false, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    console.error("Differential generation failed:", error);
    if (error?.status === 429 || error?.status === 503 || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("503")) {
      return {
        severity: 'moderate',
        differentials: ['System load critical - AI diagnostics skipped', 'Determine via standard manual protocols'],
        assessment: 'Due to severe API congestion, AI diagnostic tools are temporarily disabled. Please rely on baseline clinical judgement and established symptom pathways.',
        plan: ['Conduct standard blood panels if indicated', 'Proceed with baseline symptom management']
      } as ClinicalAnalysis;
    }
    throw new Error("Unable to perform clinical assessment at this time. Please check your connection.");
  }
};

export const getClinicalAssessment = async (query: string): Promise<ClinicalAssessment | null> => {
// from getClinicalAssessment
  const limitCheck = checkLimits('clinical-assessment', 500); // reduced from 3000
  if (!limitCheck.allowed) {
    if (limitCheck.reason === 'DAILY_CAP') throw new Error(LIMIT_REACHED_MSG);
    throw new Error("Rate limit exceeded. Please wait a moment.");
  }

  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: `Perform a clinical assessment for: ${query}. Consider regional Kerala AHD health alerts if relevant.`,
      config: {
        maxOutputTokens: 500,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            likelihood: { type: Type.STRING },
            possibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] }
          },
          required: ["likelihood", "possibilities", "recommendation", "severity"]
        },
        systemInstruction: "You are a senior veterinary diagnostic specialist. Provide evidence-based clinical reasoning and link to regional health trends where applicable. Be concise and professional."
      }
    });
    const result = safeJSONParse(response.text, null) as ClinicalAssessment;
    logAIInteraction({ feature: 'getClinicalAssessment', tokensEstimated: 500, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return result;
  } catch (error: any) {
    logAIInteraction({ feature: 'getClinicalAssessment', tokensEstimated: 0, timestamp: new Date().toISOString(), success: false, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    console.error("Clinical assessment failed:", error);
    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error(LIMIT_REACHED_MSG);
    }
    throw new Error("Unable to perform clinical assessment at this time. Please try again later.");
  }
};

/**
 * Purpose: Summarize long conversations for context management.
 * Logic: Uses lightweight model to condense history into a single cohesive summary.
 */
export const summarizeConversation = async (messages: { role: 'user' | 'ai'; text: string }[]): Promise<string> => {
  try {
    const historyText = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: `Summarize the following veterinary consultation history concisely, highlighting key symptoms, advice given, and decisions made. Keep it under 150 words.\n\nHistory:\n${historyText}`,
      config: {
        maxOutputTokens: 300,
        systemInstruction: "You are a senior veterinary medical scribe. Your task is to provide clinical summaries of patient care conversations."
      }
    });
    logAIInteraction({ feature: 'summarizeConversation', tokensEstimated: 300, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return response.text || "Conversation summary unavailable.";
  } catch (error: any) {
    console.error("Summarization failed:", error);
    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      return LIMIT_REACHED_MSG;
    }
    return "Previous context summarized for continuity.";
  }
};

/**
 * Purpose: Audio transcription for voice logging.
 * Logic: Uses gemini-3-flash-preview for fast and accurate speech-to-text.
 */
export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  const limitCheck = checkLimits('transcribe', 2000);
  if (!limitCheck.allowed) {
    if (limitCheck.reason === 'DAILY_CAP') {
      console.warn("Transcription skipped due to daily cap");
    }
    return "";
  }

  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64
            }
          },
          { text: "Transcribe this audio accurately." }
        ]
      },
      config: {
        maxOutputTokens: 300
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription failed:", error);
    return "";
  }
};

/**
 * Purpose: AI-generated clinical snapshot for upcoming appointments.
 */
export const getPatientSnapshot = async (pet: Pet, healthHistory: HealthRecord[], appointment: Appointment): Promise<PatientSnapshot | null> => {
  const limitCheck = checkLimits('snapshot', 2000);
  if (!limitCheck.allowed) return null;

  try {
    const historyText = optimizeContext(healthHistory.map(h => `${h.date}: ${h.title} - ${h.description}`).join('\n'));
    const prompt = `Analyze this pet's health records and the upcoming appointment reason to generate a clinical snapshot for the veterinarian.
    
    PET: ${optimizeContext(`${pet.name} (${pet.breed}, ${pet.age} years, ${pet.weight}kg)`)}
    APPOINTMENT REASON: ${optimizeContext(appointment.reason || appointment.serviceName)}
    HISTORICAL RECORDS:
    ${historyText || 'No recent history available.'}

    Identify any critical trends, key vitals from recent records, and provide suggested diagnostic pathways.`;

    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        maxOutputTokens: 600,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vitals: {
              type: Type.OBJECT,
              properties: {
                temp: { type: Type.STRING },
                heartRate: { type: Type.STRING },
                weightTrend: { type: Type.STRING, enum: ['stable', 'increasing', 'decreasing'] }
              },
              required: ['weightTrend']
            },
            criticalFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
            diagnosticPathways: { type: Type.ARRAY, items: { type: Type.STRING } },
            lastSummary: { type: Type.STRING }
          },
          required: ["vitals", "criticalFindings", "diagnosticPathways", "lastSummary"]
        },
        systemInstruction: "You are a senior veterinary diagnostic specialist. Provide high-density clinical information."
      }
    });

    const result = safeJSONParse(response.text, null) as PatientSnapshot;
    if (result) result.petId = pet.id;
    logAIInteraction({ feature: 'getPatientSnapshot', tokensEstimated: 600, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return result;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("AI Quota exhausted (Snapshot).");
      return null;
    }
    console.error("Snapshot generation failed:", error);
    return null;
  }
};

/**
 * Purpose: Analyze history and breed to suggest proactive appointments.
 */
export const getProactiveSuggestions = async (pet: Pet, healthHistory: HealthRecord[]): Promise<ProactiveSuggestion[]> => {
  const limitCheck = checkLimits('proactive-scheduling', 5000);
  if (!limitCheck.allowed) return [];

  try {
    const historyText = healthHistory.map(h => `${h.date}: ${h.type} - ${h.title}`).join('\n');
    const prompt = `Based on this pet's breed (${pet.breed}), age (${pet.age}), and medical history, suggest up to 3 proactive medical appointments (vaccinations, checkups, deworming, or breed-specific screenings).
    
    HISTORY:
    ${historyText || 'No recent records.'}
    
    Return SUGGESTED appointments that are missing or due. Focus on preventive care.`;

    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        maxOutputTokens: 500,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['vaccination', 'checkup', 'deworming', 'screening'] },
              suggestedDate: { type: Type.STRING },
              reason: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
            },
            required: ["type", "suggestedDate", "reason", "priority"]
          }
        },
        systemInstruction: "You are a proactive veterinary clinic coordinator. Aim for preventive health."
      }
    });

    const result = safeJSONParse(response.text, []) as any[];
    logAIInteraction({ feature: 'getProactiveSuggestions', tokensEstimated: 400, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    
    return result.map(s => ({
      ...s,
      petId: pet.id,
      petName: pet.name
    }));
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("AI Quota exhausted (Proactive Suggestions).");
      return [];
    }
    console.error("Proactive suggestions failed:", error);
    return [];
  }
};

/**
 * Purpose: Summarize a single medical record.
 */
export const summarizeMedicalRecord = async (record: HealthRecord): Promise<string> => {
  const limitCheck = checkLimits('record-summary', 1000);
  if (!limitCheck.allowed) return "Summarization temporarily unavailable.";

  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: `Summarize this medical record concisely:
      Title: ${record.title}
      Type: ${record.type}
      Description: ${record.description}
      Clinical Notes: ${record.clinicalNotes || 'None'}
      Prescription: ${record.prescription || 'None'}`,
      config: {
        maxOutputTokens: 150,
        systemInstruction: "You are a veterinary clinical scribe. Provide a one-paragraph professional summary of the record including diagnosis, treatment, and key notes."
      }
    });
    
    logAIInteraction({ feature: 'summarizeMedicalRecord', tokensEstimated: 200, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return response.text || "Summary unavailable.";
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      return "Summarization currently unavailable due to high demand. Please try again in 1 minute.";
    }
    console.error("Record summary failed:", error);
    return "Failed to generate summary.";
  }
};

/**
 * Purpose: Text-to-speech output for accessible care.
 * Logic: Uses native browser SpeechSynthesis for reliable, low-latency audio output.
 */
export const playAudio = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `Say with a warm, caring tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    }
  } catch (error) {
    console.error("Audio playback error:", error);
    // Fallback to browser TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }
};

export interface ZoolInsight {
  title: string;
  description: string;
  category: 'health' | 'nutrition' | 'behavior' | 'wellness';
  priority: 'low' | 'medium' | 'high';
  actionLabel?: string;
  icon?: string;
}

/**
 * Purpose: Personalized pet care insights.
 * Logic: Analyzes pet biometric data and health history to generate proactive care suggestions.
 */
export const getZoolInsights = async (pets: any[], records: HealthRecord[]): Promise<ZoolInsight[]> => {
  if (pets.length === 0) return [];
  
  const optimizedContext = optimizeContext({ pets, records });

  const cacheKey = `insights-${pets.map(p => p.id).join('-')}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const limitCheck = checkLimits('insights', 60000); // 1 minute throttle for heavy insight gen
  if (!limitCheck.allowed && limitCheck.reason !== 'DAILY_CAP') return [];

  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: `Analyze these pets and generate 4 to 5 personalized, POSITIVE, and actionable care insights: ${optimizedContext}. 
      Focus on breed-specific health optimization, seasonal wellness, and proactive nutrition.
      Use Google Search to cross-reference current veterinary guidelines or seasonal health alerts (e.g., heatwave precautions, tick season).`,
      config: {
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
        systemInstruction: "You are the ZooL Intelligence Engine. Provide elite, medically-informed care suggestions. ALWAYS return a valid JSON array of objects: Array<{ title: string, description: string, category: 'health'|'nutrition'|'behavior'|'wellness', priority: 'low'|'medium'|'high', actionLabel?: string, icon?: string }>. No extra text.",
        tools: [{ googleSearch: {} }] 
      }
    });

    const result = safeJSONParse(response.text, []) as ZoolInsight[];
    if (result.length > 0) {
      setCache(cacheKey, result, 24 * 60 * 60 * 1000); // Cache for 24 hours
    }
    
    try {
      logAIInteraction({ feature: 'getZoolInsights', tokensEstimated: 800, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    } catch (e) {
      console.warn("Telemetry log failed, but insights retrieved.", e);
    }
    
    return result;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("AI Quota exhausted (Insights). Optimization logic engaged.");
      return [];
    }
    console.error("Zool insights generation failed:", error);
    return [];
  }
};

export interface BreedInsight {
  summary: string;
  commonIssues: string[];
  careTips: string[];
  dietaryNeeds: string[];
  exerciseLevel: string;
  longevity: string;
}

export interface RegionalAlert {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source?: string;
  region: string;
  timestamp: string;
}

/**
 * Purpose: Local health context via search grounding.
 */
export const getRegionalHealthAlerts = async (locationInput: string | { lat: number, lng: number }): Promise<PublicAlert[]> => {
  const location = typeof locationInput === 'string' ? locationInput : `${locationInput.lat},${locationInput.lng}`;
  const cacheKey = `alerts-${normalizeQuery(location)}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // AI Alerts are currently paused for system optimization. Allow manual fetching if necessary, or just serve cached.
  // For now, implementing a very restrictive limit and 15 days cache.
  const limitCheck = checkLimits('alerts', 3600000); // 1 hour throttle at minimum
  if (!limitCheck.allowed && limitCheck.reason !== 'DAILY_CAP') return [];

  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: `Search for any recent (last 3-6 months) pet health alerts, disease outbreaks, or seasonal veterinary warnings specifically in or around ${location}.`,
      config: {
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 500,
        systemInstruction: "You are the ZooL Health Sentinel. Use Google Search to find verified veterinary health alerts. IMPORTANT: Respond ONLY with a valid JSON array of objects: Array<{ title: string, severity: 'low'|'medium'|'high', description: string, source?: string }>. No extra text."
      }
    });

    const resultRaw = safeJSONParse(response.text, []) as any[];
    const result: PublicAlert[] = resultRaw.map((item, idx) => ({
      id: `alert-${Date.now()}-${idx}`,
      title: item.title || 'Regional Alert',
      severity: item.severity || 'low',
      type: item.type || 'Infection Vector',
      message: item.description || item.message || '',
      region: typeof locationInput === 'string' ? locationInput : 'Detected Region',
      issuedBy: item.source || 'ZooL AI Sentinel',
      timestamp: new Date().toISOString()
    }));
    
    setCache(cacheKey, result, 15 * 24 * 60 * 60 * 1000); // Cache for 15 days
    logAIInteraction({ feature: 'getRegionalHealthAlerts', tokensEstimated: 400, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return result;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("AI Quota exhausted (Regional Alerts). Optimization logic engaged.");
      return [];
    }
    console.error("Regional alerts failed:", error);
    return [];
  }
};
export const getBreedInsight = async (breed: string, type: string): Promise<BreedInsight | null> => {
  const cacheKey = `breed-${normalizeQuery(breed)}-${type}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: `Provide a detailed health and care profile for a ${breed} ${type}. Specifically focus on breed-specific dietary requirements, common genetic predispositions, and detailed exercise recommendations based on current veterinary data.`,
      config: {
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
        systemInstruction: "You are a ZooL Breed Specialist. Use Google Search for accurate care protocols. IMPORTANT: Respond ONLY with a JSON object: { summary: string, commonIssues: string[], careTips: string[], dietaryNeeds: string[], exerciseLevel: string, longevity: string }. Ensure commonIssues covers genetic predispositions. dietaryNeeds should be highly breed-specific."
      }
    });

    const result = safeJSONParse(response.text, null) as BreedInsight;
    setCache(cacheKey, result);
    logAIInteraction({ feature: 'getBreedInsight', tokensEstimated: 600, timestamp: new Date().toISOString(), success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return result;
  } catch (error) {
    console.error("Breed insight failed:", error);
    return null;
  }
};

export interface SuggestedReminder {
  petId: string;
  petName: string;
  type: 'vaccination' | 'checkup' | 'medication' | 'other';
  title: string;
  suggestedDate: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Purpose: Proactive health schedule generation.
 * Logic: Cross-references pet age, breed, and history with medical standards using local static tables.
 */
export const getAIReminderSuggestions = async (pets: any[], records: HealthRecord[]): Promise<SuggestedReminder[]> => {
  if (pets.length === 0) return [];

  const limitCheck = checkLimits('reminder-suggestions', 10000); // 10s throttle
  if (!limitCheck.allowed) return [];

  const cacheKey = `reminders-${pets.map(p => p.id).join('-')}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const allReminders: SuggestedReminder[] = [];
    
    // Process purely locally to save API costs and speed up response
    pets.forEach(pet => {
      const petRecords = records.filter(r => r.petId === pet.id);
      const localSuggestions = generateLocalReminders(pet, petRecords);
      
      localSuggestions.forEach(sug => {
        allReminders.push({
          petId: pet.id,
          petName: pet.name,
          type: sug.type as any,
          title: sug.title,
          suggestedDate: sug.dueDate.split('T')[0],
          reason: sug.description,
          priority: sug.priority
        });
      });
    });

    if (allReminders.length > 0) {
      setCache(cacheKey, allReminders);
    }
    
    return allReminders;
  } catch (error: any) {
    console.error("Local Reminder generation failed:", error);
    return [];
  }
};
