"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookSubscription = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class WebhookSubscription extends sequelize_1.Model {
}
exports.WebhookSubscription = WebhookSubscription;
WebhookSubscription.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    eventType: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    targetUrl: { type: sequelize_1.DataTypes.STRING(500), allowNull: false },
    secret: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    isActive: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    failureCount: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastSuccessAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    lastFailureAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
}, {
    sequelize: database_1.sequelize,
    tableName: 'webhook_subscriptions',
    modelName: 'WebhookSubscription',
    underscored: true,
    indexes: [{ fields: ['eventType'] }, { fields: ['isActive'] }]
});
exports.default = WebhookSubscription;
