"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMigrationStatus = exports.rollbackMigrations = exports.runMigrations = void 0;
const umzug_1 = require("umzug");
const database_1 = require("../config/database");
const path_1 = __importDefault(require("path"));
const umzug = new umzug_1.Umzug({
    migrations: {
        glob: path_1.default.join(__dirname, '../migrations/*.ts'),
        resolve: ({ name, path: migrationPath }) => {
            const migration = require(migrationPath);
            return {
                name,
                up: () => migration.up(database_1.sequelize.getQueryInterface()),
                down: () => migration.down(database_1.sequelize.getQueryInterface()),
            };
        },
    },
    context: database_1.sequelize.getQueryInterface(),
    storage: new umzug_1.SequelizeStorage({ sequelize: database_1.sequelize }),
    logger: console,
});
async function runMigrations() {
    try {
        console.log('Starting database migrations...');
        const migrations = await umzug.up();
        if (migrations.length === 0) {
            console.log('No migrations to run');
        }
        else {
            console.log(`Successfully executed ${migrations.length} migrations:`);
            migrations.forEach((migration) => {
                console.log(`  ✓ ${migration.name}`);
            });
        }
    }
    catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}
exports.runMigrations = runMigrations;
async function rollbackMigrations(count = 1) {
    try {
        console.log(`Rolling back ${count} migration(s)...`);
        const migrations = await umzug.down({ count });
        console.log(`Successfully rolled back ${migrations.length} migrations:`);
        migrations.forEach((migration) => {
            console.log(`  ✓ ${migration.name}`);
        });
    }
    catch (error) {
        console.error('Rollback failed:', error);
        throw error;
    }
}
exports.rollbackMigrations = rollbackMigrations;
async function getMigrationStatus() {
    try {
        const pending = await umzug.pending();
        const executed = await umzug.executed();
        console.log('\nMigration Status:');
        console.log('================');
        if (executed.length > 0) {
            console.log('\nExecuted migrations:');
            executed.forEach((migration) => {
                console.log(`  ✓ ${migration.name}`);
            });
        }
        if (pending.length > 0) {
            console.log('\nPending migrations:');
            pending.forEach((migration) => {
                console.log(`  - ${migration.name}`);
            });
        }
        else {
            console.log('\nAll migrations are up to date!');
        }
    }
    catch (error) {
        console.error('Failed to get migration status:', error);
        throw error;
    }
}
exports.getMigrationStatus = getMigrationStatus;
// CLI interface
if (require.main === module) {
    const command = process.argv[2];
    switch (command) {
        case 'up':
            runMigrations().catch(process.exit);
            break;
        case 'down':
            const count = parseInt(process.argv[3]) || 1;
            rollbackMigrations(count).catch(process.exit);
            break;
        case 'status':
            getMigrationStatus().catch(process.exit);
            break;
        default:
            console.log('Usage:');
            console.log('  npm run migrate up     - Run all pending migrations');
            console.log('  npm run migrate down   - Rollback last migration');
            console.log('  npm run migrate down 2 - Rollback last 2 migrations');
            console.log('  npm run migrate status - Show migration status');
            process.exit(1);
    }
}
