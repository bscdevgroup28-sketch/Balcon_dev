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
Object.defineProperty(exports, "__esModule", { value: true });
require("../bootstrap");
const aggregateDailyKpis_1 = require("./aggregateDailyKpis");
const EventLog_1 = require("../../models/EventLog");
const InventoryTransaction_1 = require("../../models/InventoryTransaction");
const KpiDailySnapshot_1 = require("../../models/KpiDailySnapshot");
const Material_1 = require("../../models/Material");
// Ensure DATABASE_URL fallback for local invocation
// If isolated run requested, override DB file (done before any connection use ideally)
if (process.env.KPI_ISOLATED_DB === 'true') {
    process.env.DATABASE_URL = 'sqlite://kpi_temp.sqlite';
}
else if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('sqlite')) {
    process.env.DATABASE_URL = 'sqlite://enhanced_database.sqlite';
}
Promise.resolve().then(async () => {
    const isolated = process.env.KPI_ISOLATED_DB === 'true';
    if (isolated) {
        // Attempt migration-based setup first
        try {
            const { spawnSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
            const r = spawnSync('node', ['-r', 'ts-node/register', 'src/scripts/migrate.ts', 'up'], { stdio: 'inherit' });
            if (r.status !== 0) {
                console.warn('[kpi] Migration path failed; falling back to direct sync subset');
            }
        }
        catch (e) {
            console.warn('[kpi] Migration attempt errored, fallback to sync', e.message);
        }
    }
    // Ensure subset exists (fallback or supplement post-migrations)
    await Material_1.Material.sync();
    await EventLog_1.EventLog.sync();
    await InventoryTransaction_1.InventoryTransaction.sync();
    await KpiDailySnapshot_1.KpiDailySnapshot.sync();
    if (isolated) {
        const existingMaterials = await Material_1.Material.count();
        if (existingMaterials === 0) {
            const mat = await Material_1.Material.create({
                name: 'Steel Beam', category: 'Structural', unitOfMeasure: 'pieces', currentStock: 100, minimumStock: 10, reorderPoint: 20,
                unitCost: 50, markupPercentage: 20, sellingPrice: 60, leadTimeDays: 5, status: 'active'
            });
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000 + 60 * 60 * 1000);
            const yIso = yesterday.toISOString();
            await EventLog_1.EventLog.create({ name: 'quote.sent', timestamp: yesterday, payload: { id: 1 } });
            await EventLog_1.EventLog.create({ name: 'quote.accepted', timestamp: new Date(yesterday.getTime() + 10 * 60 * 1000), payload: { id: 1 } });
            await EventLog_1.EventLog.create({ name: 'order.created', timestamp: yesterday, payload: { id: 10, createdAt: yIso } });
            await EventLog_1.EventLog.create({ name: 'order.delivered', timestamp: new Date(yesterday.getTime() + 6 * 60 * 60 * 1000), payload: { id: 10, createdAt: yIso, deliveredAt: new Date(yesterday.getTime() + 6 * 60 * 60 * 1000).toISOString() } });
            await InventoryTransaction_1.InventoryTransaction.create({ materialId: mat.id, type: 'receipt', direction: 'in', quantity: 10, resultingStock: 110 });
            await InventoryTransaction_1.InventoryTransaction.create({ materialId: mat.id, type: 'consumption', direction: 'out', quantity: 4, resultingStock: 106 });
        }
    }
    return (0, aggregateDailyKpis_1.aggregateDailyKpis)();
}).then(r => {
    // eslint-disable-next-line no-console
    console.log('[kpi] local aggregation result', r);
    process.exit(0);
}).catch(err => {
    console.error('[kpi] local aggregation failed', err);
    process.exit(1);
});
