import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CustomerApprovalTokenAttributes {
  id: number;
  projectId: number;
  quoteId?: number | null;
  orderId?: number | null;
  token: string;
  expiresAt: Date;
  consumedAt?: Date | null;
  createdByUserId: number;
  actionAuditId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type CustomerApprovalTokenCreation = Optional<CustomerApprovalTokenAttributes, 'id' | 'quoteId' | 'orderId' | 'consumedAt' | 'actionAuditId' | 'createdAt' | 'updatedAt'>;

export class CustomerApprovalToken extends Model<CustomerApprovalTokenAttributes, CustomerApprovalTokenCreation> implements CustomerApprovalTokenAttributes {
  public id!: number;
  public projectId!: number;
  public quoteId?: number | null;
  public orderId?: number | null;
  public token!: string;
  public expiresAt!: Date;
  public consumedAt?: Date | null;
  public createdByUserId!: number;
  public actionAuditId?: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerApprovalToken.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  quoteId: { type: DataTypes.INTEGER, allowNull: true },
  orderId: { type: DataTypes.INTEGER, allowNull: true },
  token: { type: DataTypes.STRING(200), allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  consumedAt: { type: DataTypes.DATE, allowNull: true },
  createdByUserId: { type: DataTypes.INTEGER, allowNull: false },
  actionAuditId: { type: DataTypes.INTEGER, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  tableName: 'customer_approval_tokens',
  modelName: 'CustomerApprovalToken'
});

export default CustomerApprovalToken;
