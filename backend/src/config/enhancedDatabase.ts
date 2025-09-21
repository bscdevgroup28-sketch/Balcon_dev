import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';

// Enhanced database configuration for Phase 5
const databaseUrl = process.env.DATABASE_URL || 'sqlite:./enhanced_database.sqlite';

export const enhancedSequelize = new Sequelize(databaseUrl, {
  logging: process.env.NODE_ENV !== 'production' ? (msg) => logger.debug(msg) : false,
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
export const testEnhancedConnection = async (): Promise<boolean> => {
  try {
    await enhancedSequelize.authenticate();
    logger.info('✅ Enhanced database connection established successfully');
    return true;
  } catch (error) {
    logger.error('❌ Enhanced database connection failed:', error);
    return false;
  }
};

export default enhancedSequelize;
