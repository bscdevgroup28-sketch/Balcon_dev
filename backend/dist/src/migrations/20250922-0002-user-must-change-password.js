"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(arg) {
    const context = arg.context || arg;
    const table = await context.describeTable('enhanced_users').catch(() => null);
    if (table && !table['must_change_password']) {
        await context.addColumn('enhanced_users', 'must_change_password', {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        });
    }
}
async function down(arg) {
    const context = arg.context || arg;
    const table = await context.describeTable('enhanced_users').catch(() => null);
    if (table && table['must_change_password']) {
        await context.removeColumn('enhanced_users', 'must_change_password');
    }
}
