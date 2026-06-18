import OpenAI from 'openai';
import { VetAIService, ClinicalAssessment, ChatMessage } from './aiService.interface';

/**
 * Minimal OpenAI-backed implementation of the VetAIService interface.
 * This is a lightweight skeleton intended for incremental migration —
 * implement additional methods and robust error / schema handling as you proceed.
 */
export class OpenAIVetAIService implements VetAIService {
  client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async getClinicalAssessment(query: string): Promise<ClinicalAssessment | null> {
    const system = "You are a senior veterinary diagnostic specialist. Provide evidence-based clinical reasoning and link to regional health trends where applicable. Be concise and professional.";
    const user = `Perform a clinical assessment for: ${query}. Return a JSON object with keys: likelihood (string), possibilities (array of strings), recommendation (string), severity (one of 'low','medium','high','critical').`;

    try {
      const resp: any = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        max_tokens: 500
      });

      const text = resp?.choices?.[0]?.message?.content ?? resp?.choices?.[0]?.text ?? '';
      try {
        const parsed = JSON.parse(text);
        // Basic validation
        if (parsed && parsed.likelihood && parsed.possibilities) {
          return parsed as ClinicalAssessment;
        }
        return null;
      } catch (err) {
        // If the model returned text instead of strict JSON, consider using a regex or a small parser.
        console.warn('OpenAI returned non-JSON; returning null for clinical assessment');
        return null;
      }
    } catch (error) {
      console.error('OpenAI getClinicalAssessment error:', error);
      return null;
    }
  }

  async summarizeConversation(messages: ChatMessage[]): Promise<string> {
    const history = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    const system = "You are a senior veterinary medical scribe. Provide clinical summaries of patient care conversations concisely (under 150 words).";
    const user = `Summarize the following veterinary consultation history concisely, highlighting key symptoms, advice given, and decisions made. Keep it under 150 words.\n\nHistory:\n${history}`;

    try {
      const resp: any = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        max_tokens: 300
      });

      const text = resp?.choices?.[0]?.message?.content ?? resp?.choices?.[0]?.text ?? '';
      return text || 'Conversation summary unavailable.';
    } catch (error) {
      console.error('OpenAI summarizeConversation error:', error);
      return 'Conversation summary unavailable.';
    }
  }
}
