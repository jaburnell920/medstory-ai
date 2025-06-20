'use client';

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Log initial load time
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`MedStory AI loaded in ${loadTime.toFixed(2)}ms`);
        
        // Send to analytics if needed
        if (process.env.NODE_ENV === 'production') {
          // You can send this data to your analytics service
          // analytics.track('page_load_time', { duration: loadTime });
        }
      });

      // Monitor Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`);
        });
        
        try {
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // Fallback for browsers that don't support LCP
        }
      }
    }
  }, []);

  return null; // This component doesn't render anything
}