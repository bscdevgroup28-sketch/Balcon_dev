"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const metrics_1 = require("../monitoring/metrics");
(function main() {
    try {
        const file = path_1.default.join(process.cwd(), 'analytics-derived', 'forecast-residuals.json');
        if (!fs_1.default.existsSync(file)) {
            console.error('[residual] residual file not found');
            process.exit(0);
        }
        const parsed = JSON.parse(fs_1.default.readFileSync(file, 'utf8'));
        const cache = {};
        for (const r of parsed.residuals)
            cache[r.metric] = r.residual;
        global.__residualCache = cache;
        // Optionally reflect sign buckets via counters (positive/negative residuals)
        Object.entries(cache).forEach(([m, v]) => {
            if (v > 0)
                metrics_1.metrics.increment(`analytics.forecast.residual_positive.${m}`);
            else if (v < 0)
                metrics_1.metrics.increment(`analytics.forecast.residual_negative.${m}`);
        });
        console.log('[residual] updated residual cache', cache);
    }
    catch (e) {
        console.error('[residual] update failed', e.message);
    }
})();
