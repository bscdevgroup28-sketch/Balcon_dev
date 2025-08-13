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
const databaseUrl = environment_1.config.database.url;
const isSQLite = databaseUrl.startsWith('sqlite://');
exports.sequelize = new sequelize_1.Sequelize(databaseUrl, {
    dialect: isSQLite ? 'sqlite' : 'postgres',
    logging: (msg) => logger_1.logger.debug(msg),
    pool: isSQLite ? undefined : environment_1.config.database.pool,
    dialectOptions: !isSQLite && environment_1.config.server.nodeEnv === 'production' ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {},
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
    },
    storage: isSQLite ? databaseUrl.replace('sqlite://', '') : undefined,
});
const connectDatabase = async () => {
    try {
        await exports.sequelize.authenticate();
        logger_1.logger.info('Database connection established successfully');
        // Import all models to ensure they're registered
        await Promise.resolve().then(() => __importStar(require('../models')));
        if (environment_1.config.server.nodeEnv === 'development') {
            // Import initialization script
            const { initializeDatabase } = await Promise.resolve().then(() => __importStar(require('../scripts/initDatabase')));
            await initializeDatabase();
        }
        else {
            // Production: only sync without force
            await exports.sequelize.sync();
            logger_1.logger.info('Database synchronized');
        }
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to the database:', error);
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
