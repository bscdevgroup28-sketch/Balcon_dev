import { Sequelize } from 'sequelize';
import { config } from './environment';
import { logger } from '../utils/logger';
import '../instrumentation/queryMonitor';

let databaseUrl: string = config.database.url || 'sqlite:./enhanced_database.sqlite';
const isSQLite = databaseUrl.startsWith('sqlite://') || databaseUrl.startsWith('sqlite:');
// Normalize sqlite:./path forms into sqlite://./path so replacement logic yields correct relative file
if (isSQLite && databaseUrl.startsWith('sqlite:./') && !databaseUrl.startsWith('sqlite://')) {
  databaseUrl = databaseUrl.replace('sqlite:./', 'sqlite://./');
}

// Hard guard: never allow SQLite in production deployments to Railway / real environments
if (config.server.nodeEnv === 'production' && isSQLite) {
  // eslint-disable-next-line no-console
  console.error('[database] Refusing to start: SQLite detected while NODE_ENV=production. Set DATABASE_URL to a Postgres connection string.');
  throw new Error('Production environment misconfiguration: SQLite is not allowed. Configure DATABASE_URL for Postgres.');
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: isSQLite ? 'sqlite' : 'postgres',
  logging: (msg: string) => logger.debug(msg),
  pool: isSQLite ? undefined : config.database.pool,
  dialectOptions: !isSQLite && config.server.nodeEnv === 'production' ? {
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
    underscored: isSQLite ? false : (config.server.nodeEnv !== 'test'),
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

    // Postgres session configuration (timeout + UTC) (skip for sqlite)
    if (!isSQLite) {
      try {
        const statementTimeoutMs = process.env.DB_STATEMENT_TIMEOUT_MS || '10000';
        await sequelize.query(`SET statement_timeout = ${parseInt(statementTimeoutMs, 10)}`);
        await sequelize.query(`SET TIME ZONE 'UTC'`);
        logger.info('[db] Session configured', { statementTimeoutMs, timeZone: 'UTC' });
      } catch (e:any) {
        logger.warn('[db] Failed to set session parameters', { error: e.message });
      }
    }

    // Ensure models are loaded so migrations referencing them (if any) have metadata
    await import('../models');

    // Run migrations instead of sync. This enforces forward-only schema changes.
    const { runAllMigrations, migrationStatus } = await import('../scripts/migrationLoader');

    if (config.server.nodeEnv === 'development') {
      // Optional destructive reset only if explicitly requested via env var
      if (process.env.DEV_DB_RESET === 'true') {
        logger.warn('DEV_DB_RESET=true -> dropping & reinitializing database BEFORE migrations');
        await sequelize.drop();
      }
    }

    const before = await migrationStatus();
    logger.info('[db] Migration status', { pending: before.pending.length, executed: before.executed.length });
    if (before.pending.length) {
      logger.info(`Applying ${before.pending.length} pending migrations`, { pending: before.pending });
      await runAllMigrations();
      const after = await migrationStatus();
      logger.info('Migrations complete', { executed: after.executed.length });
    } else {
      logger.info('No pending migrations');
    }

    // Light table metrics (Postgres only) – counts for selected critical tables
    if (!isSQLite) {
      try {
        const tables = ['users', 'projects', 'refresh_tokens'];
        for (const t of tables) {
          const [[row]]: any = await sequelize.query(`SELECT COUNT(*)::int AS count FROM ${t}`);
          logger.info('[db] table count', { table: t, count: row.count });
        }
      } catch (e:any) {
        logger.warn('[db] Failed to collect table counts', { error: e.message });
      }
    }

    // Optional dev seed (non-destructive) if requested
    if (config.server.nodeEnv === 'development' && process.env.DEV_DB_SEED === 'true') {
      try {
        const { createSeedData } = await import('../scripts/initDatabase');
        await createSeedData();
        logger.info('Development seed data injected');
      } catch (e) {
        logger.error('Failed to seed development data', e);
      }
    }
  } catch (error) {
    logger.error('Unable to connect/migrate the database:', error);
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
