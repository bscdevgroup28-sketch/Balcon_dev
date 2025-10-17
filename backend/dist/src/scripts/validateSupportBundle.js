"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
/*
  CI helper: generate a support bundle and perform a shallow schema validation.
  Fails (exit 1) if required top-level keys are missing.
*/
function main() {
    const proc = (0, child_process_1.spawnSync)('node', ['dist/src/scripts/supportBundle.js'], { encoding: 'utf8' });
    if (proc.status !== 0) {
        console.error('[bundle:validate] support bundle generation failed');
        console.error(proc.stderr || proc.stdout);
        process.exit(1);
    }
    let json;
    try {
        json = JSON.parse(proc.stdout.split('\n').slice(-jsonLines(proc.stdout)).join('\n'));
    }
    catch {
        try {
            json = JSON.parse(proc.stdout);
        }
        catch (e) {
            console.error('[bundle:validate] failed to parse JSON');
            process.exit(1);
        }
    }
    const required = ['generatedAt', 'metrics', 'slowQueryPatterns', 'recentSlowQueries', 'tokenCleanup'];
    const missing = required.filter(k => !(k in json));
    if (missing.length) {
        console.error('[bundle:validate] missing keys', missing);
        process.exit(1);
    }
    if (!json.metrics.counters || !json.metrics.gauges) {
        console.error('[bundle:validate] metrics structure incomplete');
        process.exit(1);
    }
    console.log('[bundle:validate] OK');
}
function jsonLines(out) { return Math.min(400, out.split('\n').length); }
main();
