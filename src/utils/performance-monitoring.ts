export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000;

  constructor() {
    this.setupWebVitalsMonitoring();
  }

  private setupWebVitalsMonitoring() {
    if (typeof window !== 'undefined') {
      // FID monitoring
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        }
      }).observe({ entryTypes: ['first-input'] });

      // LCP monitoring
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.recordMetric('LCP', entry.startTime);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // CLS monitoring
      new PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('CLS', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  public recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // Keep only the latest metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Send to analytics if configured
    this.sendToAnalytics(metric);

    return metric;
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      }).catch(console.error);
    }
  }

  public getMetrics(name?: string) {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }

  public getAverageMetric(name: string) {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, curr) => acc + curr.value, 0);
    return sum / metrics.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();
