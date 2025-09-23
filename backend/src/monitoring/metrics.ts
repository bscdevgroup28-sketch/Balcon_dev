import os from 'os';
import process from 'process';

interface Counters { [key: string]: number }
interface Gauges { [key: string]: () => number }

class MetricsRegistry {
  private startTime: number;
  private counters: Counters = {};
  private gauges: Gauges = {};

  constructor() {
    this.startTime = Date.now();
    this.registerGauge('process.uptime_ms', () => Date.now() - this.startTime);
    this.registerGauge('process.memory.rss_mb', () => Math.round(process.memoryUsage().rss / 1024 / 1024));
    this.registerGauge('process.memory.heap_used_mb', () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024));
    this.registerGauge('system.load.1m', () => os.loadavg()[0]);
    this.registerGauge('system.load.5m', () => os.loadavg()[1]);
    this.registerGauge('system.load.15m', () => os.loadavg()[2]);
  }

  increment(name: string, value: number = 1) {
    this.counters[name] = (this.counters[name] || 0) + value;
  }

  registerGauge(name: string, fn: () => number) {
    this.gauges[name] = fn;
  }

  snapshot() {
    const gauges: Record<string, number> = {};
    for (const [k, fn] of Object.entries(this.gauges)) {
      try { gauges[k] = fn(); } catch { gauges[k] = NaN; }
    }
    return {
      timestamp: new Date().toISOString(),
      counters: { ...this.counters },
      gauges,
      meta: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
      }
    };
  }

  toPrometheus() {
    const lines: string[] = [];
    const snap = this.snapshot();
    for (const [k, v] of Object.entries(snap.counters)) {
      lines.push(`# TYPE ${k.replace(/\./g,'_')} counter`);
      lines.push(`${k.replace(/\./g,'_')} ${v}`);
    }
    for (const [k, v] of Object.entries(snap.gauges)) {
      lines.push(`# TYPE ${k.replace(/\./g,'_')} gauge`);
      lines.push(`${k.replace(/\./g,'_')} ${v}`);
    }
    return lines.join('\n');
  }
}

export const metrics = new MetricsRegistry();

// Simple middleware to count requests and track latency buckets
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = process.hrtime.bigint();
  metrics.increment('http.requests.total');
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
    metrics.increment(`http.response.status.${res.statusCode}`);
    if (ms < 100) metrics.increment('http.latency.lt_100ms');
    else if (ms < 300) metrics.increment('http.latency.lt_300ms');
    else if (ms < 1000) metrics.increment('http.latency.lt_1000ms');
    else metrics.increment('http.latency.ge_1000ms');
  });
  next();
}

// Optional Sentry integration wrapper
export function initSentry(logger: { info: Function; warn: Function; error: Function }) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('[monitoring] SENTRY_DSN not set; skipping Sentry init');
    return;
  }
  try {
    // Lazy import to avoid dependency if not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      environment: process.env.NODE_ENV || 'development'
    });
    logger.info('[monitoring] Sentry initialized');
  } catch (err) {
    logger.warn('[monitoring] Failed to initialize Sentry (is @sentry/node installed?)');
  }
}
