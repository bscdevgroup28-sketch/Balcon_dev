import { DataTypes, Model, Optional, Association } from 'sequelize';
import { sequelize } from '../config/database';
import { Project } from './Project';
import { User } from './UserEnhanced';
import { Quote } from './Quote';

export interface ChangeOrderAttributes {
  id: number;
  projectId: number;
  quoteId?: number | null;
  code: string; // e.g., CO-000001
  title: string;
  description?: string | null;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  amount: number;
  createdByUserId: number;
  approvedAt?: Date | null;
  approvedByUserId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangeOrderCreationAttributes extends Optional<ChangeOrderAttributes, 'id' | 'createdAt' | 'updatedAt' | 'approvedAt' | 'approvedByUserId' | 'quoteId'> {}

export class ChangeOrder extends Model<ChangeOrderAttributes, ChangeOrderCreationAttributes> implements ChangeOrderAttributes {
  public id!: number;
  public projectId!: number;
  public quoteId?: number | null;
  public code!: string;
  public title!: string;
  public description?: string | null;
  public status!: 'draft' | 'sent' | 'approved' | 'rejected';
  public amount!: number;
  public createdByUserId!: number;
  public approvedAt?: Date | null;
  public approvedByUserId?: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly project?: Project;
  public readonly createdBy?: User;
  public readonly approvedBy?: User;
  public readonly quote?: Quote;

  public static associations: {
    project: Association<ChangeOrder, Project>;
    createdBy: Association<ChangeOrder, User>;
    approvedBy: Association<ChangeOrder, User>;
    quote: Association<ChangeOrder, Quote>;
  };
}

ChangeOrder.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'projects', key: 'id' } },
    quoteId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'quotes', key: 'id' } },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'sent', 'approved', 'rejected'), allowNull: false, defaultValue: 'draft' },
    amount: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    createdByUserId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'enhanced_users', key: 'id' } },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    approvedByUserId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'enhanced_users', key: 'id' } },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'ChangeOrder',
    tableName: 'change_orders',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['projectId'] },
      { fields: ['quoteId'] },
      { fields: ['status'] },
      { fields: ['createdByUserId'] },
      { fields: ['approvedByUserId'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default ChangeOrder;
