"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.addColumn('work_orders', 'team', { type: sequelize_1.DataTypes.STRING(100), allowNull: true });
        // Helpful indexes for scheduling queries
        try {
            await queryInterface.addIndex('work_orders', ['startDate']);
        }
        catch { }
        try {
            await queryInterface.addIndex('work_orders', ['dueDate']);
        }
        catch { }
        try {
            await queryInterface.addIndex('work_orders', ['team']);
        }
        catch { }
    },
    down: async (queryInterface) => {
        await queryInterface.removeColumn('work_orders', 'team');
        // Index removals are optional; many dialects drop with column.
    }
};
