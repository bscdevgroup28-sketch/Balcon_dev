"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
(function main() {
    try {
        const f = path_1.default.join(process.cwd(), 'analytics-derived', 'forecast-residuals.json');
        if (!fs_1.default.existsSync(f)) {
            console.error('[residual-anom] missing residual file');
            process.exit(0);
        }
        const parsed = JSON.parse(fs_1.default.readFileSync(f, 'utf8'));
        const list = parsed.residuals.map(r => ({ metric: r.metric, residual: r.residual }));
        if (!list.length) {
            console.log('{}');
            return;
        }
        const values = list.map(r => r.residual);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.length > 1 ? values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1) : 0;
        const std = Math.sqrt(variance);
        const anomalies = list.map(r => ({ metric: r.metric, residual: r.residual, score: std > 0 ? (r.residual - mean) / std : 0 }));
        const out = { generatedAt: new Date().toISOString(), mean, std, anomalies };
        const dir = path_1.default.join(process.cwd(), 'analytics-derived');
        fs_1.default.writeFileSync(path_1.default.join(dir, 'residual-anomalies.json'), JSON.stringify(out, null, 2));
        console.log(JSON.stringify(out, null, 2));
    }
    catch (e) {
        console.error('[residual-anom] failed', e.message);
    }
})();
