"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/*
  recordResidualHistory.ts (Phase 12)
  Appends current residuals (from forecast-residuals.json) into a rolling history file per metric.
  Output: analytics-derived/residual-history.json
  Structure: { generatedAt, maxSamples, metrics: { <metric>: { samples: { t:number, v:number }[] } } }
*/
const MAX_SAMPLES = parseInt(process.env.RESIDUAL_HISTORY_MAX_SAMPLES || '500', 10);
(function main() {
    try {
        const residualFile = path_1.default.join(process.cwd(), 'analytics-derived', 'forecast-residuals.json');
        if (!fs_1.default.existsSync(residualFile)) {
            console.error('[residual-history] missing forecast-residuals.json');
            process.exit(0);
        }
        const residuals = JSON.parse(fs_1.default.readFileSync(residualFile, 'utf8'));
        const metricsList = residuals.residuals || [];
        const histPath = path_1.default.join(process.cwd(), 'analytics-derived', 'residual-history.json');
        let history = { generatedAt: new Date().toISOString(), maxSamples: MAX_SAMPLES, metrics: {} };
        if (fs_1.default.existsSync(histPath)) {
            try {
                history = JSON.parse(fs_1.default.readFileSync(histPath, 'utf8'));
            }
            catch { /* ignore corrupt */ }
        }
        if (!history.metrics)
            history.metrics = {};
        const now = Date.now();
        for (const r of metricsList) {
            if (!history.metrics[r.metric])
                history.metrics[r.metric] = { samples: [] };
            history.metrics[r.metric].samples.push({ t: now, v: r.residual });
            // trim
            if (history.metrics[r.metric].samples.length > MAX_SAMPLES) {
                history.metrics[r.metric].samples.splice(0, history.metrics[r.metric].samples.length - MAX_SAMPLES);
            }
        }
        history.generatedAt = new Date().toISOString();
        fs_1.default.writeFileSync(histPath, JSON.stringify(history, null, 2));
        console.log('[residual-history] updated');
    }
    catch (e) {
        console.error('[residual-history] failed', e.message);
    }
})();
