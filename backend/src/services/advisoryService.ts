import os from 'os';
import fetch from 'node-fetch';
import { metrics } from '../monitoring/metrics';
import { logger } from '../utils/logger';

type AdvisoryState = {
  firstSeenTs?: number;
  lastSentTs?: number;
  failuresConsecutive: number;
  circuitOpenUntil?: number;
  interval?: NodeJS.Timeout;
};

const state: AdvisoryState = { failuresConsecutive: 0 };

function hmac(body: string, secret?: string) {
  if (!secret) return undefined;
  try { return require('crypto').createHmac('sha256', secret).update(body).digest('hex'); } catch { return undefined; }
}

function now() { return Date.now(); }

function getGauge(name: string, def = 0) {
  try { return ((metrics as any).snapshot().gauges[name] ?? def) as number; } catch { return def; }
}

export function startAdvisoryMonitor() {
  const enabled = (process.env.OPS_ADVISORY_ENABLED || 'false').toLowerCase() === 'true';
  const url = process.env.OPS_ADVISORY_WEBHOOK || '';
  if (!enabled) { logger.info('[advisory] disabled'); return; }
  if (!url) { logger.warn('[advisory] OPS_ADVISORY_WEBHOOK not set; advisory monitor not started'); return; }

  const level = parseInt(process.env.OPS_ADVISORY_LEVEL || '3', 10);
  const sustainMs = parseInt(process.env.OPS_ADVISORY_MIN_SUSTAIN_MS || '120000', 10);
  const cooldownMs = parseInt(process.env.OPS_ADVISORY_COOLDOWN_MS || '900000', 10);
  const pollMs = parseInt(process.env.OPS_ADVISORY_POLL_MS || '5000', 10);
  const timeoutMs = parseInt(process.env.OPS_ADVISORY_TIMEOUT_MS || '5000', 10);
  const secret = process.env.OPS_ADVISORY_SIGNING_SECRET;
  const service = process.env.OTEL_SERVICE_NAME || 'balcon-backend';
  const instance = process.env.INSTANCE_ID || os.hostname();
  const version = process.env.GIT_SHA || process.env.RELEASE || process.env.npm_package_version;
  const cbCooldownMs = parseInt(process.env.OPS_ADVISORY_CIRCUIT_COOLDOWN_MS || '300000', 10);
  const cbThreshold = parseInt(process.env.OPS_ADVISORY_CIRCUIT_THRESHOLD || '5', 10);

  logger.info(`[advisory] starting monitor: level>=${level}, sustain=${sustainMs}ms, cooldown=${cooldownMs}ms, poll=${pollMs}ms`);

  // Register circuit metrics
  try {
    metrics.registerGauge('circuit.advisory.state_code', () => (state.circuitOpenUntil && state.circuitOpenUntil > now() ? 1 : 0));
    metrics.registerGauge('circuit.advisory.failures_consecutive', () => state.failuresConsecutive);
  } catch { /* gauges may already be registered */ }

  state.interval = setInterval(async () => {
    try {
      // Circuit breaker check
      if (state.circuitOpenUntil && state.circuitOpenUntil > now()) return; // open

      const advice = getGauge('scaling.advice.code', 0);
      if (advice >= level) {
        if (!state.firstSeenTs) state.firstSeenTs = now();
        const sustained = now() - (state.firstSeenTs || 0);
        if (sustained < sustainMs) { metrics.increment('advisory.skipped.sustain'); return; }
        // cooldown check
        if (state.lastSentTs && (now() - state.lastSentTs) < cooldownMs) { metrics.increment('advisory.skipped.cooldown'); return; }

        // Build payload
        const snap = (metrics as any).snapshot();
        const headroom = snap.gauges['scaling.headroom.rps_pct'] || 0;
        const reason = snap.gauges['scaling.advice.reason_code'] || 0;
        const burnBudget = snap.gauges['http.slo.burn_rate_budget'] || 0;
        const burnRatio = snap.gauges['http.slo.burn_rate_5m_30m'] || 0;
        const payload = {
          ts: new Date().toISOString(),
          service,
          instance,
          version,
          advisory: { level: advice, reason_code: reason, sustained_ms: sustained },
          signals: { headroom_pct: headroom, burn_budget: burnBudget, burn_ratio: burnRatio },
        };
        const body = JSON.stringify(payload);
        const headers: any = { 'content-type': 'application/json' };
        const sig = hmac(body, secret);
        if (sig) headers['x-advisory-signature'] = sig;

  const AC: any = (global as any).AbortController;
  const ac = AC ? new AC() : undefined;
  const to = ac ? setTimeout(() => ac!.abort(), timeoutMs) : undefined;
        const res = await fetch(url, { method: 'POST', body, headers, signal: ac?.signal } as any).catch((e: any) => { throw e; });
        if (to) clearTimeout(to as any);
        if (!res || !('ok' in res) || !(res as any).ok) throw new Error(`HTTP ${(res as any)?.status}`);

        state.lastSentTs = now();
        state.failuresConsecutive = 0;
        metrics.increment('advisory.sent');
        logger.warn('[advisory] sent', payload);
      } else {
        state.firstSeenTs = undefined; // reset sustain window when below threshold
      }
    } catch (e: any) {
      metrics.increment('advisory.errors');
      state.failuresConsecutive++;
      if (state.failuresConsecutive >= cbThreshold) {
        state.circuitOpenUntil = now() + cbCooldownMs;
        logger.error(`[advisory] circuit opened for ${cbCooldownMs}ms after ${state.failuresConsecutive} failures`);
      } else {
        logger.warn('[advisory] send failed', { error: e?.message });
      }
    }
  }, pollMs);
  (state.interval as any).unref?.();
}

export function stopAdvisoryMonitor() {
  if (state.interval) clearInterval(state.interval);
}
