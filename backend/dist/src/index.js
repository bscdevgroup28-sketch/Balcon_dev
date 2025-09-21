"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const environment_1 = require("./config/environment");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const fileSystem_1 = require("./utils/fileSystem");
const startServer = async () => {
    try {
        // Ensure required directories exist
        (0, fileSystem_1.ensureDirectoriesExist)();
        logger_1.logger.info('✅ File system directories ready');
        // Connect to database
        await (0, database_1.connectDatabase)();
        logger_1.logger.info('✅ Database connected successfully');
        // Start server
        const server = app_1.app.listen(environment_1.config.server.port, () => {
            logger_1.logger.info(`🚀 Server running on port ${environment_1.config.server.port}`);
            logger_1.logger.info(`📝 Environment: ${environment_1.config.server.nodeEnv}`);
            logger_1.logger.info(`🌐 CORS Origin: ${environment_1.config.server.corsOrigin}`);
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`${signal} received. Starting graceful shutdown...`);
            server.close(async (err) => {
                if (err) {
                    logger_1.logger.error('Error during server shutdown:', err);
                    process.exit(1);
                }
                try {
                    await (0, database_1.closeDatabase)();
                    logger_1.logger.info('✅ Database connection closed');
                    logger_1.logger.info('✅ Server shutdown completed successfully');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error('❌ Error during database shutdown:', error);
                    process.exit(1);
                }
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
