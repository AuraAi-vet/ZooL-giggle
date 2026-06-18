import { describe, it, expect, beforeEach } from 'vitest';
import { GemmaPipelineService } from '../gemmaPipelineService';

describe('GemmaPipelineService', () => {
  let service: GemmaPipelineService;

  beforeEach(() => {
    service = new GemmaPipelineService();
  });

  describe('formatPrompt', () => {
    it('should format prompt without system context', () => {
      const input = 'What is the recommended resting heart rate for a dog?';
      const expected = `<bos><start_of_turn>user
What is the recommended resting heart rate for a dog?<end_of_turn>
<start_of_turn>model
`;
      const result = service.formatPrompt(input);
      expect(result).toBe(expected);
    });

    it('should format prompt with system context', () => {
      const input = 'What is the recommended resting heart rate for a dog?';
      const systemContext = 'You are a veterinary AI assistant.';
      const expected = `<bos><start_of_turn>user
You are a veterinary AI assistant.

What is the recommended resting heart rate for a dog?<end_of_turn>
<start_of_turn>model
`;
      const result = service.formatPrompt(input, systemContext);
      expect(result).toBe(expected);
    });

    it('should handle empty input strings', () => {
      const input = '';
      const expected = `<bos><start_of_turn>user
<end_of_turn>
<start_of_turn>model
`;
      const result = service.formatPrompt(input);
      expect(result).toBe(expected);
    });

    it('should handle empty input strings with system context', () => {
      const input = '';
      const systemContext = 'You are an AI.';
      const expected = `<bos><start_of_turn>user
You are an AI.

<end_of_turn>
<start_of_turn>model
`;
      const result = service.formatPrompt(input, systemContext);
      expect(result).toBe(expected);
    });

    it('should handle multiline input strings', () => {
      const input = 'Hello,\nHow are you?';
      const expected = `<bos><start_of_turn>user
Hello,
How are you?<end_of_turn>
<start_of_turn>model
`;
      const result = service.formatPrompt(input);
      expect(result).toBe(expected);
    });
  });
});
