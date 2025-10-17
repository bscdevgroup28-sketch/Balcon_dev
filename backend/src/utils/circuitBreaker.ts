import { metrics } from '../monitoring/metrics';
import { logger } from './logger';

export interface CircuitBreakerOptions {
  failureThreshold?: number; // consecutive failures to open
  halfOpenAfterMs?: number;  // time after which we allow a trial request
  name: string;              // identifier for metrics/logging
}

interface State {
  failures: number;
  openedAt: number | null;
  state: 'closed' | 'open' | 'half-open';
}

// Registry of created circuits for diagnostics
const __circuitRegistry: CircuitBreaker[] = [] as any;
export function listCircuits() { return __circuitRegistry.slice(); }

export class CircuitBreaker {
  private opts: Required<CircuitBreakerOptions>;
  private s: State = { failures: 0, openedAt: null, state: 'closed' };

  constructor(opts: CircuitBreakerOptions) {
    this.opts = {
      failureThreshold: opts.failureThreshold ?? 5,
      halfOpenAfterMs: opts.halfOpenAfterMs ?? 30000,
      name: opts.name
    };
    // Metrics gauges/counters
    metrics.increment(`circuit.${this.opts.name}.init`); // ensure schema presence
    metrics.registerGauge(`circuit.${this.opts.name}.state_code`, () => {
      switch (this.s.state) {
        case 'closed': return 0;
        case 'open': return 1;
        case 'half-open': return 2;
        default: return -1;
      }
    });
    metrics.registerGauge(`circuit.${this.opts.name}.failures_consecutive`, () => this.s.failures);
    __circuitRegistry.push(this);
  }

  private transition(newState: State['state']) {
    if (this.s.state === newState) return;
    logger.warn(`[circuit] ${this.opts.name} -> ${newState}`, { prev: this.s.state });
    metrics.increment(`circuit.${this.opts.name}.transition.${newState}`);
    this.s.state = newState;
    if (newState === 'open') this.s.openedAt = Date.now();
    if (newState === 'closed') { this.s.failures = 0; this.s.openedAt = null; }
  }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    // Check state
    if (this.s.state === 'open') {
      const elapsed = this.s.openedAt ? Date.now() - this.s.openedAt : 0;
      if (elapsed >= this.opts.halfOpenAfterMs) {
        this.transition('half-open');
      } else {
        metrics.increment(`circuit.${this.opts.name}.short_circuited`);
        throw new Error(`CircuitOpen:${this.opts.name}`);
      }
    }

    try {
      const result = await fn();
      // Success path
      if (this.s.state !== 'closed') this.transition('closed');
      metrics.increment(`circuit.${this.opts.name}.success`);
      return result;
    } catch (err: any) {
      metrics.increment(`circuit.${this.opts.name}.failure`);
      this.s.failures += 1;
      if (this.s.state === 'half-open') {
        // Immediate reopen on failure during trial
        this.transition('open');
      } else if (this.s.state === 'closed' && this.s.failures >= this.opts.failureThreshold) {
        this.transition('open');
      }
      throw err;
    }
  }
}

// Helper factory for one-off usage
export function createCircuit(name: string, opts: Partial<CircuitBreakerOptions> = {}) {
  return new CircuitBreaker({ name, ...opts });
}

// Expose for support bundle dynamic introspection
(global as any).__circuitRegistry = __circuitRegistry;
