import { DataTypes, Model, Optional, Association } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export interface ProjectAttributes {
  id: number;
  userId: number;
  assignedSalesRepId?: number;
  inquiryNumber: string;
  title: string;
  description: string;
  projectType: 'residential' | 'commercial' | 'industrial';
  status: 'inquiry' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedBudget?: number;
  actualCost?: number;
  startDate?: Date;
  targetCompletionDate?: Date;
  actualCompletionDate?: Date;
  assignedAt?: Date;
  location?: string;
  requirements: any; // JSON field for project requirements
  materials?: any; // JSON field for materials list
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number;
  public userId!: number;
  public assignedSalesRepId?: number;
  public inquiryNumber!: string;
  public title!: string;
  public description!: string;
  public projectType!: 'residential' | 'commercial' | 'industrial';
  public status!: 'inquiry' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public estimatedBudget?: number;
  public actualCost?: number;
  public startDate?: Date;
  public targetCompletionDate?: Date;
  public actualCompletionDate?: Date;
  public assignedAt?: Date;
  public location?: string;
  public requirements!: any;
  public materials?: any;
  public notes?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;
  
  public static associations: {
    user: Association<Project, User>;
  };

  public get isOverdue(): boolean {
    if (!this.targetCompletionDate || this.status === 'completed' || this.status === 'cancelled') {
      return false;
    }
    return new Date() > this.targetCompletionDate;
  }

  public get daysRemaining(): number | null {
    if (!this.targetCompletionDate || this.status === 'completed' || this.status === 'cancelled') {
      return null;
    }
    const today = new Date();
    const target = new Date(this.targetCompletionDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assignedSalesRepId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    inquiryNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [8, 20],
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 5000],
      },
    },
    projectType: {
      type: DataTypes.ENUM('residential', 'commercial', 'industrial'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('inquiry', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'inquiry',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
    },
    estimatedBudget: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    actualCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    targetCompletionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualCompletionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 500],
      },
    },
    requirements: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    materials: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['projectType'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['targetCompletionDate'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default Project;
