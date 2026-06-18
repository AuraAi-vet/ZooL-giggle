import { VetAIService } from './aiService.interface';
import * as GeminiService from './geminiService';
import { OpenAIVetAIService } from './openaiService';

const provider = (process.env.VITE_AI_PROVIDER || process.env.AI_PROVIDER || 'gemini').toLowerCase();

let service: VetAIService;

if (provider === 'openai') {
  service = new OpenAIVetAIService(process.env.OPENAI_API_KEY || '');
} else {
  // Adapter that forwards to existing geminiService functions. This keeps backwards compatibility
  // while we incrementally implement the OpenAI service. Add mapping for more methods as needed.
  service = {
    getClinicalAssessment: (query: string) => {
      // geminiService exports getClinicalAssessment as a function with the same signature
      // If function names change, update this adapter accordingly.
      // @ts-ignore
      return GeminiService.getClinicalAssessment(query);
    },
    summarizeConversation: (messages) => {
      // @ts-ignore
      return GeminiService.summarizeConversation(messages);
    }
  } as VetAIService;
}

export default service;
