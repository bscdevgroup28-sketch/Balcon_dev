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
// Run migrations against a fresh sqlite DB, seed minimal event/inventory data, then aggregate KPIs.
// Usage: ts-node src/scripts/jobs/kpiMigratedIsolated.ts kpi_kpiagg.sqlite
const dbFileArg = process.argv[2] || 'kpi_kpiagg.sqlite';
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `sqlite:./${dbFileArg}`;
}
const migrationLoader_1 = require("../migrationLoader");
async function main() {
    await (0, migrationLoader_1.runAllMigrations)();
    // Import models after migrations
    const { EventLog, InventoryTransaction, Material } = await Promise.resolve().then(() => __importStar(require('../../models')));
    const { aggregateDailyKpis } = await Promise.resolve().then(() => __importStar(require('./aggregateDailyKpis')));
    // Seed only if empty
    const evCount = await EventLog.count();
    if (evCount === 0) {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000 + 60 * 60 * 1000);
        const createdAt = yesterday;
        const deliveredAt = new Date(yesterday.getTime() + 6 * 60 * 60 * 1000);
        await EventLog.bulkCreate([
            { name: 'quote.sent', timestamp: createdAt, payload: { id: 1 } },
            { name: 'quote.accepted', timestamp: new Date(createdAt.getTime() + 10 * 60 * 1000), payload: { id: 1 } },
            { name: 'order.created', timestamp: createdAt, payload: { id: 10, createdAt: createdAt.toISOString() } },
            { name: 'order.delivered', timestamp: deliveredAt, payload: { id: 10, createdAt: createdAt.toISOString(), deliveredAt: deliveredAt.toISOString() } }
        ]);
        // Ensure a material exists for FK (id=1)
        const material = await Material.create({
            name: 'Test Material',
            category: 'general',
            unitOfMeasure: 'unit',
            currentStock: 100,
            minimumStock: 10,
            reorderPoint: 20,
            unitCost: 5,
            markupPercentage: 20,
            sellingPrice: 6, // will be recalculated by hook but provide anyway
            leadTimeDays: 7,
            status: 'active'
        });
        await InventoryTransaction.bulkCreate([
            { materialId: material.id, type: 'receipt', direction: 'in', quantity: 10, resultingStock: 110 },
            { materialId: material.id, type: 'consumption', direction: 'out', quantity: 4, resultingStock: 106 },
        ]);
    }
    const result = await aggregateDailyKpis();
    console.log('[kpi:migrated-isolated] result:', result);
}
main().catch(e => { console.error(e); process.exit(1); });
