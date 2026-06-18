import React from 'react';
// @ts-ignore
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ZoolInsights } from '../../components/ZoolInsights';

vi.mock('../../services/GeminiAIService', () => {
  return {
    geminiAIService: {
      getZoolInsights: vi.fn().mockResolvedValue([
        {
          title: "Mocked Insight: Hydration",
          description: "Ensure your pet is drinking plenty of water.",
          category: "health",
          priority: "high"
        }
      ])
    }
  };
});

describe('ZoolInsights View Component', () => {
  it('renders loading state initially and then shows insights', async () => {
    render(<ZoolInsights pets={[{id: 'p1', ownerId: 'u1', name: 'Max', type: 'dog', breed: 'Labrador', age: 2, weight: 20, image: ''}]} records={[]} />);
    
    // Check loading state
    expect(screen.getByText(/Neural Synthesis/i)).toBeInTheDocument();

    // Wait for the async call
    await waitFor(() => {
      expect(screen.getByText('Mocked Insight: Hydration')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Ensure your pet is drinking plenty of water.')).toBeInTheDocument();
  });
});
