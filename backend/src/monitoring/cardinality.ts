import { metrics } from './metrics';

type DimName = string;

interface DimState {
  set: Set<string>;
  budget: number;
  registered: boolean;
}

const dims: Map<DimName, DimState> = new Map();

function toEnvKey(dim: string) {
  return `CARDINALITY_MAX_${dim.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}

function getBudget(dim: string, fallback = 1000): number {
  const envKey = toEnvKey(dim);
  const raw = process.env[envKey];
  const v = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function ensureRegistered(dim: string, budget?: number) {
  let st = dims.get(dim);
  if (!st) {
    st = { set: new Set<string>(), budget: budget ?? getBudget(dim), registered: false };
    dims.set(dim, st);
  }
  if (!st.registered) {
    const dimKey = dim.replace(/[^a-zA-Z0-9_]+/g, '_');
    try {
      metrics.registerGauge(`cardinality.dimension.${dimKey}.unique`, () => st!.set.size);
      metrics.registerGauge(`cardinality.dimension.${dimKey}.budget`, () => st!.budget);
      metrics.registerGauge(`cardinality.dimension.${dimKey}.remaining`, () => Math.max(0, st!.budget - st!.set.size));
    } catch { /* gauges may already exist */ }
    st.registered = true;
  }
  return st;
}

export function configureDimension(dim: string, budget: number) {
  const st = ensureRegistered(dim, budget);
  st.budget = budget;
}

export function trackDimension(dim: string, value: string) {
  const st = ensureRegistered(dim);
  if (st.set.has(value)) return;
  st.set.add(value);
  if (st.set.size > st.budget) {
    // Emit generic and per-dimension violation counters
    try {
      metrics.increment('cardinality.budget_violation');
      const dimKey = dim.replace(/[^a-zA-Z0-9_]+/g, '_');
      metrics.increment(`cardinality.budget_violation.${dimKey}`);
    } catch { /* ignore metric errors */ }
  }
}

export function getDimensionState(dim: string) {
  return dims.get(dim);
}
