// Import Umzug pragmatically to avoid ESM/CJS interop type issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Umzug } = require('umzug');
import path from 'path';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../migrations/*.ts'),
  },
  context: sequelize.getQueryInterface(),
  storage: {
    type: 'sequelize',
  sequelize,
    modelName: 'migrations_meta'
  },
  logger: {
    info: (msg: string) => logger.info(msg),
    warn: (msg: string) => logger.warn(msg),
    error: (msg: string) => logger.error(msg),
    debug: (msg: string) => logger.debug(msg),
  }
});

const cmd = process.argv[2];

async function run() {
  try {
    switch (cmd) {
      case 'up':
        await umzug.up();
        break;
      case 'down':
        await umzug.down();
        break;
      case 'pending':
        console.log(await umzug.pending());
        break;
      case 'status':
        console.log({ executed: await umzug.executed(), pending: await umzug.pending() });
        break;
      default:
        logger.info('Usage: migrate.ts <up|down|pending|status>');
    }
  await sequelize.close();
  } catch (e) {
    logger.error('Migration command failed', e);
    process.exit(1);
  }
}

run();
