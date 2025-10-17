"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const TARGETS = (process.env.SYNTHETIC_ENDPOINTS || '/api/health,/api/projects').split(',').map(s => s.trim()).filter(Boolean);
const BASE = process.env.SYNTHETIC_BASE_URL || 'http://localhost:8082';
async function check(url) {
    const started = Date.now();
    try {
        const mod = await Promise.resolve().then(() => __importStar(require('node-fetch')));
        const fetchFn = mod.default || mod;
        const resp = await fetchFn(BASE + url, { method: 'GET', headers: { 'Accept': 'application/json' } });
        const latencyMs = Date.now() - started;
        return { endpoint: url, ok: resp.ok, status: resp.status, latencyMs };
    }
    catch (e) {
        return { endpoint: url, ok: false, status: 0, latencyMs: Date.now() - started, error: e.message };
    }
}
(async function main() {
    const results = [];
    for (const t of TARGETS) {
        results.push(await check(t));
    }
    const availability = results.filter(r => r.ok).length / (results.length || 1);
    const out = { timestamp: new Date().toISOString(), base: BASE, availability, results };
    console.log(JSON.stringify(out, null, 2));
    try {
        const dir = path_1.default.join(process.cwd(), 'probe-history');
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        const file = path_1.default.join(dir, 'probe-history.json');
        let hist = [];
        if (fs_1.default.existsSync(file)) {
            try {
                hist = JSON.parse(fs_1.default.readFileSync(file, 'utf8'));
            }
            catch {
                hist = [];
            }
        }
        hist.push(out);
        if (hist.length > 200)
            hist.splice(0, hist.length - 200);
        fs_1.default.writeFileSync(file, JSON.stringify(hist, null, 2));
    }
    catch { /* ignore */ }
})();
