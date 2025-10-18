import { DataTypes, Model, Optional, Association } from 'sequelize';
import { sequelize } from '../config/database';
import { Project } from './Project';
import { User } from './UserEnhanced';

export interface InvoiceLineItem { description: string; quantity: number; unitPrice: number; unit?: string; }

export interface InvoiceAttributes {
  id: number;
  projectId: number;
  number: string;
  date: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft'|'sent'|'paid'|'overdue';
  sentAt?: Date | null;
  paidAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id'|'number'|'subtotal'|'tax'|'total'|'status'|'sentAt'|'paidAt'|'notes'|'createdAt'|'updatedAt'> {}

export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  public id!: number;
  public projectId!: number;
  public number!: string;
  public date!: Date;
  public dueDate!: Date;
  public lineItems!: InvoiceLineItem[];
  public subtotal!: number;
  public tax!: number;
  public total!: number;
  public status!: 'draft'|'sent'|'paid'|'overdue';
  public sentAt?: Date | null;
  public paidAt?: Date | null;
  public notes?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly project?: Project;

  public static associations: { project: Association<Invoice, Project> };
}

Invoice.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'projects', key: 'id' } },
  number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  date: { type: DataTypes.DATE, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  lineItems: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  subtotal: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  tax: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM('draft','sent','paid','overdue'), allowNull: false, defaultValue: 'draft' },
  sentAt: { type: DataTypes.DATE, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
}, {
  sequelize,
  modelName: 'Invoice',
  tableName: 'invoices',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['number'] },
    { fields: ['projectId'] },
    { fields: ['status'] },
    { fields: ['dueDate'] },
    { fields: ['createdAt'] },
  ]
});

export default Invoice;
