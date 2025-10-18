import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface POItem { materialId: number; description?: string; quantity: number; unitCost: number; }

export interface PurchaseOrderAttributes {
  id: number;
  vendor: string;
  items: POItem[];
  status: 'draft'|'sent'|'received'|'cancelled';
  receivedAt?: Date | null;
  totalCost: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type PurchaseOrderCreation = Optional<PurchaseOrderAttributes, 'id'|'status'|'receivedAt'|'totalCost'|'notes'|'createdAt'|'updatedAt'>;

export class PurchaseOrder extends Model<PurchaseOrderAttributes, PurchaseOrderCreation> implements PurchaseOrderAttributes {
  public id!: number;
  public vendor!: string;
  public items!: POItem[];
  public status!: 'draft'|'sent'|'received'|'cancelled';
  public receivedAt?: Date | null;
  public totalCost!: number;
  public notes?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PurchaseOrder.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  vendor: { type: DataTypes.STRING(200), allowNull: false },
  items: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  status: { type: DataTypes.ENUM('draft','sent','received','cancelled'), allowNull: false, defaultValue: 'draft' },
  receivedAt: { type: DataTypes.DATE, allowNull: true },
  totalCost: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
}, { sequelize, tableName: 'purchase_orders', modelName: 'PurchaseOrder', timestamps: true, indexes: [ { fields: ['status'] }, { fields: ['createdAt'] } ] });

export default PurchaseOrder;
