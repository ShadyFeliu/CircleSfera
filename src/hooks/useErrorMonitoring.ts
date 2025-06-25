import { useEffect } from 'react';

export function useErrorMonitoring() {
  useEffect(() => {
    // Error monitoring
    const handleError = (event: ErrorEvent) => {
      console.error('Error:', event.message, '\nURL:', event.filename, '\nLine:', event.lineno, '\nColumn:', event.colno);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    // Performance monitoring
    const setupPerformanceObservers = () => {
      if (typeof window !== 'undefined' && window.PerformanceObserver) {
        try {
          // FID observer
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const metric = {
                name: 'FID',
                value: (entry as any).processingStart - entry.startTime,
                rating: (entry as any).processingStart - entry.startTime < 100 ? 'good' : 'poor'
              };
              console.log('Performance metric:', metric);
            }
          }).observe({ entryTypes: ['first-input'] });

          // LCP observer
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const metric = {
                name: 'LCP',
                value: entry.startTime,
                rating: entry.startTime < 2500 ? 'good' : 'poor'
              };
              console.log('Performance metric:', metric);
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // CLS observer
          new PerformanceObserver((entryList) => {
            let clsValue = 0;
            for (const entry of entryList.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            const metric = {
              name: 'CLS',
              value: clsValue,
              rating: clsValue < 0.1 ? 'good' : 'poor'
            };
            console.log('Performance metric:', metric);
          }).observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.error('Error setting up performance observers:', e);
        }
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Setup performance monitoring
    setupPerformanceObservers();

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
} 