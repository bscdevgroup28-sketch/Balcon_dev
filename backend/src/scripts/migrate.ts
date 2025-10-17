import { logger } from '../utils/logger';
import { runAllMigrations, migrationStatus, createUmzug } from './migrationLoader';

const cmd = process.argv[2];

async function run() {
  try {
    switch (cmd) {
      case 'up':
        await runAllMigrations();
        break;
      case 'down':
        await createUmzug().down();
        break;
      case 'pending':
        console.log((await migrationStatus()).pending);
        break;
      case 'status':
        console.log(await migrationStatus());
        break;
      default:
        logger.info('Usage: migrate.ts <up|down|pending|status>');
    }
  } catch (e) {
    logger.error('Migration command failed', e);
    process.exit(1);
  }
}

run();
