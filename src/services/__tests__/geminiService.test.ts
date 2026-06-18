import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as geminiService from '../geminiService';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify([{
            title: "Increase Water Intake",
            description: "Provide fresh water daily.",
            category: "health",
            priority: "medium"
          }])
        })
      };
    }
  };
});

describe('Gemini AI Service Functional Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('safeJSONParse', () => {
    it('parses valid JSON successfully', () => {
      const result = geminiService.safeJSONParse('{"key":"value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('strips markdown code blocks', () => {
      const result = geminiService.safeJSONParse('```json\n[{"item": 1}]\n```');
      expect(result).toEqual([{ item: 1 }]);
    });

    it('returns fallback on completely invalid JSON', () => {
      const result = geminiService.safeJSONParse('This is just plain text, not JSON', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    it('repairs simple unescaped newlines inside strings', () => {
      // The implementation converts \n inside strings to \\n
      const result = geminiService.safeJSONParse('{"text": "Line 1\nLine 2"}', null);
      expect(result).toEqual({ text: 'Line 1\nLine 2' });
    });
  });
  describe('getZoolInsights', () => {
    it('returns empty array if no pets provided', async () => {
      const insights = await geminiService.getZoolInsights([], []);
      expect(insights).toEqual([]);
    });

    it('returns functional insights data for given pets (mocked)', async () => {
      const pets = [{ id: '1', name: 'Buddy', type: 'Dog', breed: 'Golden Retreiver', age: 3, weight: 30 }];
      const records = [];
      const insights = await geminiService.getZoolInsights(pets, records);
      expect(Array.isArray(insights)).toBe(true);
      if (insights.length > 0) {
        expect(insights[0]).toHaveProperty('title');
        expect(insights[0]).toHaveProperty('description');
        expect(insights[0]).toHaveProperty('category');
        expect(insights[0]).toHaveProperty('priority');
      }
    });
  });

  describe('analyzeSymptoms', () => {
    it('returns structured diagnostic differential based on a text prompt', async () => {
      const result = await geminiService.analyzeSymptoms('Dog has been coughing', 'Healthy 2yo Labrador');
      expect(result).toBeDefined();
    });
  });
});
