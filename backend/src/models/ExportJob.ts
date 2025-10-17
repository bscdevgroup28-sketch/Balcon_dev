import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ExportJobAttributes {
  id: number;
  type: string; // e.g. materials_csv, orders_csv
  status: 'pending' | 'processing' | 'partial' | 'completed' | 'failed';
  params?: any | null; // JSON parameters
  resultUrl?: string | null; // Where file stored (future: S3)
  fileKey?: string | null; // Storage key reference
  errorMessage?: string | null;
  attempts: number;
  createdAt?: Date;
  updatedAt?: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

type Creation = Optional<ExportJobAttributes, 'id' | 'status' | 'resultUrl' | 'fileKey' | 'errorMessage' | 'attempts' | 'startedAt' | 'completedAt'>;

export class ExportJob extends Model<ExportJobAttributes, Creation> implements ExportJobAttributes {
  public id!: number;
  public type!: string;
  public status!: 'pending' | 'processing' | 'partial' | 'completed' | 'failed';
  public params?: any | null;
  public resultUrl?: string | null;
  public fileKey?: string | null;
  public errorMessage?: string | null;
  public attempts!: number;
  public startedAt?: Date | null;
  public completedAt?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExportJob.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: { type: DataTypes.STRING(100), allowNull: false },
  status: { type: DataTypes.ENUM('pending','processing','partial','completed','failed'), allowNull: false, defaultValue: 'pending' },
  params: { type: DataTypes.JSON, allowNull: true },
  resultUrl: { type: DataTypes.TEXT, allowNull: true },
  fileKey: { type: DataTypes.STRING, allowNull: true },
  errorMessage: { type: DataTypes.TEXT, allowNull: true },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  startedAt: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  tableName: 'export_jobs',
  modelName: 'ExportJob',
  underscored: true,
  indexes: [ { fields: ['status'] }, { fields: ['type'] } ]
});

export default ExportJob;