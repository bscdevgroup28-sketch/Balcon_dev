import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface JobRecordAttributes {
  id: number;
  type: string;
  payload: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  enqueuedAt: Date;
  scheduledFor?: Date | null;
  lastError?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<JobRecordAttributes, 'id' | 'status' | 'attempts' | 'enqueuedAt' | 'scheduledFor' | 'lastError'>;

export class JobRecord extends Model<JobRecordAttributes, Creation> implements JobRecordAttributes {
  public id!: number;
  public type!: string;
  public payload!: any;
  public status!: 'pending' | 'running' | 'completed' | 'failed';
  public attempts!: number;
  public maxAttempts!: number;
  public enqueuedAt!: Date;
  public scheduledFor?: Date | null;
  public lastError?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

JobRecord.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: { type: DataTypes.STRING(120), allowNull: false },
  payload: { type: DataTypes.JSON, allowNull: false },
  status: { type: DataTypes.ENUM('pending','running','completed','failed'), allowNull: false, defaultValue: 'pending' },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  maxAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  enqueuedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  scheduledFor: { type: DataTypes.DATE, allowNull: true },
  lastError: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  tableName: 'job_records',
  modelName: 'JobRecord',
  underscored: true,
  indexes: [ { fields: ['status'] }, { fields: ['type'] }, { fields: ['scheduledFor'] } ]
});

export default JobRecord;
