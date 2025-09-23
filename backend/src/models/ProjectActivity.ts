import { DataTypes, Model, Optional, Association } from 'sequelize';
import { sequelize } from '../config/database';

// Project Activity interface for real-time tracking
export interface ProjectActivityAttributes {
  id: number;
  projectId: number;
  userId: number;
  activityType: 'created' | 'updated' | 'status_changed' | 'assigned' | 'comment_added' | 'file_uploaded' | 'milestone_reached';
  description: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectActivityCreationAttributes extends Optional<ProjectActivityAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ProjectActivity extends Model<ProjectActivityAttributes, ProjectActivityCreationAttributes> implements ProjectActivityAttributes {
  public id!: number;
  public projectId!: number;
  public userId!: number;
  public activityType!: 'created' | 'updated' | 'status_changed' | 'assigned' | 'comment_added' | 'file_uploaded' | 'milestone_reached';
  public description!: string;
  public previousValue?: string;
  public newValue?: string;
  public metadata?: Record<string, any>;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    user: Association<ProjectActivity, any>;
    project: Association<ProjectActivity, any>;
  };

  // Instance methods
  public getFormattedMessage(): string {
    const user = (this as any).user;
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
    
    switch (this.activityType) {
      case 'created':
        return `${userName} created the project`;
      case 'updated':
        return `${userName} updated the project`;
      case 'assigned':
        return `${userName} was assigned to the project`;
      case 'status_changed':
        return `${userName} changed the project status`;
      case 'comment_added':
        return `${userName} added a comment`;
      case 'file_uploaded':
        return `${userName} uploaded a file`;
      case 'milestone_reached':
        return `${userName} marked a milestone as completed`;
      default:
        return this.description;
    }
  }

  public getActivityIcon(): string {
    switch (this.activityType) {
      case 'created': return '🆕';
      case 'updated': return '✏️';
      case 'assigned': return '�';
      case 'status_changed': return '�';
      case 'comment_added': return '💬';
      case 'file_uploaded': return '�';
      case 'milestone_reached': return '�';
      default: return 'ℹ️';
    }
  }

  public getActivityColor(): string {
    switch (this.activityType) {
      case 'created': return '#4CAF50';
      case 'updated': return '#2196F3';
      case 'assigned': return '#FF9800';
      case 'status_changed': return '#9C27B0';
      case 'comment_added': return '#607D8B';
      case 'file_uploaded': return '#795548';
      case 'milestone_reached': return '#E91E63';
      default: return '#757575';
    }
  }
}

// Initialize the model
ProjectActivity.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'enhanced_projects',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'enhanced_users',
      key: 'id',
    },
  },
  activityType: {
    type: DataTypes.ENUM('created', 'updated', 'status_changed', 'assigned', 'comment_added', 'file_uploaded', 'milestone_reached'),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  previousValue: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  newValue: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
}, {
  sequelize,
  modelName: 'ProjectActivity',
  tableName: 'enhanced_project_activities',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['project_id'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['activity_type'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['project_id', 'created_at'],
    },
  ],
});

// Instance methods
ProjectActivity.prototype.getFormattedMessage = function(): string {
  const user = (this as any).user;
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  
  switch (this.activityType) {
    case 'created':
      return `${userName} created the project`;
    case 'updated':
      return `${userName} updated the project`;
    case 'assigned':
      return `${userName} was assigned to the project`;
    case 'status_changed':
      return `${userName} changed the project status`;
    case 'comment_added':
      return `${userName} added a comment`;
    case 'file_uploaded':
      return `${userName} uploaded a file`;
    case 'milestone_reached':
      return `${userName} marked a milestone as completed`;
    default:
      return this.description;
  }
};

ProjectActivity.prototype.getActivityIcon = function(): string {
  switch (this.activityType) {
    case 'created': return '🆕';
    case 'updated': return '✏️';
    case 'assigned': return '👤';
    case 'status_changed': return '🔄';
    case 'comment_added': return '💬';
    case 'file_uploaded': return '📎';
    case 'milestone_reached': return '🏆';
    default: return 'ℹ️';
  }
};

export default ProjectActivity;
