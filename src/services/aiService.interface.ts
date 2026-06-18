export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ClinicalAssessment {
  likelihood: string;
  possibilities: string[];
  recommendation: string;
  severity: Severity;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export interface VetAIService {
  /**
   * Return a structured clinical assessment or null on failure.
   */
  getClinicalAssessment(query: string): Promise<ClinicalAssessment | null>;

  /**
   * Summarize an array of messages into a short clinical summary.
   */
  summarizeConversation(messages: ChatMessage[]): Promise<string>;

  // TODO: add other methods used by the app (transcribeAudio, analyzeSymptoms, parseMedicalRecord, etc.)
}
