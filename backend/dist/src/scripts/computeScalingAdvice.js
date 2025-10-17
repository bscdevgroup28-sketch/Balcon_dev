"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/*
  computeScalingAdvice.ts (Phase 13)
  Produces a structured scaling advisory JSON combining capacity, headroom, and SLO burn signals.
  Output: scaling-derived/scaling-advice.json
*/
(function main() {
    try {
        const capFile = path_1.default.join(process.cwd(), 'capacity-derived', 'capacity-latest.json');
        if (!fs_1.default.existsSync(capFile)) {
            console.error('[scaling] capacity file missing');
            process.exit(0);
        }
        const cap = JSON.parse(fs_1.default.readFileSync(capFile, 'utf8'));
        // Probe metrics snapshot via a lightweight dynamic import of compiled dist if available
        let rates = {};
        let burn = {};
        let avail = {};
        let residualAnom = {};
        try {
            // Attempt to read metrics snapshot from a running process artifact if one was exported previously
            const snapPath = path_1.default.join(process.cwd(), 'metrics-export', 'latest-snapshot.json');
            if (fs_1.default.existsSync(snapPath)) {
                const snap = JSON.parse(fs_1.default.readFileSync(snapPath, 'utf8'));
                rates.reqPerMin = snap.gauges?.['http.requests.rate_5m_per_min'];
                burn.budget = snap.gauges?.['http.slo.burn_rate_budget'];
                burn.multi = snap.gauges?.['http.slo.burn_rate_5m_30m'];
                avail.a5 = snap.gauges?.['http.availability.5m_est'];
                residualAnom.ordersCreated = snap.gauges?.['analytics.forecast.residual_anom_score.ordersCreated'];
            }
        }
        catch { /* ignore */ }
        const reqPerMin = rates.reqPerMin || 0;
        const currentRps = reqPerMin / 60;
        const headroomPct = cap.maxRps > 0 ? ((cap.maxRps - currentRps) / cap.maxRps) * 100 : 0;
        const burnBudget = burn.budget ?? 0;
        const burnRatio = burn.multi ?? 0;
        let adviceCode = 0; // 0=no action,1=monitor,2=scale soon,3=scale now
        if (headroomPct < 5 || burnBudget > 1.2)
            adviceCode = 3;
        else if (headroomPct < 15 || burnRatio > 2)
            adviceCode = 2;
        else if (headroomPct < 30)
            adviceCode = 1;
        const out = {
            generatedAt: new Date().toISOString(),
            capacity: cap,
            signals: {
                requestRatePerMin: reqPerMin,
                currentRps,
                headroomPct,
                burnBudget,
                burnRatio,
                residualAnomOrdersCreated: residualAnom.ordersCreated || 0
            },
            advice: adviceCode
        };
        const dir = path_1.default.join(process.cwd(), 'scaling-derived');
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(dir, 'scaling-advice.json'), JSON.stringify(out, null, 2));
        console.log(JSON.stringify(out, null, 2));
    }
    catch (e) {
        console.error('[scaling] failed', e.message);
    }
})();
