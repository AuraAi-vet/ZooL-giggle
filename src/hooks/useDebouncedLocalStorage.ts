import { useCallback, useRef, useEffect } from 'react';

/**
 * Debounced localStorage operations to prevent main thread blocking
 * Especially important for large datasets
 */

export const useDebouncedLocalStorage = (delay: number = 1000) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRef = useRef<Map<string, any>>(new Map());

  const setItem = useCallback((key: string, value: any) => {
    pendingRef.current.set(key, value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      pendingRef.current.forEach((val, k) => {
        try {
          localStorage.setItem(k, JSON.stringify(val));
        } catch (error) {
          console.error(`Failed to save ${k} to localStorage:`, error);
        }
      });
      pendingRef.current.clear();
    }, delay);
  }, [delay]);

  const getItem = useCallback((key: string) => {
    // Check pending first
    if (pendingRef.current.has(key)) {
      return pendingRef.current.get(key);
    }
    // Fall back to actual localStorage
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { setItem, getItem };
};
