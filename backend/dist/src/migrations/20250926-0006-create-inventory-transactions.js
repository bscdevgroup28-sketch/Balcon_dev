"use strict";
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable('inventory_transactions', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            material_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'materials', key: 'id' },
                onDelete: 'CASCADE'
            },
            type: { type: sequelize_1.DataTypes.ENUM('adjustment', 'receipt', 'consumption', 'return', 'correction'), allowNull: false },
            quantity: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false },
            direction: { type: sequelize_1.DataTypes.ENUM('in', 'out'), allowNull: false },
            reference_type: { type: sequelize_1.DataTypes.STRING, allowNull: true },
            reference_id: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            resulting_stock: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
            user_id: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
        });
        await queryInterface.addIndex('inventory_transactions', ['material_id']);
        await queryInterface.addIndex('inventory_transactions', ['type']);
        await queryInterface.addIndex('inventory_transactions', ['reference_type', 'reference_id']);
        await queryInterface.addIndex('inventory_transactions', ['created_at']);
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('inventory_transactions');
    }
};
