// Simple in-memory security metrics counters. Not production-grade (no concurrency safety) but adequate
// for instrumentation and test assertions. In a real deployment this would feed Prometheus or StatsD.

export interface SecurityMetricsSnapshot {
  loginSuccess: number;
  loginFailure: number;
  refreshRotate: number;
  refreshReuseDetected: number;
  refreshFailure: number;
  revokeAll: number;
  tokensListed: number;
  policyAllow: number;
  policyDeny: number;
  authLockouts: number;
  authLockActive: number;
}

const counters: SecurityMetricsSnapshot = {
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

export function inc<K extends keyof SecurityMetricsSnapshot>(key: K, by = 1) {
  counters[key] += by;
}

export function getSecurityMetrics(): SecurityMetricsSnapshot {
  return { ...counters };
}

export function resetSecurityMetrics() {
  (Object.keys(counters) as (keyof SecurityMetricsSnapshot)[]).forEach(k => counters[k] = 0);
}

export function securityMetricsToPrometheus(prefix = 'security') {
  const lines: string[] = [];
  const help: Record<string,string> = {
    loginSuccess: 'Count of successful logins',
    loginFailure: 'Count of failed logins',
    refreshRotate: 'Count of successful refresh rotations',
    refreshReuseDetected: 'Count of detected refresh token reuses',
    refreshFailure: 'Count of failed refresh attempts',
    revokeAll: 'Count of revoke-all operations',
    tokensListed: 'Count of token list invocations'
  };
  for (const [k,v] of Object.entries(counters)) {
    lines.push(`# HELP ${prefix}_${k} ${help[k as keyof SecurityMetricsSnapshot] || ''}`.trim());
    lines.push(`# TYPE ${prefix}_${k} counter`);
    lines.push(`${prefix}_${k} ${v}`);
  }
  return lines.join('\n') + '\n';
}
