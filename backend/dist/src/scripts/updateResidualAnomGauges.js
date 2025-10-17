"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
(function main() {
    try {
        const file = path_1.default.join(process.cwd(), 'analytics-derived', 'residual-anomalies.json');
        if (!fs_1.default.existsSync(file)) {
            console.error('[residual-anom] file missing');
            process.exit(0);
        }
        const parsed = JSON.parse(fs_1.default.readFileSync(file, 'utf8'));
        const cache = {};
        parsed.anomalies.forEach(a => cache[a.metric] = a.score);
        global.__residualAnomCache = cache;
        console.log('[residual-anom] cache updated', cache);
    }
    catch (e) {
        console.error('[residual-anom] update failed', e.message);
    }
})();
