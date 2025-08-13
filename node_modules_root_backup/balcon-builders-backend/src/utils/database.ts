import { sequelize } from '../config/database';
import { logger } from '../utils/logger';
import '../models'; // Import models to register them

export async function syncDatabase(force: boolean = false): Promise<void> {
  try {
    logger.info('Starting database synchronization...');
    
    // Test the connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Synchronize all models
    await sequelize.sync({ force, alter: !force });
    
    if (force) {
      logger.info('Database synchronized with force=true (all tables recreated)');
    } else {
      logger.info('Database synchronized successfully');
    }
  } catch (error) {
    logger.error('Unable to sync database:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  syncDatabase()
    .then(() => {
      logger.info('Database sync completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database sync failed:', error);
      process.exit(1);
    });
}
