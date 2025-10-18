"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAdvisoryMonitor = startAdvisoryMonitor;
exports.stopAdvisoryMonitor = stopAdvisoryMonitor;
const os_1 = __importDefault(require("os"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const metrics_1 = require("../monitoring/metrics");
const logger_1 = require("../utils/logger");
const state = { failuresConsecutive: 0 };
function hmac(body, secret) {
    if (!secret)
        return undefined;
    try {
        return require('crypto').createHmac('sha256', secret).update(body).digest('hex');
    }
    catch {
        return undefined;
    }
}
function now() { return Date.now(); }
function getGauge(name, def = 0) {
    try {
        return (metrics_1.metrics.snapshot().gauges[name] ?? def);
    }
    catch {
        return def;
    }
}
function startAdvisoryMonitor() {
    const enabled = (process.env.OPS_ADVISORY_ENABLED || 'false').toLowerCase() === 'true';
    const url = process.env.OPS_ADVISORY_WEBHOOK || '';
    if (!enabled) {
        logger_1.logger.info('[advisory] disabled');
        return;
    }
    if (!url) {
        logger_1.logger.warn('[advisory] OPS_ADVISORY_WEBHOOK not set; advisory monitor not started');
        return;
    }
    const level = parseInt(process.env.OPS_ADVISORY_LEVEL || '3', 10);
    const sustainMs = parseInt(process.env.OPS_ADVISORY_MIN_SUSTAIN_MS || '120000', 10);
    const cooldownMs = parseInt(process.env.OPS_ADVISORY_COOLDOWN_MS || '900000', 10);
    const pollMs = parseInt(process.env.OPS_ADVISORY_POLL_MS || '5000', 10);
    const timeoutMs = parseInt(process.env.OPS_ADVISORY_TIMEOUT_MS || '5000', 10);
    const secret = process.env.OPS_ADVISORY_SIGNING_SECRET;
    const service = process.env.OTEL_SERVICE_NAME || 'balcon-backend';
    const instance = process.env.INSTANCE_ID || os_1.default.hostname();
    const version = process.env.GIT_SHA || process.env.RELEASE || process.env.npm_package_version;
    const cbCooldownMs = parseInt(process.env.OPS_ADVISORY_CIRCUIT_COOLDOWN_MS || '300000', 10);
    const cbThreshold = parseInt(process.env.OPS_ADVISORY_CIRCUIT_THRESHOLD || '5', 10);
    logger_1.logger.info(`[advisory] starting monitor: level>=${level}, sustain=${sustainMs}ms, cooldown=${cooldownMs}ms, poll=${pollMs}ms`);
    // Register circuit metrics
    try {
        metrics_1.metrics.registerGauge('circuit.advisory.state_code', () => (state.circuitOpenUntil && state.circuitOpenUntil > now() ? 1 : 0));
        metrics_1.metrics.registerGauge('circuit.advisory.failures_consecutive', () => state.failuresConsecutive);
    }
    catch { /* gauges may already be registered */ }
    state.interval = setInterval(async () => {
        try {
            // Circuit breaker check
            if (state.circuitOpenUntil && state.circuitOpenUntil > now())
                return; // open
            const advice = getGauge('scaling.advice.code', 0);
            if (advice >= level) {
                if (!state.firstSeenTs)
                    state.firstSeenTs = now();
                const sustained = now() - (state.firstSeenTs || 0);
                if (sustained < sustainMs) {
                    metrics_1.metrics.increment('advisory.skipped.sustain');
                    return;
                }
                // cooldown check
                if (state.lastSentTs && (now() - state.lastSentTs) < cooldownMs) {
                    metrics_1.metrics.increment('advisory.skipped.cooldown');
                    return;
                }
                // Build payload
                const snap = metrics_1.metrics.snapshot();
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
                const headers = { 'content-type': 'application/json' };
                const sig = hmac(body, secret);
                if (sig)
                    headers['x-advisory-signature'] = sig;
                const AC = global.AbortController;
                const ac = AC ? new AC() : undefined;
                const to = ac ? setTimeout(() => ac.abort(), timeoutMs) : undefined;
                const res = await (0, node_fetch_1.default)(url, { method: 'POST', body, headers, signal: ac?.signal }).catch((e) => { throw e; });
                if (to)
                    clearTimeout(to);
                if (!res || !('ok' in res) || !res.ok)
                    throw new Error(`HTTP ${res?.status}`);
                state.lastSentTs = now();
                state.failuresConsecutive = 0;
                metrics_1.metrics.increment('advisory.sent');
                logger_1.logger.warn('[advisory] sent', payload);
            }
            else {
                state.firstSeenTs = undefined; // reset sustain window when below threshold
            }
        }
        catch (e) {
            metrics_1.metrics.increment('advisory.errors');
            state.failuresConsecutive++;
            if (state.failuresConsecutive >= cbThreshold) {
                state.circuitOpenUntil = now() + cbCooldownMs;
                logger_1.logger.error(`[advisory] circuit opened for ${cbCooldownMs}ms after ${state.failuresConsecutive} failures`);
            }
            else {
                logger_1.logger.warn('[advisory] send failed', { error: e?.message });
            }
        }
    }, pollMs);
    state.interval.unref?.();
}
function stopAdvisoryMonitor() {
    if (state.interval)
        clearInterval(state.interval);
}
