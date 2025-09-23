"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlag = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class FeatureFlag extends sequelize_1.Model {
}
exports.FeatureFlag = FeatureFlag;
FeatureFlag.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, unique: true },
    enabled: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    description: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
    rolloutStrategy: { field: 'rollout_strategy', type: sequelize_1.DataTypes.STRING(50), allowNull: false, defaultValue: 'boolean' },
    percentage: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 100 } },
    audienceRoles: { field: 'audience_roles', type: sequelize_1.DataTypes.JSON, allowNull: true },
    metadata: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    createdAt: { field: 'created_at', type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    updatedAt: { field: 'updated_at', type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
}, {
    sequelize: database_1.sequelize,
    tableName: 'feature_flags',
    underscored: true,
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
});
exports.default = FeatureFlag;
