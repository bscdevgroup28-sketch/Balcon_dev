import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface IdempotencyRecordAttributes {
  id: number;
  key: string;
  requestHash: string;
  method: string;
  path: string;
  statusCode: number;
  response: object;
  userId?: number | null;
  createdAt?: Date;
  expiresAt?: Date | null;
}

type Creation = Optional<IdempotencyRecordAttributes, 'id' | 'userId' | 'createdAt' | 'expiresAt'>;

export class IdempotencyRecord extends Model<IdempotencyRecordAttributes, Creation> implements IdempotencyRecordAttributes {
  public id!: number;
  public key!: string;
  public requestHash!: string;
  public method!: string;
  public path!: string;
  public statusCode!: number;
  public response!: object;
  public userId?: number | null;
  public createdAt?: Date;
  public expiresAt?: Date | null;
}

IdempotencyRecord.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  requestHash: { type: DataTypes.STRING(120), allowNull: false },
  method: { type: DataTypes.STRING(10), allowNull: false },
  path: { type: DataTypes.STRING(300), allowNull: false },
  statusCode: { type: DataTypes.INTEGER, allowNull: false },
  response: { type: (DataTypes as any).JSONB || DataTypes.JSON, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
}, {
  sequelize,
  tableName: 'idempotency_records',
  modelName: 'IdempotencyRecord',
  underscored: true,
  indexes: [
    { name: 'idemp_key_unique', unique: true, fields: ['key'] },
    { name: 'idemp_expires_idx', fields: ['expires_at'] },
  ]
});

export default IdempotencyRecord;
