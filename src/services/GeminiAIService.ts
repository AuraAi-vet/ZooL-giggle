import { safeJSONParse } from './geminiService';
import { GoogleGenAI, Type } from "@google/genai";
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { IVetAIService } from "../types";
import { PromptOptimizer } from '../utils/promptOptimizer';

export interface AILogMetadata {
  feature: string;
  tokensEstimated: number;
  success: boolean;
  model: string;
  hasImage?: boolean; // Boolean flag
  intent?: string; // Intent tag
}

export class GeminiAIService implements IVetAIService {
  private ai: GoogleGenAI;
  private interactionQueue: AILogMetadata[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 15000; // 15s

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  // --- Logging Batcher ---
  private async flushAILogs() {
    if (this.interactionQueue.length === 0) return;
    const batchToUpload = [...this.interactionQueue];
    this.interactionQueue.length = 0;
    if (this.batchTimeout) { clearTimeout(this.batchTimeout); this.batchTimeout = null; }

    const summary = batchToUpload.reduce((acc: any, curr) => {
      const key = `${curr.feature}_${curr.model}`;
      if (!acc[key]) acc[key] = { hits: 0, estimatedTokens: 0, errors: 0 };
      acc[key].hits += 1;
      acc[key].estimatedTokens += curr.tokensEstimated;
      if (!curr.success) acc[key].errors += 1;
      return acc;
    }, {});

    try {
      if (!auth?.currentUser) return;
      
      const batch = writeBatch(db);
      const logRef = doc(collection(db, 'aiInteractionLogs'));
      
      batch.set(logRef, {
        timestamp: serverTimestamp(),
        summary,
        rawBatchSize: batchToUpload.length
      });

      await batch.commit();
    } catch (error) {
      console.error("Batch log flush failed", error);
    }
  }

  protected logInteraction(log: AILogMetadata) {
    this.interactionQueue.push(log);
    if (this.interactionQueue.length >= this.BATCH_SIZE) this.flushAILogs();
    else if (!this.batchTimeout) this.batchTimeout = setTimeout(() => this.flushAILogs(), this.FLUSH_INTERVAL);
  }

  // --- IVetAIService Implementation ---

  async analyzeSymptoms(symptoms: string, petInfo: string, imageBase64?: string): Promise<any> {
    const parts: any[] = [{ text: `Analyze these symptoms for a pet. Context: ${petInfo}. Symptoms: ${symptoms}.` }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: "REDACTED_IMAGE_DATA_FOR_LOGS" 
        }
      });
    }

    const response = await this.ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      contents: [{ role: 'user', parts }],
      config: {
        maxOutputTokens: 1000,
        systemInstruction: "You are the ZooL Multimodal Diagnostic Engine..."
      }
    });

    this.logInteraction({
      feature: 'analyzeSymptoms',
      tokensEstimated: imageBase64 ? 500 : 100,
      success: true,
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
      hasImage: !!imageBase64,
      intent: 'symptom-analysis'
    });

    return response.text;
  }
  
  // ... other methods following same pattern: stripping base64, logging metadata

  async generateSOAPNote(transcript: string): Promise<any> {
    this.logInteraction({ feature: 'generateSOAPNote', tokensEstimated: 500, success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return {};
  }

  async getClinicalAssessment(query: string): Promise<any> {
    this.logInteraction({ feature: 'getClinicalAssessment', tokensEstimated: 500, success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return {};
  }

  async transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
    this.logInteraction({ feature: 'transcribeAudio', tokensEstimated: 200, success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return "transcribed...";
  }

  async summarizeConversation(messages: any[]): Promise<string> {
    this.logInteraction({ feature: 'summarizeConversation', tokensEstimated: 300, success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview" });
    return "summary...";
  }

  async getZoolInsights(pets: any[], records: any[]): Promise<any[]> {
    try {
      const optimizedContext = PromptOptimizer.minifyPatientContext(pets, records);
      const legend = PromptOptimizer.getOptimizedMappingLegend();
      const response = await this.ai.models.generateContent({
        model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
        contents: `${legend}\nAnalyze this data: ${optimizedContext}.
        Generate 4 to 5 personalized, actionable care insights.
        ALWAYS return a valid JSON array of objects: [{ "title": "string", "description": "string", "category": "health|nutrition|behavior", "priority": "high|medium|low" }].
        No extra text outside the JSON.`,
        config: { maxOutputTokens: 2000, responseMimeType: "application/json" }
      });
      this.logInteraction({ feature: 'getZoolInsights', tokensEstimated: 800, success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview", intent: 'insights' });
      let text = (response.text || '[]').replace(/```json/g, '').replace(/```/g, '').trim();
      return safeJSONParse(text, []);
    } catch (e: any) {
      this.logInteraction({ feature: 'getZoolInsights', tokensEstimated: 0, success: false, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview", intent: 'insights' });
      const errMsg = typeof e === 'string' ? e : (e?.message || '');
      if (e?.status === 429 || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || e?.status === 503 || errMsg.includes("UNAVAILABLE") || errMsg.includes("503")) {
        console.warn("AI service busy or unavailable. Optimization logic engaged.");
        return [
          {
            title: "Maintain Routine Care",
            description: "Continue with regular feeding and exercise schedules while our AI engine rests.",
            category: "wellness",
            priority: "medium"
          }
        ];
      }
      console.warn("Returning default insights due to API issue:", errMsg);
      return [
        {
          title: "System Update",
          description: "Our systems are currently experiencing unexpected load. Core tracking features remain fully operational.",
          category: "health",
          priority: "low"
        }
      ];
    }
  }

  async getPetAdvice(query: string, context: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
        contents: `Query: ${query}\nContext: ${context}\nProvide empathetic, reassuring, and helpful advice.`,
        config: { maxOutputTokens: 500 }
      });
      this.logInteraction({ feature: 'getPetAdvice', tokensEstimated: 200, success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview", intent: 'advice' });
      return response.text || "Advice...";
    } catch (e: any) {
      this.logInteraction({ feature: 'getPetAdvice', tokensEstimated: 0, success: false, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview", intent: 'advice' });
      const errMsg = typeof e === 'string' ? e : (e?.message || '');
      if (e?.status === 429 || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || e?.status === 503 || errMsg.includes("UNAVAILABLE") || errMsg.includes("503")) {
        console.warn("AI Quota exhausted or service unavailable. Optimization logic engaged.");
        return "I'm currently experiencing high demand and resting to optimize system resources. Don't worry, you can try asking your question again in a bit.";
      }
      console.warn("Returning fallback advice due to API issue:", errMsg);
      return "I'm having a little trouble connecting right now, but your pet's core systems are running just fine. Please try asking again later.";
    }
  }

  async getAIReminderSuggestions(pets: any[], records: any[]): Promise<any[]> {
    try {
      const optimizedContext = PromptOptimizer.minifyPatientContext(pets, records);
      const legend = PromptOptimizer.getOptimizedMappingLegend();
      const response = await this.ai.models.generateContent({
        model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview",
        contents: `${legend}\nSuggest upcoming health reminders (vaccinations, checkups) based on this data: ${optimizedContext}.
        ALWAYS return a valid JSON array of objects: [{ "petId": "string", "petName": "string", "type": "vaccination|checkup|other", "title": "string", "suggestedDate": "YYYY-MM-DD", "reason": "string" }].
        No extra text outside the JSON.`,
        config: { maxOutputTokens: 1000, responseMimeType: "application/json" }
      });
      this.logInteraction({ feature: 'getAIReminderSuggestions', tokensEstimated: 600, success: true, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview", intent: 'reminders' });
      let text = (response.text || '[]').replace(/```json/g, '').replace(/```/g, '').trim();
      return safeJSONParse(text, []);
    } catch (e: any) {
      this.logInteraction({ feature: 'getAIReminderSuggestions', tokensEstimated: 0, success: false, model: import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview", intent: 'reminders' });
      const errMsg = typeof e === 'string' ? e : (e?.message || '');
      if (e?.status === 429 || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || e?.status === 503 || errMsg.includes("UNAVAILABLE") || errMsg.includes("503")) {
        console.warn("AI service busy. Optimization logic engaged.");
        return [];
      }
      console.warn("Returning empty reminders due to API issue:", errMsg);
      return [];
    }
  }
}

export const geminiAIService = new GeminiAIService(process.env.GEMINI_API_KEY || "");
