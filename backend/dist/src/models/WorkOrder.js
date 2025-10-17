"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrder = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class WorkOrder extends sequelize_1.Model {
}
exports.WorkOrder = WorkOrder;
WorkOrder.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    projectId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    status: { type: sequelize_1.DataTypes.ENUM('pending', 'assigned', 'in_progress', 'blocked', 'completed', 'cancelled'), allowNull: false, defaultValue: 'pending' },
    priority: { type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'urgent'), allowNull: false, defaultValue: 'medium' },
    assignedUserId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    estimatedHours: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    actualHours: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    startDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    dueDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    completedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
}, {
    sequelize: database_1.sequelize,
    tableName: 'work_orders',
    modelName: 'WorkOrder',
    // Migrations created camelCase column names (projectId, assignedUserId, etc.)
    // Global define uses underscored:true in development which would make the model
    // expect project_id. Disable underscored for this model to match existing schema.
    underscored: false
});
exports.default = WorkOrder;
