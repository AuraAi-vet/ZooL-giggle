import { CreateMLCEngine, MLCEngine, InitProgressReport } from "@mlc-ai/web-llm";
import { toast } from 'sonner';

// A tiny quantized model suitable for in-browser fallback
const SELECTED_MODEL = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
let engine: MLCEngine | null = null;
let isInitializing = false;
let initProgressToastId: string | number | null = null;

export const initWebLLM = async (): Promise<MLCEngine> => {
  if (engine) return engine;
  if (isInitializing) {
    // Wait until initialized if it's already in progress
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (engine) {
          clearInterval(checkInterval);
          resolve(engine);
        }
      }, 500);
    });
  }

  isInitializing = true;
  initProgressToastId = toast.loading('Initializing Local AI (Downloading model to browser cache...)');

  try {
    engine = await CreateMLCEngine(SELECTED_MODEL, {
      initProgressCallback: (progress: InitProgressReport) => {
        if (initProgressToastId) {
          toast.loading(`Local AI: ${progress.text}`, { id: initProgressToastId });
        }
      }
    });
    
    if (initProgressToastId) {
       toast.success('Local AI Initialized! Using for offline fallback.', { id: initProgressToastId });
       initProgressToastId = null;
    }
    isInitializing = false;
    return engine;
  } catch (error) {
    isInitializing = false;
    if (initProgressToastId) {
      toast.error('Failed to initialize Local AI fallback.', { id: initProgressToastId });
      initProgressToastId = null;
    }
    console.error("WebLLM initialization failed", error);
    throw error;
  }
};

export const getWebLLMResponse = async (prompt: string, systemPrompt?: string): Promise<string> => {
  try {
    const mlc = await initWebLLM();
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    } else {
      messages.push({ role: 'system', content: 'You are a helpful veterinary assistant. Provide concise, clear advice.' });
    }
    messages.push({ role: 'user', content: prompt });

    // @ts-ignore
    const reply = await mlc.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });
    return reply.choices[0].message.content || 'Unable to generate local response.';
  } catch (error) {
    console.error("WebLLM generation failed:", error);
    return "Local AI is currently unavailable.";
  }
};
