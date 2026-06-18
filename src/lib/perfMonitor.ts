import { useEffect } from 'react';
import { useTestingStore } from '../store/useTestingStore';

export function usePerfMonitor() {
  const addMetric = useTestingStore(state => state.addPerfMetric);

  useEffect(() => {
    // Track core web vitals and custom marks computationally cheaply
    if ('PerformanceObserver' in window) {
      // Paint Timing
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            addMetric({
              type: 'paint',
              name: entry.name,
              value: entry.startTime,
            });
          });
        });
        observer.observe({ type: 'paint', buffered: true });
      } catch (e) {
        console.warn('PerfObserver paint error', e);
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          addMetric({
            type: 'lcp',
            name: 'Largest Contentful Paint',
            value: lastEntry.startTime,
          });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('PerfObserver LCP error', e);
      }
      
      // Monitor long API requests natively via fetch override or performance resource timing
      try {
        const resObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.name.includes('/api/')) {
              addMetric({
                type: 'api',
                name: new URL(entry.name).pathname,
                value: entry.duration,
              });
            }
          });
        });
        resObserver.observe({ type: 'resource', buffered: true });
      } catch(e) {
        console.warn('PerfObserver resource error', e);
      }
    }
  }, [addMetric]);
}
