"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function readJsonInput(fileArg) {
    if (fileArg && fs_1.default.existsSync(fileArg)) {
        return JSON.parse(fs_1.default.readFileSync(fileArg, 'utf8'));
    }
    const data = fs_1.default.readFileSync(0, 'utf8'); // stdin
    return JSON.parse(data);
}
(function main() {
    const args = process.argv.slice(2);
    let file;
    let scenarioOverride;
    for (let i = 0; i < args.length; i++) {
        if (!args[i])
            continue;
        if (args[i] === '--scenario') {
            scenarioOverride = args[++i];
            continue;
        }
        file = args[i];
    }
    let summary;
    try {
        summary = readJsonInput(file);
    }
    catch (e) {
        console.error('[perf] failed to parse input', e.message);
        process.exit(1);
    }
    if (scenarioOverride)
        summary.scenario = scenarioOverride;
    if (!summary.scenario)
        summary.scenario = 'unknown';
    const dir = path_1.default.join(process.cwd(), 'perf-history');
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const fname = `${ts}-${summary.scenario}.json`;
    const outPath = path_1.default.join(dir, fname);
    fs_1.default.writeFileSync(outPath, JSON.stringify(summary, null, 2));
    console.log('[perf] baseline persisted', { file: outPath });
})();
