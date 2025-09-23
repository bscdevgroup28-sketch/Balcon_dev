"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import Umzug pragmatically to avoid ESM/CJS interop type issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Umzug } = require('umzug');
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const umzug = new Umzug({
    migrations: {
        glob: path_1.default.join(__dirname, '../migrations/*.ts'),
    },
    context: database_1.sequelize.getQueryInterface(),
    storage: {
        type: 'sequelize',
        sequelize: database_1.sequelize,
        modelName: 'migrations_meta'
    },
    logger: {
        info: (msg) => logger_1.logger.info(msg),
        warn: (msg) => logger_1.logger.warn(msg),
        error: (msg) => logger_1.logger.error(msg),
        debug: (msg) => logger_1.logger.debug(msg),
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
                logger_1.logger.info('Usage: migrate.ts <up|down|pending|status>');
        }
        await database_1.sequelize.close();
    }
    catch (e) {
        logger_1.logger.error('Migration command failed', e);
        process.exit(1);
    }
}
run();
