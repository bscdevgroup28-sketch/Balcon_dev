import { metrics } from './metrics';

interface Span {
  name: string;
  start: number;
  attributes?: Record<string, string | number | boolean | undefined>;
}

// Support both TRACING_ENABLED (as documented) and TRACE_ENABLED (alias)
const TRACE_ENABLED = ((process.env.TRACING_ENABLED || process.env.TRACE_ENABLED || '') as string).toLowerCase() === 'true';
// Allow either TRACE_SAMPLE_RATE or TRACING_SAMPLE_RATE; default sample rate is 1 (always) when enabled
const SAMPLE_RAW = process.env.TRACE_SAMPLE_RATE || process.env.TRACING_SAMPLE_RATE || '1';
const SAMPLE_RATE = Math.max(0, Math.min(1, parseFloat(SAMPLE_RAW)));

function shouldSample(): boolean {
  if (!TRACE_ENABLED) return false;
  if (SAMPLE_RATE >= 1) return true;
  return Math.random() < SAMPLE_RATE;
}

export function startSpan(name: string, attributes?: Record<string, string | number | boolean | undefined>): Span | null {
  if (!shouldSample()) return null;
  return { name, start: Date.now(), attributes };
}

export function endSpan(span: Span | null, status: 'ok' | 'error' = 'ok'): void {
  if (!span) return;
  const dur = Date.now() - span.start;
  try {
    metrics.observe('trace.span.duration.ms', dur);
    // Optionally increment counter by name/status for quick checks
    metrics.increment(`trace.span.${span.name}.${status}`);
  } catch { /* ignore metrics errors */ }
}

export function withSpan<T>(name: string, fn: () => Promise<T>, attributes?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const span = startSpan(name, attributes);
  return fn().then((r) => { endSpan(span, 'ok'); return r; }, (e) => { endSpan(span, 'error'); throw e; });
}
