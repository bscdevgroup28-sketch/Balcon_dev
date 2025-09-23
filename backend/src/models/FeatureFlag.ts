import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface FeatureFlagAttributes {
  id: number;
  key: string;
  enabled: boolean;
  description?: string;
  rolloutStrategy: 'boolean' | 'percentage' | 'role';
  percentage?: number | null;
  audienceRoles?: string[] | null;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeatureFlagCreationAttributes extends Optional<FeatureFlagAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class FeatureFlag extends Model<FeatureFlagAttributes, FeatureFlagCreationAttributes> implements FeatureFlagAttributes {
  public id!: number;
  public key!: string;
  public enabled!: boolean;
  public description?: string;
  public rolloutStrategy!: 'boolean' | 'percentage' | 'role';
  public percentage?: number | null;
  public audienceRoles?: string[] | null;
  public metadata?: Record<string, any> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FeatureFlag.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
  rolloutStrategy: { field: 'rollout_strategy', type: DataTypes.STRING(50), allowNull: false, defaultValue: 'boolean' },
  percentage: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 100 } },
  audienceRoles: { field: 'audience_roles', type: DataTypes.JSON, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
  createdAt: { field: 'created_at', type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updatedAt: { field: 'updated_at', type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  tableName: 'feature_flags',
  underscored: true,
  timestamps: true,
  updatedAt: 'updatedAt',
  createdAt: 'createdAt'
});

export default FeatureFlag;
