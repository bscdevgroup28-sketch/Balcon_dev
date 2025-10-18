"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureDimension = configureDimension;
exports.trackDimension = trackDimension;
exports.getDimensionState = getDimensionState;
const metrics_1 = require("./metrics");
const dims = new Map();
function toEnvKey(dim) {
    return `CARDINALITY_MAX_${dim.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}
function getBudget(dim, fallback = 1000) {
    const envKey = toEnvKey(dim);
    const raw = process.env[envKey];
    const v = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(v) && v > 0 ? v : fallback;
}
function ensureRegistered(dim, budget) {
    let st = dims.get(dim);
    if (!st) {
        st = { set: new Set(), budget: budget ?? getBudget(dim), registered: false };
        dims.set(dim, st);
    }
    if (!st.registered) {
        const dimKey = dim.replace(/[^a-zA-Z0-9_]+/g, '_');
        try {
            metrics_1.metrics.registerGauge(`cardinality.dimension.${dimKey}.unique`, () => st.set.size);
            metrics_1.metrics.registerGauge(`cardinality.dimension.${dimKey}.budget`, () => st.budget);
            metrics_1.metrics.registerGauge(`cardinality.dimension.${dimKey}.remaining`, () => Math.max(0, st.budget - st.set.size));
        }
        catch { /* gauges may already exist */ }
        st.registered = true;
    }
    return st;
}
function configureDimension(dim, budget) {
    const st = ensureRegistered(dim, budget);
    st.budget = budget;
}
function trackDimension(dim, value) {
    const st = ensureRegistered(dim);
    if (st.set.has(value))
        return;
    st.set.add(value);
    if (st.set.size > st.budget) {
        // Emit generic and per-dimension violation counters
        try {
            metrics_1.metrics.increment('cardinality.budget_violation');
            const dimKey = dim.replace(/[^a-zA-Z0-9_]+/g, '_');
            metrics_1.metrics.increment(`cardinality.budget_violation.${dimKey}`);
        }
        catch { /* ignore metric errors */ }
    }
}
function getDimensionState(dim) {
    return dims.get(dim);
}
