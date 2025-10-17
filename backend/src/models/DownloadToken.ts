import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface DownloadTokenAttributes {
  id: number;
  token: string;
  fileKey: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<DownloadTokenAttributes, 'id' | 'usedAt'>;

export class DownloadToken extends Model<DownloadTokenAttributes, Creation> implements DownloadTokenAttributes {
  public id!: number;
  public token!: string;
  public fileKey!: string;
  public expiresAt!: Date;
  public usedAt?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DownloadToken.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  token: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  fileKey: { type: DataTypes.STRING(255), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  usedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  tableName: 'download_tokens',
  modelName: 'DownloadToken',
  underscored: true,
  indexes: [ { fields: ['token'] }, { fields: ['fileKey'] } ]
});

export default DownloadToken;
