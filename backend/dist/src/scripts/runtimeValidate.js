"use strict";
/*
 * Runtime Deployment Validation Script
 * Performs a shallow / deep health check and (if credentials supplied) a basic auth + export workflow.
 *
 * Environment Variables:
 *   RUNTIME_BACKEND_URL   (default: http://localhost:8082)
 *   RUNTIME_FRONTEND_URL  (optional, only logged)
 *   RUNTIME_EMAIL         (admin or test user email to login)
 *   RUNTIME_PASSWORD      (password for login)
 *   RUNTIME_AUTO_BROWSER  ("1" to open default browser with autoLogin params for frontend session)
 *   RUNTIME_TIMEOUT_MS    (overall timeout for export polling, default 60000)
 *   RUNTIME_EXPORT_TYPE   (default materials_csv)
 *   RUNTIME_BROWSER_FLOW  ("1" to skip programmatic login and prompt for token after browser login)
 *   RUNTIME_SKIP_HEALTH   ("1" to continue even if deep health fails - NOT recommended except for debugging)
 */
const backendBase = process.env.RUNTIME_BACKEND_URL || 'http://localhost:8082';
const frontendBase = process.env.RUNTIME_FRONTEND_URL;
const email = process.env.RUNTIME_EMAIL;
const password = process.env.RUNTIME_PASSWORD;
const exportType = process.env.RUNTIME_EXPORT_TYPE || 'materials_csv';
const autoBrowser = process.env.RUNTIME_AUTO_BROWSER === '1';
const skipHealth = process.env.RUNTIME_SKIP_HEALTH === '1';
const pollTimeout = parseInt(process.env.RUNTIME_TIMEOUT_MS || '60000');
const pollInterval = 1500;
const browserFlow = process.env.RUNTIME_BROWSER_FLOW === '1';
function banner(msg) { console.log(`\n==== ${msg} ====`); }
async function safeFetch(url, init) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const resp = await fetch(url, { ...(init || {}), signal: controller.signal });
        return resp;
    }
    finally {
        clearTimeout(timeout);
    }
}
async function stepDeepHealth() {
    const url = `${backendBase}/api/health/deep`;
    try {
        const r = await safeFetch(url);
        if (!r.ok)
            return { name: 'deepHealth', ok: false, error: `HTTP ${r.status}` };
        const json = await r.json();
        return { name: 'deepHealth', ok: json.ok === true, details: json, error: json.ok ? undefined : json.error };
    }
    catch (e) {
        const cause = e?.cause ? (e.cause.code || e.cause.message || 'cause-unknown') : '';
        return { name: 'deepHealth', ok: false, error: e.message + (cause ? ` (${cause})` : '') };
    }
}
async function stepLogin() {
    if (!email || !password) {
        return { name: 'login', ok: false, error: 'Credentials not provided (set RUNTIME_EMAIL & RUNTIME_PASSWORD)' };
    }
    try {
        const r = await safeFetch(`${backendBase}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const json = await r.json().catch(() => ({}));
        if (!r.ok || !json?.data?.accessToken)
            return { name: 'login', ok: false, error: `Login failed: HTTP ${r.status}` };
        return { name: 'login', ok: true, details: { tokenSnippet: json.data.accessToken.slice(0, 16) + '...', user: json.data.user } };
    }
    catch (e) {
        return { name: 'login', ok: false, error: e.message };
    }
}
async function stepCreateExport(token) {
    try {
        const r = await safeFetch(`${backendBase}/api/exports`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ type: exportType, params: { format: 'csv', compression: 'none' } }) });
        const json = await r.json().catch(() => ({}));
        if (r.status !== 202 || !json.id)
            return { name: 'createExport', ok: false, error: `Failed: HTTP ${r.status}` };
        return { name: 'createExport', ok: true, details: { id: json.id } };
    }
    catch (e) {
        return { name: 'createExport', ok: false, error: e.message };
    }
}
async function pollExport(id, token) {
    const start = Date.now();
    while (Date.now() - start < pollTimeout) {
        try {
            const r = await safeFetch(`${backendBase}/api/exports/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await r.json().catch(() => ({}));
            if (json.status === 'completed') {
                return { name: 'exportComplete', ok: true, details: { durationMs: Date.now() - start, id, resultUrl: json.resultUrl } };
            }
            if (json.status === 'failed') {
                return { name: 'exportComplete', ok: false, error: json.errorMessage || 'Export failed', details: { id } };
            }
        }
        catch (e) {
            return { name: 'exportComplete', ok: false, error: e.message };
        }
        await new Promise(r => setTimeout(r, pollInterval));
    }
    return { name: 'exportComplete', ok: false, error: `Timeout after ${pollTimeout}ms` };
}
async function run() {
    console.log('Runtime Validation Script');
    console.log(`Backend: ${backendBase}`);
    if (frontendBase)
        console.log(`Frontend: ${frontendBase}`);
    banner('Health');
    const health = await stepDeepHealth();
    console.log(health.ok ? '✅ Deep health OK' : `❌ Deep health failed: ${health.error}`);
    if (!health.ok && !skipHealth) {
        console.log('Aborting further steps since health failed (override with RUNTIME_SKIP_HEALTH=1).');
        process.exit(1);
    }
    let login;
    let fullToken;
    if (browserFlow) {
        banner('Browser Login Flow');
        if (!frontendBase) {
            console.log('❌ RUNTIME_BROWSER_FLOW=1 requires RUNTIME_FRONTEND_URL to open login page.');
            process.exit(1);
        }
        const loginUrl = `${frontendBase}/login`;
        console.log('Opening browser for manual authentication...');
        try {
            const openCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { exec } = require('child_process');
            exec(`${openCmd} "${loginUrl}"`);
            console.log(`➡️  If it did not open automatically, navigate manually to: ${loginUrl}`);
        }
        catch (e) {
            console.log('⚠️  Auto-open failed. Please manually visit:', loginUrl);
        }
        console.log('\nAfter logging in, open your browser devtools console and run:');
        console.log('  localStorage.getItem("token")');
        console.log('Copy the token value and paste it below. Press Enter when ready.');
        // Prompt user for token
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        fullToken = await new Promise((resolve) => rl.question('Paste access token: ', (ans) => { rl.close(); resolve(ans.trim()); }));
        if (!fullToken) {
            console.log('❌ No token provided. Aborting.');
            process.exit(1);
        }
        // Quick validation attempt: call a protected endpoint (exports list)
        const testResp = await safeFetch(`${backendBase}/api/exports`, { headers: { 'Authorization': `Bearer ${fullToken}` } });
        if (testResp.status === 401) {
            console.log('❌ Provided token was rejected (401).');
            process.exit(1);
        }
        console.log('✅ Token accepted, proceeding.');
        login = { name: 'login', ok: true, details: { mode: 'browser', tokenSnippet: fullToken.slice(0, 16) + '...' } };
    }
    else {
        banner('Auth');
        login = await stepLogin();
        if (!login.ok) {
            console.log(`⚠️  Login skipped/failed: ${login.error}`);
            console.log('Either supply credentials env vars OR set RUNTIME_BROWSER_FLOW=1 to authenticate manually.');
            banner('Summary');
            console.table([health, login]);
            process.exit(health.ok ? 0 : 1);
        }
        else {
            console.log('✅ Login successful');
        }
        // Re-login to get full token (kept ephemeral only in closure)
        const relog = await safeFetch(`${backendBase}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const relogJson = await relog.json();
        fullToken = relogJson?.data?.accessToken;
        if (!fullToken) {
            console.log('❌ Could not retrieve access token for export step');
            process.exit(1);
        }
    }
    banner('Export Workflow');
    const created = await stepCreateExport(fullToken);
    console.log(created.ok ? `✅ Export enqueued (id=${created.details.id})` : `❌ Export enqueue failed: ${created.error}`);
    let exportResult;
    if (created.ok) {
        exportResult = await pollExport(created.details.id, fullToken);
        console.log(exportResult.ok ? `✅ Export completed in ${exportResult.details.durationMs}ms` : `❌ Export failed: ${exportResult.error}`);
    }
    if (!browserFlow && autoBrowser && frontendBase && email && password) {
        try {
            const autoUrl = `${frontendBase}/login?autoLogin=1&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
            // Attempt to open system browser (cross-platform best-effort)
            const openCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { exec } = require('child_process');
            exec(`${openCmd} "${autoUrl}"`);
            console.log(`🌐 Launched browser for auto login: ${autoUrl}`);
        }
        catch (e) {
            console.log('Could not auto-open browser:', e.message);
        }
    }
    banner('Summary');
    const summary = [health, login, created, exportResult].filter(Boolean);
    console.table(summary.map(s => ({ step: s.name, ok: s.ok, error: s.error })));
    const allOk = summary.every(s => s.ok);
    process.exit(allOk ? 0 : 1);
}
run().catch(err => {
    console.error('Unexpected error in runtime validator:', err);
    process.exit(1);
});
