"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/*
  updateAdaptiveResidualThresholds.ts (Phase 12)
  Loads analytics-derived/residual-thresholds.json into global cache for adaptive deviation gauges.
*/
(function main() {
    try {
        const file = path_1.default.join(process.cwd(), 'analytics-derived', 'residual-thresholds.json');
        if (!fs_1.default.existsSync(file)) {
            console.error('[residual-thresh] thresholds file missing');
            process.exit(0);
        }
        const parsed = JSON.parse(fs_1.default.readFileSync(file, 'utf8'));
        global.__residualAdaptiveThresholds = parsed;
        console.log('[residual-thresh] cache loaded');
    }
    catch (e) {
        console.error('[residual-thresh] load failed', e.message);
    }
})();
