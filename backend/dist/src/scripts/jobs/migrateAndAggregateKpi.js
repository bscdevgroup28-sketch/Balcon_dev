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
// Executes migrations then runs the daily KPI aggregation once.
// Useful for local validation with a clean isolated SQLite file.
const database_1 = require("../../config/database");
const aggregateDailyKpis_1 = require("./aggregateDailyKpis");
const migrationLoader_1 = require("../migrationLoader");
async function main() {
    try {
        await (0, migrationLoader_1.runAllMigrations)();
        // Now import models after migrations ensured
        await Promise.resolve().then(() => __importStar(require('../../models')));
        const result = await (0, aggregateDailyKpis_1.aggregateDailyKpis)();
        console.log('[kpi] aggregation result:', JSON.stringify(result, null, 2));
    }
    catch (err) {
        console.error('[kpi] migrateAndAggregate failed', err);
        process.exitCode = 1;
    }
    finally {
        await database_1.sequelize.close();
    }
}
main();
