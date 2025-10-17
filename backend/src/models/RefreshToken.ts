import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface RefreshTokenAttributes {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  replacedByToken?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  reuseDetected: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<RefreshTokenAttributes, 'id' | 'revokedAt' | 'replacedByToken' | 'ipAddress' | 'userAgent' | 'reuseDetected' | 'createdAt' | 'updatedAt'>;

export class RefreshToken extends Model<RefreshTokenAttributes, Creation> implements RefreshTokenAttributes {
  public id!: number;
  public userId!: number;
  public tokenHash!: string;
  public expiresAt!: Date;
  public revokedAt?: Date | null;
  public replacedByToken?: string | null;
  public ipAddress?: string | null;
  public userAgent?: string | null;
  public reuseDetected!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RefreshToken.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  tokenHash: { type: DataTypes.STRING(255), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  revokedAt: { type: DataTypes.DATE, allowNull: true },
  replacedByToken: { type: DataTypes.STRING(255), allowNull: true },
  ipAddress: { type: DataTypes.STRING(64), allowNull: true },
  userAgent: { type: DataTypes.STRING(255), allowNull: true },
  reuseDetected: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  sequelize,
  tableName: 'refresh_tokens',
  modelName: 'RefreshToken',
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['token_hash'] },
    { fields: ['expires_at'] }
  ]
});

export default RefreshToken;