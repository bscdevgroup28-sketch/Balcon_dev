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
exports.ensureMigrations = ensureMigrations;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}
// Migration guard utility (opt-in import by runtime code)
async function ensureMigrations(migrateIfDev = true) {
    try {
        const { migrationStatus, runAllMigrations } = await Promise.resolve().then(() => __importStar(require('./migrationLoader')));
        const status = await migrationStatus();
        if (process.env.NODE_ENV === 'production') {
            if (status.pending.length) {
                // Fail fast in production if migrations missing
                // eslint-disable-next-line no-console
                console.error(`[startup] ${status.pending.length} pending migrations. Abort.`);
                process.exit(1);
            }
        }
        else if (migrateIfDev && status.pending.length) {
            // eslint-disable-next-line no-console
            console.log(`[startup] Auto-applying ${status.pending.length} pending migrations in ${process.env.NODE_ENV}`);
            await runAllMigrations();
        }
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.error('[startup] Migration guard failed', e);
        if (process.env.NODE_ENV === 'production')
            process.exit(1);
    }
}
