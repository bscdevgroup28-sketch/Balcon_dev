"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
const migrationLoader_1 = require("./migrationLoader");
const cmd = process.argv[2];
async function run() {
    try {
        switch (cmd) {
            case 'up':
                await (0, migrationLoader_1.runAllMigrations)();
                break;
            case 'down':
                await (0, migrationLoader_1.createUmzug)().down();
                break;
            case 'pending':
                console.log((await (0, migrationLoader_1.migrationStatus)()).pending);
                break;
            case 'status':
                console.log(await (0, migrationLoader_1.migrationStatus)());
                break;
            default:
                logger_1.logger.info('Usage: migrate.ts <up|down|pending|status>');
        }
    }
    catch (e) {
        logger_1.logger.error('Migration command failed', e);
        process.exit(1);
    }
}
run();
