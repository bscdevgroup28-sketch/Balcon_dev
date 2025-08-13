import { app } from './app';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { connectDatabase, closeDatabase } from './config/database';
import { ensureDirectoriesExist } from './utils/fileSystem';

const startServer = async () => {
  try {
    // Ensure required directories exist
    ensureDirectoriesExist();
    logger.info('✅ File system directories ready');

    // Connect to database
    await connectDatabase();
    logger.info('✅ Database connected successfully');

    // Start server
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📝 Environment: ${config.server.nodeEnv}`);
      logger.info(`🌐 CORS Origin: ${config.server.corsOrigin}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }
        
        try {
          await closeDatabase();
          logger.info('✅ Database connection closed');
          logger.info('✅ Server shutdown completed successfully');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during database shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
