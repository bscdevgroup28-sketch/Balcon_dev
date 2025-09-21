"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDatabase = syncDatabase;
exports.closeDatabase = closeDatabase;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
require("../models"); // Import models to register them
async function syncDatabase(force = false) {
    try {
        logger_1.logger.info('Starting database synchronization...');
        // Test the connection
        await database_1.sequelize.authenticate();
        logger_1.logger.info('Database connection established successfully.');
        // Synchronize all models
        await database_1.sequelize.sync({ force, alter: !force });
        if (force) {
            logger_1.logger.info('Database synchronized with force=true (all tables recreated)');
        }
        else {
            logger_1.logger.info('Database synchronized successfully');
        }
    }
    catch (error) {
        logger_1.logger.error('Unable to sync database:', error);
        throw error;
    }
}
async function closeDatabase() {
    try {
        await database_1.sequelize.close();
        logger_1.logger.info('Database connection closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connection:', error);
        throw error;
    }
}
// Run if called directly
if (require.main === module) {
    syncDatabase()
        .then(() => {
        logger_1.logger.info('Database sync completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('Database sync failed:', error);
        process.exit(1);
    });
}
