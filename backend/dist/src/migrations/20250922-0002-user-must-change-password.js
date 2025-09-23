"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up({ context }) {
    await context.addColumn('enhanced_users', 'must_change_password', {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    });
}
async function down({ context }) {
    await context.removeColumn('enhanced_users', 'must_change_password');
}
