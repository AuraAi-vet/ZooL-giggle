import { useState, useEffect } from 'react';
import { isDailyLimitReached, getUsage, getMaxDailyCredits } from '../services/geminiService';
import { USAGE_KEY } from '../services/geminiService';

export const useAILimit = () => {
  const [limitReached, setLimitReached] = useState(isDailyLimitReached());
  const [usageCount, setUsageCount] = useState(getUsage().creditsUsed);
  const [tokensUsed, setTokensUsed] = useState(getUsage().tokensUsed || 0);
  const [history, setHistory] = useState(getUsage().history || []);
  const maxLimit = getMaxDailyCredits();
  const percentage = Math.min(100, Math.round((usageCount / maxLimit) * 100)) || 0;

  useEffect(() => {
    const handleStorageChange = () => {
      setLimitReached(isDailyLimitReached());
      const currentUsage = getUsage();
      setUsageCount(currentUsage.creditsUsed);
      setTokensUsed(currentUsage.tokensUsed || 0);
      setHistory(currentUsage.history || []);
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener('ai-usage-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ai-usage-updated', handleStorageChange);
    };
  }, []);

  return { limitReached, usageCount, maxLimit, percentage, tokensUsed, history };
};
