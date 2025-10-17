import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface WebhookSubscriptionAttributes {
  id: number;
  eventType: string; // e.g. export.completed
  targetUrl: string;
  secret: string; // used for HMAC
  isActive: boolean;
  failureCount: number;
  lastSuccessAt?: Date | null;
  lastFailureAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<WebhookSubscriptionAttributes, 'id' | 'failureCount' | 'isActive'>;

export class WebhookSubscription extends Model<WebhookSubscriptionAttributes, Creation> implements WebhookSubscriptionAttributes {
  public id!: number;
  public eventType!: string;
  public targetUrl!: string;
  public secret!: string;
  public isActive!: boolean;
  public failureCount!: number;
  public lastSuccessAt?: Date | null;
  public lastFailureAt?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WebhookSubscription.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  eventType: { type: DataTypes.STRING(100), allowNull: false },
  targetUrl: { type: DataTypes.STRING(500), allowNull: false },
  secret: { type: DataTypes.STRING(200), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  failureCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  lastSuccessAt: { type: DataTypes.DATE, allowNull: true },
  lastFailureAt: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  tableName: 'webhook_subscriptions',
  modelName: 'WebhookSubscription',
  underscored: true,
  indexes: [ { fields: ['eventType'] }, { fields: ['isActive'] } ]
});

export default WebhookSubscription;
