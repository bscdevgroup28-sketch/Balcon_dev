import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface WebhookDeliveryAttributes {
  id: number;
  subscriptionId: number;
  eventType: string;
  status: 'pending' | 'delivered' | 'failed';
  attemptCount: number;
  responseCode?: number | null;
  errorMessage?: string | null;
  nextRetryAt?: Date | null;
  payload: any;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<WebhookDeliveryAttributes, 'id' | 'status' | 'attemptCount' | 'responseCode' | 'errorMessage' | 'nextRetryAt'>;

export class WebhookDelivery extends Model<WebhookDeliveryAttributes, Creation> implements WebhookDeliveryAttributes {
  public id!: number;
  public subscriptionId!: number;
  public eventType!: string;
  public status!: 'pending' | 'delivered' | 'failed';
  public attemptCount!: number;
  public responseCode?: number | null;
  public errorMessage?: string | null;
  public nextRetryAt?: Date | null;
  public payload!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WebhookDelivery.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  subscriptionId: { type: DataTypes.INTEGER, allowNull: false },
  eventType: { type: DataTypes.STRING(100), allowNull: false },
  status: { type: DataTypes.ENUM('pending','delivered','failed'), allowNull: false, defaultValue: 'pending' },
  attemptCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  responseCode: { type: DataTypes.INTEGER, allowNull: true },
  errorMessage: { type: DataTypes.TEXT, allowNull: true },
  nextRetryAt: { type: DataTypes.DATE, allowNull: true },
  payload: { type: DataTypes.JSON, allowNull: false }
}, {
  sequelize,
  tableName: 'webhook_deliveries',
  modelName: 'WebhookDelivery',
  underscored: true,
  indexes: [ { fields: ['subscriptionId'] }, { fields: ['eventType'] }, { fields: ['status'] } ]
});

export default WebhookDelivery;
