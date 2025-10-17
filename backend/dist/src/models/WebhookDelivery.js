"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookDelivery = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class WebhookDelivery extends sequelize_1.Model {
}
exports.WebhookDelivery = WebhookDelivery;
WebhookDelivery.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    subscriptionId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    eventType: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    status: { type: sequelize_1.DataTypes.ENUM('pending', 'delivered', 'failed'), allowNull: false, defaultValue: 'pending' },
    attemptCount: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    responseCode: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    errorMessage: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    nextRetryAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    payload: { type: sequelize_1.DataTypes.JSON, allowNull: false }
}, {
    sequelize: database_1.sequelize,
    tableName: 'webhook_deliveries',
    modelName: 'WebhookDelivery',
    underscored: true,
    indexes: [{ fields: ['subscriptionId'] }, { fields: ['eventType'] }, { fields: ['status'] }]
});
exports.default = WebhookDelivery;
