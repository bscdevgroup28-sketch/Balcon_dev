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
exports.closeDatabase = exports.connectDatabase = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const environment_1 = require("./environment");
const logger_1 = require("../utils/logger");
require("../instrumentation/queryMonitor");
let databaseUrl = environment_1.config.database.url || 'sqlite:./enhanced_database.sqlite';
const isSQLite = databaseUrl.startsWith('sqlite://') || databaseUrl.startsWith('sqlite:');
// Normalize sqlite:./path forms into sqlite://./path so replacement logic yields correct relative file
if (isSQLite && databaseUrl.startsWith('sqlite:./') && !databaseUrl.startsWith('sqlite://')) {
    databaseUrl = databaseUrl.replace('sqlite:./', 'sqlite://./');
}
// Hard guard: never allow SQLite in production unless explicitly overridden for demo
const allowSqliteInProd = (process.env.ALLOW_SQLITE_IN_PROD || '').toLowerCase() === '1' || (process.env.ALLOW_SQLITE_IN_PROD || '').toLowerCase() === 'true';
if (environment_1.config.server.nodeEnv === 'production' && isSQLite && !allowSqliteInProd) {
    // eslint-disable-next-line no-console
    console.error('[database] Refusing to start: SQLite detected while NODE_ENV=production. Set DATABASE_URL to a Postgres connection string or ALLOW_SQLITE_IN_PROD=1 for demo.');
    throw new Error('Production environment misconfiguration: SQLite is not allowed. Configure DATABASE_URL for Postgres.');
}
exports.sequelize = new sequelize_1.Sequelize(databaseUrl, {
    dialect: isSQLite ? 'sqlite' : 'postgres',
    logging: (msg) => logger_1.logger.debug(msg),
    pool: isSQLite ? undefined : environment_1.config.database.pool,
    dialectOptions: !isSQLite && environment_1.config.server.nodeEnv === 'production' ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        keepAlive: true
    } : {},
    define: {
        timestamps: true,
        // Use camelCase columns for SQLite to match existing migration definitions.
        // Postgres keeps previous behavior (underscored except in test) if needed.
        underscored: isSQLite ? false : (environment_1.config.server.nodeEnv !== 'test'),
        freezeTableName: true,
    },
    storage: isSQLite ? (databaseUrl === 'sqlite::memory:' ? ':memory:' : databaseUrl.replace('sqlite://', '')) : undefined,
});
// In test environment with SQLite, disable model indexes to avoid addIndex failures with in-memory DB edge cases
if (environment_1.config.server.nodeEnv === 'test' && isSQLite) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Model } = require('sequelize');
    const originalInit = Model.init;
    Model.init = function (attributes, options) {
        if (options && Array.isArray(options.indexes)) {
            options.indexes = []; // strip indexes for test speed & stability
        }
        return originalInit.call(this, attributes, options);
    };
}
const connectDatabase = async () => {
    try {
        await exports.sequelize.authenticate();
        logger_1.logger.info('Database connection established successfully');
        // Postgres session configuration (timeout + UTC) (skip for sqlite)
        if (!isSQLite) {
            try {
                const statementTimeoutMs = process.env.DB_STATEMENT_TIMEOUT_MS || '10000';
                await exports.sequelize.query(`SET statement_timeout = ${parseInt(statementTimeoutMs, 10)}`);
                await exports.sequelize.query(`SET TIME ZONE 'UTC'`);
                logger_1.logger.info('[db] Session configured', { statementTimeoutMs, timeZone: 'UTC' });
            }
            catch (e) {
                logger_1.logger.warn('[db] Failed to set session parameters', { error: e.message });
            }
        }
        // Ensure models are loaded so migrations referencing them (if any) have metadata
        await Promise.resolve().then(() => __importStar(require('../models')));
        // Run migrations instead of sync. This enforces forward-only schema changes.
        const { runAllMigrations, migrationStatus } = await Promise.resolve().then(() => __importStar(require('../scripts/migrationLoader')));
        if (environment_1.config.server.nodeEnv === 'development') {
            // Optional destructive reset only if explicitly requested via env var
            if (process.env.DEV_DB_RESET === 'true') {
                logger_1.logger.warn('DEV_DB_RESET=true -> dropping & reinitializing database BEFORE migrations');
                await exports.sequelize.drop();
            }
        }
        const before = await migrationStatus();
        logger_1.logger.info('[db] Migration status', { pending: before.pending.length, executed: before.executed.length });
        if (before.pending.length) {
            logger_1.logger.info(`Applying ${before.pending.length} pending migrations`, { pending: before.pending });
            await runAllMigrations();
            const after = await migrationStatus();
            logger_1.logger.info('Migrations complete', { executed: after.executed.length });
        }
        else {
            logger_1.logger.info('No pending migrations');
        }
        // Light table metrics (Postgres only) – counts for selected critical tables
        if (!isSQLite) {
            try {
                const tables = ['users', 'projects', 'refresh_tokens'];
                for (const t of tables) {
                    const [[row]] = await exports.sequelize.query(`SELECT COUNT(*)::int AS count FROM ${t}`);
                    logger_1.logger.info('[db] table count', { table: t, count: row.count });
                }
            }
            catch (e) {
                logger_1.logger.warn('[db] Failed to collect table counts', { error: e.message });
            }
        }
        // Optional dev seed (non-destructive) if requested
        if (environment_1.config.server.nodeEnv === 'development' && process.env.DEV_DB_SEED === 'true') {
            try {
                const { createSeedData } = await Promise.resolve().then(() => __importStar(require('../scripts/initDatabase')));
                await createSeedData();
                logger_1.logger.info('Development seed data injected');
            }
            catch (e) {
                logger_1.logger.error('Failed to seed development data', e);
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Unable to connect/migrate the database:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const closeDatabase = async () => {
    try {
        await exports.sequelize.close();
        logger_1.logger.info('Database connection closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connection:', error);
        throw error;
    }
};
exports.closeDatabase = closeDatabase;
