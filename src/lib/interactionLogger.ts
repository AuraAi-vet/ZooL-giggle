import { useEffect } from 'react';
import { useTestingStore } from '../store/useTestingStore';

export function useInteractionTracker() {
  const addEvent = useTestingStore(state => state.addInteractionEvent);

  useEffect(() => {
    const getSelector = (el: Element | null): string => {
      if (!el) return '';
      if (el.id) return `#${el.id}`;
      let selector = el.tagName.toLowerCase();
      if (el.className && typeof el.className === 'string') {
        const classes = el.className.split(' ').filter(c => c && !c.includes('hover:') && !c.includes('focus:')).join('.');
        if (classes) selector += `.${classes}`;
      }
      return selector;
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Skip tracking if it's deeply nested non-interactive elements, try to find closest interactive
      const interactive = target.closest('button, a, input, select, [role="button"]');
      const trackedEl = interactive || target;
      
      addEvent({
        type: 'click',
        target: trackedEl.tagName.toLowerCase(),
        path: getSelector(trackedEl),
        value: trackedEl.textContent?.trim().substring(0, 30) || undefined
      });
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      addEvent({
        type: 'input',
        target: target.tagName.toLowerCase(),
        path: getSelector(target),
        value: target.type !== 'password' ? '***[obfuscated for privacy]***' : '***' // Obfuscate inputs for privacy
      });
    };

    document.addEventListener('click', handleClick, { capture: true });
    // Use blur or change instead of raw input to avoid flooding
    document.addEventListener('change', handleInput, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('change', handleInput, { capture: true });
    };
  }, [addEvent]);
}
