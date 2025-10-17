import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Material } from './Material';

export interface InventoryTransactionAttributes {
  id: number;
  materialId: number;
  type: 'adjustment' | 'receipt' | 'consumption' | 'return' | 'correction';
  quantity: number; // positive numbers; direction inferred by signApplied
  direction: 'in' | 'out';
  referenceType?: string; // e.g., 'work_order', 'order', 'manual'
  referenceId?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  resultingStock: number;
  userId?: number; // later for audit
}

export interface InventoryTransactionCreationAttributes extends Optional<InventoryTransactionAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'resultingStock'> {}

export class InventoryTransaction extends Model<InventoryTransactionAttributes, InventoryTransactionCreationAttributes>
  implements InventoryTransactionAttributes {
  public id!: number;
  public materialId!: number;
  public type!: 'adjustment' | 'receipt' | 'consumption' | 'return' | 'correction';
  public quantity!: number;
  public direction!: 'in' | 'out';
  public referenceType?: string;
  public referenceId?: number;
  public notes?: string;
  public resultingStock!: number;
  public userId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InventoryTransaction.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  materialId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'materials', key: 'id' } },
  type: { type: DataTypes.ENUM('adjustment','receipt','consumption','return','correction'), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
  direction: { type: DataTypes.ENUM('in','out'), allowNull: false },
  referenceType: { type: DataTypes.STRING, allowNull: true },
  referenceId: { type: DataTypes.INTEGER, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  resultingStock: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  userId: { type: DataTypes.INTEGER, allowNull: true }
}, {
  sequelize,
  modelName: 'InventoryTransaction',
  tableName: 'inventory_transactions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['material_id'] },
    { fields: ['type'] },
    { fields: ['reference_type','reference_id'] },
    { fields: ['created_at'] }
  ]
});

Material.hasMany(InventoryTransaction, { foreignKey: 'materialId', as: 'inventoryTransactions' });
InventoryTransaction.belongsTo(Material, { foreignKey: 'materialId', as: 'material' });

export default InventoryTransaction;