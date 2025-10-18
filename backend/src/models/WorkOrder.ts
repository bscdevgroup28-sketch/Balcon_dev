import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface WorkOrderAttributes {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedUserId?: number | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  team?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type WorkOrderCreation = Optional<WorkOrderAttributes, 'id' | 'status' | 'priority'>;

export class WorkOrder extends Model<WorkOrderAttributes, WorkOrderCreation> implements WorkOrderAttributes {
  public id!: number;
  public projectId!: number;
  public title!: string;
  public description?: string;
  public status!: WorkOrderAttributes['status'];
  public priority!: WorkOrderAttributes['priority'];
  public assignedUserId?: number | null;
  public estimatedHours?: number | null;
  public actualHours?: number | null;
  public team?: string | null;
  public startDate?: Date | null;
  public dueDate?: Date | null;
  public completedAt?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkOrder.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('pending','assigned','in_progress','blocked','completed','cancelled'), allowNull: false, defaultValue: 'pending' },
  priority: { type: DataTypes.ENUM('low','medium','high','urgent'), allowNull: false, defaultValue: 'medium' },
  assignedUserId: { type: DataTypes.INTEGER, allowNull: true },
  estimatedHours: { type: DataTypes.FLOAT, allowNull: true },
  actualHours: { type: DataTypes.FLOAT, allowNull: true },
  team: { type: DataTypes.STRING(100), allowNull: true },
  startDate: { type: DataTypes.DATE, allowNull: true },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  tableName: 'work_orders',
  modelName: 'WorkOrder',
  // Migrations created camelCase column names (projectId, assignedUserId, etc.)
  // Global define uses underscored:true in development which would make the model
  // expect project_id. Disable underscored for this model to match existing schema.
  underscored: false
});

export default WorkOrder;
