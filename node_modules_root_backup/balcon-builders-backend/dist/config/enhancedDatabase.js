"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEnhancedConnection = exports.enhancedSequelize = void 0;
const sequelize_1 = require("sequelize");
const logger_1 = require("../utils/logger");
// Enhanced database configuration for Phase 5
const isDevelopment = process.env.NODE_ENV !== 'production';
// Use a separate database for enhanced features
const databasePath = isDevelopment ?
    './enhanced_database.sqlite' :
    process.env.DATABASE_URL || './enhanced_database.sqlite';
exports.enhancedSequelize = new sequelize_1.Sequelize({
    dialect: 'sqlite',
    storage: databasePath,
    logging: isDevelopment ? (msg) => logger_1.logger.debug(msg) : false,
    define: {
        timestamps: true,
        underscored: true,
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
// Test the connection
const testEnhancedConnection = async () => {
    try {
        await exports.enhancedSequelize.authenticate();
        logger_1.logger.info('✅ Enhanced database connection established successfully');
        return true;
    }
    catch (error) {
        logger_1.logger.error('❌ Enhanced database connection failed:', error);
        return false;
    }
};
exports.testEnhancedConnection = testEnhancedConnection;
exports.default = exports.enhancedSequelize;
