"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAuditEvent = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class SecurityAuditEvent extends sequelize_1.Model {
}
exports.SecurityAuditEvent = SecurityAuditEvent;
SecurityAuditEvent.init({
    id: { type: sequelize_1.DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    action: { type: sequelize_1.DataTypes.STRING(120), allowNull: false },
    outcome: { type: sequelize_1.DataTypes.STRING(24), allowNull: false },
    actorUserId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, field: 'actor_user_id' },
    actorRole: { type: sequelize_1.DataTypes.STRING(60), allowNull: true, field: 'actor_role' },
    targetUserId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, field: 'target_user_id' },
    ip: { type: sequelize_1.DataTypes.STRING(64), allowNull: true },
    requestId: { type: sequelize_1.DataTypes.STRING(64), allowNull: true, field: 'request_id' },
    meta: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, field: 'created_at', defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: database_1.sequelize,
    tableName: 'security_audit_events',
    modelName: 'SecurityAuditEvent',
    timestamps: false,
    underscored: true,
    indexes: [
        { fields: ['action'] },
        { fields: ['outcome'] },
        { fields: ['actor_user_id'] },
        { fields: ['target_user_id'] },
        { fields: ['created_at'] },
    ]
});
exports.default = SecurityAuditEvent;
