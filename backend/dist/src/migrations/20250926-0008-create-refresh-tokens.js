"use strict";
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable('refresh_tokens', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            user_id: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
            token_hash: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            expires_at: { type: sequelize_1.DataTypes.DATE, allowNull: false },
            created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            revoked_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            replaced_by_token: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
            ip_address: { type: sequelize_1.DataTypes.STRING(64), allowNull: true },
            user_agent: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
            reuse_detected: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
        });
        await queryInterface.addIndex('refresh_tokens', ['user_id']);
        await queryInterface.addIndex('refresh_tokens', ['token_hash']);
        await queryInterface.addIndex('refresh_tokens', ['expires_at']);
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('refresh_tokens');
    }
};
