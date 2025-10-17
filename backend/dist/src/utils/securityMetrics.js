"use strict";
// Simple in-memory security metrics counters. Not production-grade (no concurrency safety) but adequate
// for instrumentation and test assertions. In a real deployment this would feed Prometheus or StatsD.
Object.defineProperty(exports, "__esModule", { value: true });
exports.inc = inc;
exports.getSecurityMetrics = getSecurityMetrics;
exports.resetSecurityMetrics = resetSecurityMetrics;
exports.securityMetricsToPrometheus = securityMetricsToPrometheus;
const counters = {
    loginSuccess: 0,
    loginFailure: 0,
    refreshRotate: 0,
    refreshReuseDetected: 0,
    refreshFailure: 0,
    revokeAll: 0,
    tokensListed: 0,
    policyAllow: 0,
    policyDeny: 0,
    authLockouts: 0,
    authLockActive: 0,
};
function inc(key, by = 1) {
    counters[key] += by;
}
function getSecurityMetrics() {
    return { ...counters };
}
function resetSecurityMetrics() {
    Object.keys(counters).forEach(k => counters[k] = 0);
}
function securityMetricsToPrometheus(prefix = 'security') {
    const lines = [];
    const help = {
        loginSuccess: 'Count of successful logins',
        loginFailure: 'Count of failed logins',
        refreshRotate: 'Count of successful refresh rotations',
        refreshReuseDetected: 'Count of detected refresh token reuses',
        refreshFailure: 'Count of failed refresh attempts',
        revokeAll: 'Count of revoke-all operations',
        tokensListed: 'Count of token list invocations'
    };
    for (const [k, v] of Object.entries(counters)) {
        lines.push(`# HELP ${prefix}_${k} ${help[k] || ''}`.trim());
        lines.push(`# TYPE ${prefix}_${k} counter`);
        lines.push(`${prefix}_${k} ${v}`);
    }
    return lines.join('\n') + '\n';
}
