"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const metrics_1 = require("../monitoring/metrics");
const queryMonitor_1 = require("../instrumentation/queryMonitor");
require("../config/database"); // ensure sequelize init & monitor
// Basic operational snapshot for on-call triage.
// Produces JSON to stdout; caller can redirect to file or compress externally.
(async function main() {
    try {
        const snapshot = metrics_1.metrics.snapshot();
        const envFlags = {};
        const flagKeys = [
            'NODE_ENV', 'DIAG_ENDPOINTS_ENABLED', 'ADV_METRICS_ENABLED', 'ENFORCE_HTTPS', 'ENABLE_TEST_ROUTES', 'METRICS_AUTH_TOKEN', 'CSP_EXTRA_CONNECT',
            'DB_SLOW_QUERY_THRESHOLD_MS', 'DB_QUERY_LOGGING'
        ];
        for (const k of flagKeys)
            envFlags[k] = process.env[k];
        // Migration manifest hash (if exists)
        let manifestInfo = null;
        const manifestPath = path_1.default.join(__dirname, '../../migration-manifest.json');
        if (fs_1.default.existsSync(manifestPath)) {
            const content = fs_1.default.readFileSync(manifestPath, 'utf8');
            try {
                const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
                const hash = crypto.createHash('sha256').update(content).digest('hex');
                manifestInfo = { entries: JSON.parse(content).length, sha256: hash };
            }
            catch {
                manifestInfo = { error: 'hash_failed' };
            }
        }
        // Extract anomaly state if present (internal symbol access best-effort)
        let anomalyState = null;
        try {
            const m = require('../monitoring/metrics');
            // Internal variables in metrics.ts are not exported; we attempt to serialize known keys
            const keys = ['auth.failures', 'http.errors.5xx'];
            anomalyState = {};
            for (const k of keys) {
                const s = m.anomalyTargets?.[k];
                if (s)
                    anomalyState[k] = { initialized: s.initialized, mean: s.mean, var: s.var, lastScore: s.lastScore };
            }
        }
        catch {
            anomalyState = null;
        }
        const data = {
            generatedAt: new Date().toISOString(),
            host: os_1.default.hostname(),
            pid: process.pid,
            envFlags,
            manifest: manifestInfo,
            metrics: snapshot,
            slowQueryPatterns: (0, queryMonitor_1.getSlowQueryPatternSummary)(),
            recentSlowQueries: (0, queryMonitor_1.getRecentSlowQueries)(25),
            tokenCleanup: global.__tokenCleanup || null,
            anomalyState,
            circuits: (() => {
                try {
                    const list = global.__circuitRegistry || [];
                    return list.map(c => ({ name: c.opts?.name, state: c.s?.state, failures: c.s?.failures, openedAt: c.s?.openedAt }));
                }
                catch {
                    return null;
                }
            })(),
        };
        process.stdout.write(JSON.stringify(data, null, 2));
    }
    catch (e) {
        console.error('[supportBundle] failed', e.message);
        process.exit(1);
    }
})();
