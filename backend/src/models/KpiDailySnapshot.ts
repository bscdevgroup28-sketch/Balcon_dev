import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface KpiDailySnapshotAttributes {
  id: number;
  date: Date; // UTC midnight
  quotesSent: number;
  quotesAccepted: number;
  quoteConversionRate: number; // 0-1
  ordersCreated: number;
  ordersDelivered: number;
  avgOrderCycleDays?: number | null;
  inventoryNetChange: number; // sum inbound - outbound
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<KpiDailySnapshotAttributes, 'id' | 'createdAt' | 'updatedAt' | 'quoteConversionRate' | 'avgOrderCycleDays'>;

export class KpiDailySnapshot extends Model<KpiDailySnapshotAttributes, Creation> implements KpiDailySnapshotAttributes {
  public id!: number;
  public date!: Date;
  public quotesSent!: number;
  public quotesAccepted!: number;
  public quoteConversionRate!: number;
  public ordersCreated!: number;
  public ordersDelivered!: number;
  public avgOrderCycleDays?: number | null;
  public inventoryNetChange!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

KpiDailySnapshot.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
  quotesSent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  quotesAccepted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  quoteConversionRate: { type: DataTypes.DECIMAL(6,4), allowNull: false, defaultValue: 0 },
  ordersCreated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  ordersDelivered: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  avgOrderCycleDays: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  inventoryNetChange: { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 }
}, {
  sequelize,
  tableName: 'kpi_daily_snapshots',
  modelName: 'KpiDailySnapshot',
  underscored: true,
  indexes: [ { fields: ['date'], unique: true } ]
});

export default KpiDailySnapshot;