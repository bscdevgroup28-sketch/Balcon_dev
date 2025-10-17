"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
(function main() {
    try {
        const file = path_1.default.join(process.cwd(), 'capacity-derived', 'capacity-latest.json');
        if (!fs_1.default.existsSync(file)) {
            console.error('[capacity] derived file missing');
            process.exit(0);
        }
        const parsed = JSON.parse(fs_1.default.readFileSync(file, 'utf8'));
        global.__capacityCache = parsed;
        console.log('[capacity] cache updated', parsed);
    }
    catch (e) {
        console.error('[capacity] update failed', e.message);
    }
})();
