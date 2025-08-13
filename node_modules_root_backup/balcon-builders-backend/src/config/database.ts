import { Sequelize } from 'sequelize';
import { config } from './environment';
import { logger } from '../utils/logger';

const databaseUrl = config.database.url;
const isSQLite = databaseUrl.startsWith('sqlite://') || databaseUrl.startsWith('sqlite:');

export const sequelize = new Sequelize(databaseUrl, {
  dialect: isSQLite ? 'sqlite' : 'postgres',
  logging: (msg: string) => logger.debug(msg),
  pool: isSQLite ? undefined : config.database.pool,
  dialectOptions: !isSQLite && config.server.nodeEnv === 'production' ? {
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
  storage: isSQLite ? (databaseUrl === 'sqlite::memory:' ? ':memory:' : databaseUrl.replace('sqlite://', '')) : undefined,
});

// In test environment with SQLite, disable model indexes to avoid addIndex failures with in-memory DB edge cases
if (config.server.nodeEnv === 'test' && isSQLite) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Model } = require('sequelize');
  const originalInit = Model.init;
  Model.init = function(attributes: any, options: any) {
    if (options && Array.isArray(options.indexes)) {
      options.indexes = []; // strip indexes for test speed & stability
    }
    return originalInit.call(this, attributes, options);
  };
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Import all models to ensure they're registered
    await import('../models');
    
    if (config.server.nodeEnv === 'development') {
      // Import initialization script
      const { initializeDatabase } = await import('../scripts/initDatabase');
      await initializeDatabase();
    } else {
      // Production: only sync without force
      await sequelize.sync();
      logger.info('Database synchronized');
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};
