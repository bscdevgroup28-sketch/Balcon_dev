"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryTransaction = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Material_1 = require("./Material");
class InventoryTransaction extends sequelize_1.Model {
}
exports.InventoryTransaction = InventoryTransaction;
InventoryTransaction.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    materialId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, references: { model: 'materials', key: 'id' } },
    type: { type: sequelize_1.DataTypes.ENUM('adjustment', 'receipt', 'consumption', 'return', 'correction'), allowNull: false },
    quantity: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
    direction: { type: sequelize_1.DataTypes.ENUM('in', 'out'), allowNull: false },
    referenceType: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    referenceId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    resultingStock: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
}, {
    sequelize: database_1.sequelize,
    modelName: 'InventoryTransaction',
    tableName: 'inventory_transactions',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['material_id'] },
        { fields: ['type'] },
        { fields: ['reference_type', 'reference_id'] },
        { fields: ['created_at'] }
    ]
});
Material_1.Material.hasMany(InventoryTransaction, { foreignKey: 'materialId', as: 'inventoryTransactions' });
InventoryTransaction.belongsTo(Material_1.Material, { foreignKey: 'materialId', as: 'material' });
exports.default = InventoryTransaction;
