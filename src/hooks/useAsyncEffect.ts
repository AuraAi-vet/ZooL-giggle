import { useEffect, useRef } from 'react';

/**
 * Safe async effect hook that prevents memory leaks
 * and handles cleanup properly
 */

export const useAsyncEffect = (
  effect: () => void | (() => void),
  dependencies?: React.DependencyList
) => {
  const cleanupRef = useRef<(() => void) | void>();

  useEffect(() => {
    let isMounted = true;

    const execute = () => {
      if (isMounted) {
        cleanupRef.current = effect();
      }
    };

    execute();

    return () => {
      isMounted = false;
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
    };
  }, dependencies);
};
