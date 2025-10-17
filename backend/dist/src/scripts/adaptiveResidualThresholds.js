"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const K = parseFloat(process.env.RESIDUAL_THRESHOLD_STD_K || '3');
const MIN_SAMPLES = parseInt(process.env.RESIDUAL_THRESHOLD_MIN_SAMPLES || '20', 10);
(function main() {
    try {
        const histPath = path_1.default.join(process.cwd(), 'analytics-derived', 'residual-history.json');
        if (!fs_1.default.existsSync(histPath)) {
            console.error('[residual-thresh] missing residual-history.json');
            process.exit(0);
        }
        const history = JSON.parse(fs_1.default.readFileSync(histPath, 'utf8'));
        const out = { generatedAt: new Date().toISOString(), k: K, metrics: {} };
        const metrics = history.metrics || {};
        for (const [metric, obj] of Object.entries(metrics)) {
            const samples = obj.samples.map(s => s.v);
            if (samples.length < MIN_SAMPLES) {
                out.metrics[metric] = { ready: false, count: samples.length };
                continue;
            }
            const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
            const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (samples.length - 1 || 1);
            const std = Math.sqrt(variance);
            out.metrics[metric] = {
                ready: true,
                count: samples.length,
                mean,
                std,
                upper: mean + K * std,
                lower: mean - K * std
            };
        }
        const outPath = path_1.default.join(process.cwd(), 'analytics-derived', 'residual-thresholds.json');
        fs_1.default.writeFileSync(outPath, JSON.stringify(out, null, 2));
        console.log('[residual-thresh] thresholds updated');
    }
    catch (e) {
        console.error('[residual-thresh] failed', e.message);
    }
})();
