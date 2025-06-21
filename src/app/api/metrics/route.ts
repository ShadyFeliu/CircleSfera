import { NextResponse } from 'next/server';
import type { PerformanceMetric } from '@/utils/performance';

// In-memory storage for metrics (in production, use a proper database)
let metrics: {
  timestamp: number;
  metric: PerformanceMetric;
}[] = [];

export async function POST(request: Request) {
  try {
    const metric = await request.json();
    
    // Validate metric data
    if (!metric.name || typeof metric.value !== 'number' || !['good', 'poor'].includes(metric.rating)) {
      return NextResponse.json({ error: 'Invalid metric data' }, { status: 400 });
    }

    // Store metric with timestamp
    metrics.push({
      timestamp: Date.now(),
      metric
    });

    // Keep only last 1000 metrics
    if (metrics.length > 1000) {
      metrics = metrics.slice(-1000);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Calculate summary statistics
    const summary = {
      total: metrics.length,
      byMetric: {} as Record<string, {
        count: number;
        avgValue: number;
        goodCount: number;
        poorCount: number;
      }>,
      last24h: metrics.filter(m => Date.now() - m.timestamp < 24 * 60 * 60 * 1000).length
    };

    // Calculate statistics per metric type
    metrics.forEach(({ metric }) => {
      if (!summary.byMetric[metric.name]) {
        summary.byMetric[metric.name] = {
          count: 0,
          avgValue: 0,
          goodCount: 0,
          poorCount: 0
        };
      }

      const stats = summary.byMetric[metric.name];
      stats.count++;
      stats.avgValue = (stats.avgValue * (stats.count - 1) + metric.value) / stats.count;
      if (metric.rating === 'good') stats.goodCount++;
      else stats.poorCount++;
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error getting metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
