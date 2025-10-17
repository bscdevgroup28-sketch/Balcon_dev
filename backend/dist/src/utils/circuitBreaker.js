"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
exports.listCircuits = listCircuits;
exports.createCircuit = createCircuit;
const metrics_1 = require("../monitoring/metrics");
const logger_1 = require("./logger");
// Registry of created circuits for diagnostics
const __circuitRegistry = [];
function listCircuits() { return __circuitRegistry.slice(); }
class CircuitBreaker {
    constructor(opts) {
        this.s = { failures: 0, openedAt: null, state: 'closed' };
        this.opts = {
            failureThreshold: opts.failureThreshold ?? 5,
            halfOpenAfterMs: opts.halfOpenAfterMs ?? 30000,
            name: opts.name
        };
        // Metrics gauges/counters
        metrics_1.metrics.increment(`circuit.${this.opts.name}.init`); // ensure schema presence
        metrics_1.metrics.registerGauge(`circuit.${this.opts.name}.state_code`, () => {
            switch (this.s.state) {
                case 'closed': return 0;
                case 'open': return 1;
                case 'half-open': return 2;
                default: return -1;
            }
        });
        metrics_1.metrics.registerGauge(`circuit.${this.opts.name}.failures_consecutive`, () => this.s.failures);
        __circuitRegistry.push(this);
    }
    transition(newState) {
        if (this.s.state === newState)
            return;
        logger_1.logger.warn(`[circuit] ${this.opts.name} -> ${newState}`, { prev: this.s.state });
        metrics_1.metrics.increment(`circuit.${this.opts.name}.transition.${newState}`);
        this.s.state = newState;
        if (newState === 'open')
            this.s.openedAt = Date.now();
        if (newState === 'closed') {
            this.s.failures = 0;
            this.s.openedAt = null;
        }
    }
    async exec(fn) {
        // Check state
        if (this.s.state === 'open') {
            const elapsed = this.s.openedAt ? Date.now() - this.s.openedAt : 0;
            if (elapsed >= this.opts.halfOpenAfterMs) {
                this.transition('half-open');
            }
            else {
                metrics_1.metrics.increment(`circuit.${this.opts.name}.short_circuited`);
                throw new Error(`CircuitOpen:${this.opts.name}`);
            }
        }
        try {
            const result = await fn();
            // Success path
            if (this.s.state !== 'closed')
                this.transition('closed');
            metrics_1.metrics.increment(`circuit.${this.opts.name}.success`);
            return result;
        }
        catch (err) {
            metrics_1.metrics.increment(`circuit.${this.opts.name}.failure`);
            this.s.failures += 1;
            if (this.s.state === 'half-open') {
                // Immediate reopen on failure during trial
                this.transition('open');
            }
            else if (this.s.state === 'closed' && this.s.failures >= this.opts.failureThreshold) {
                this.transition('open');
            }
            throw err;
        }
    }
}
exports.CircuitBreaker = CircuitBreaker;
// Helper factory for one-off usage
function createCircuit(name, opts = {}) {
    return new CircuitBreaker({ name, ...opts });
}
// Expose for support bundle dynamic introspection
global.__circuitRegistry = __circuitRegistry;
