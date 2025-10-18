"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSpan = startSpan;
exports.endSpan = endSpan;
exports.withSpan = withSpan;
const metrics_1 = require("./metrics");
// Support both TRACING_ENABLED (as documented) and TRACE_ENABLED (alias)
const TRACE_ENABLED = (process.env.TRACING_ENABLED || process.env.TRACE_ENABLED || '').toLowerCase() === 'true';
// Allow either TRACE_SAMPLE_RATE or TRACING_SAMPLE_RATE; default sample rate is 1 (always) when enabled
const SAMPLE_RAW = process.env.TRACE_SAMPLE_RATE || process.env.TRACING_SAMPLE_RATE || '1';
const SAMPLE_RATE = Math.max(0, Math.min(1, parseFloat(SAMPLE_RAW)));
function shouldSample() {
    if (!TRACE_ENABLED)
        return false;
    if (SAMPLE_RATE >= 1)
        return true;
    return Math.random() < SAMPLE_RATE;
}
function startSpan(name, attributes) {
    if (!shouldSample())
        return null;
    return { name, start: Date.now(), attributes };
}
function endSpan(span, status = 'ok') {
    if (!span)
        return;
    const dur = Date.now() - span.start;
    try {
        metrics_1.metrics.observe('trace.span.duration.ms', dur);
        // Optionally increment counter by name/status for quick checks
        metrics_1.metrics.increment(`trace.span.${span.name}.${status}`);
    }
    catch { /* ignore metrics errors */ }
}
function withSpan(name, fn, attributes) {
    const span = startSpan(name, attributes);
    return fn().then((r) => { endSpan(span, 'ok'); return r; }, (e) => { endSpan(span, 'error'); throw e; });
}
