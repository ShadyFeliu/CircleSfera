export type PerformanceMetric = {
  name: string;
  value: number;
  rating: 'good' | 'poor';
};

export const recordPerformanceMetric = (metric: PerformanceMetric) => {
  // Send to your analytics service or log
  console.log(`Performance Metric - ${metric.name}: ${metric.value}ms (${metric.rating})`);
  
  // You could send this to your backend or analytics service
  if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
    // Example implementation
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(err => console.error('Error sending metric:', err));
  }
};

export const measureConnectionTime = (startTime: number) => {
  const connectionTime = performance.now() - startTime;
  recordPerformanceMetric({
    name: 'ConnectionTime',
    value: connectionTime,
    rating: connectionTime < 1000 ? 'good' : 'poor'
  });
};
