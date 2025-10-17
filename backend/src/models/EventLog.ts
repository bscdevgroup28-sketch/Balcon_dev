import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface EventLogAttributes {
  id: number;
  name: string;
  version?: string | null;
  timestamp: Date;
  payload: object;
  correlationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type EventLogCreation = Optional<EventLogAttributes, 'id' | 'version' | 'correlationId' | 'createdAt' | 'updatedAt'>;

export class EventLog extends Model<EventLogAttributes, EventLogCreation> implements EventLogAttributes {
  public id!: number;
  public name!: string;
  public version?: string | null;
  public timestamp!: Date;
  public payload!: object;
  public correlationId?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EventLog.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  version: { type: DataTypes.STRING(20), allowNull: true },
  timestamp: { type: DataTypes.DATE, allowNull: false },
  payload: { type: DataTypes.JSONB || DataTypes.JSON, allowNull: false },
  correlationId: { type: DataTypes.STRING(100), allowNull: true }
}, {
  sequelize,
  tableName: 'event_log',
  modelName: 'EventLog',
  underscored: true
});

export default EventLog;
