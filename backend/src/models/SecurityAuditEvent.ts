import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SecurityAuditEventAttributes {
  id: number;
  action: string;
  outcome: string;
  actorUserId?: number | null;
  actorRole?: string | null;
  targetUserId?: number | null;
  ip?: string | null;
  requestId?: string | null;
  meta?: any | null;
  createdAt: Date;
}

export type SecurityAuditEventCreation = Optional<SecurityAuditEventAttributes, 'id' | 'createdAt'>;

export class SecurityAuditEvent extends Model<SecurityAuditEventAttributes, SecurityAuditEventCreation> implements SecurityAuditEventAttributes {
  public id!: number;
  public action!: string;
  public outcome!: string;
  public actorUserId?: number | null;
  public actorRole?: string | null;
  public targetUserId?: number | null;
  public ip?: string | null;
  public requestId?: string | null;
  public meta?: any | null;
  public createdAt!: Date;
}

SecurityAuditEvent.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  action: { type: DataTypes.STRING(120), allowNull: false },
  outcome: { type: DataTypes.STRING(24), allowNull: false },
  actorUserId: { type: DataTypes.INTEGER, allowNull: true, field: 'actor_user_id' },
  actorRole: { type: DataTypes.STRING(60), allowNull: true, field: 'actor_role' },
  targetUserId: { type: DataTypes.INTEGER, allowNull: true, field: 'target_user_id' },
  ip: { type: DataTypes.STRING(64), allowNull: true },
  requestId: { type: DataTypes.STRING(64), allowNull: true, field: 'request_id' },
  meta: { type: DataTypes.JSON, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at', defaultValue: DataTypes.NOW },
}, {
  sequelize,
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

export default SecurityAuditEvent;
