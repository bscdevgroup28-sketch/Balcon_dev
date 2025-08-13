import { DataTypes, Model, Optional, Association } from 'sequelize';
import { enhancedSequelize } from '../config/enhancedDatabase';
import { User } from './User';

// Enhanced Project interface with additional business fields
export interface ProjectAttributes {
  id: number;
  projectNumber: string;
  title: string;
  description?: string;
  type: 'residential' | 'commercial' | 'renovation' | 'repair';
  status: 'inquiry' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Customer Information
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  
  // Project Details
  startDate?: Date;
  endDate?: Date;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  
  // Financial Information
  estimatedCost?: number;
  actualCost?: number;
  quotedAmount?: number;
  approvedBudget?: number;
  
  // Assignment Information
  assignedSalesRep?: number;
  assignedProjectManager?: number;
  assignedTeamLeader?: number;
  
  // Business Metadata
  inquiryNumber?: string;
  leadSource?: string;
  tags?: string[];
  notes?: string;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number;
  public projectNumber!: string;
  public title!: string;
  public description?: string;
  public type!: 'residential' | 'commercial' | 'renovation' | 'repair';
  public status!: 'inquiry' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  
  // Customer Information
  public customerName!: string;
  public customerEmail!: string;
  public customerPhone?: string;
  public customerAddress?: string;
  
  // Project Details
  public startDate?: Date;
  public endDate?: Date;
  public estimatedCompletionDate?: Date;
  public actualCompletionDate?: Date;
  
  // Financial Information
  public estimatedCost?: number;
  public actualCost?: number;
  public quotedAmount?: number;
  public approvedBudget?: number;
  
  // Assignment Information
  public assignedSalesRep?: number;
  public assignedProjectManager?: number;
  public assignedTeamLeader?: number;
  
  // Business Metadata
  public inquiryNumber?: string;
  public leadSource?: string;
  public tags?: string[];
  public notes?: string;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    salesRep: Association<Project, User>;
    projectManager: Association<Project, User>;
    teamLeader: Association<Project, User>;
  };

  // Helper methods
  public isOverdue(): boolean {
    if (!this.estimatedCompletionDate) return false;
    return new Date() > this.estimatedCompletionDate && this.status !== 'completed';
  }

  public getDaysUntilDeadline(): number | null {
    if (!this.estimatedCompletionDate) return null;
    const now = new Date();
    const deadline = new Date(this.estimatedCompletionDate);
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getProgressPercentage(): number {
    const statusProgress = {
      'inquiry': 10,
      'quoted': 25,
      'approved': 40,
      'in_progress': 75,
      'completed': 100,
      'cancelled': 0
    };
    return statusProgress[this.status] || 0;
  }

  public getBudgetUtilization(): number {
    if (!this.approvedBudget || !this.actualCost) return 0;
    return (this.actualCost / this.approvedBudget) * 100;
  }
}

Project.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  projectNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('residential', 'commercial', 'renovation', 'repair'),
    allowNull: false,
    defaultValue: 'residential',
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
  customerName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  customerEmail: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[\d\s\-\(\)]+$/, // Allow phone with spaces, dashes, parentheses
    },
  },
  customerAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estimatedCompletionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  actualCompletionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  actualCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  quotedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  approvedBudget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  assignedSalesRep: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'enhanced_users',
      key: 'id',
    },
  },
  assignedProjectManager: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'enhanced_users',
      key: 'id',
    },
  },
  assignedTeamLeader: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'enhanced_users',
      key: 'id',
    },
  },
  inquiryNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
  },
  leadSource: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize: enhancedSequelize,
  modelName: 'Project',
  tableName: 'enhanced_projects',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['project_number'],
      unique: true,
    },
    {
      fields: ['inquiry_number'],
      unique: true,
    },
    {
      fields: ['customer_email'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['priority'],
    },
    {
      fields: ['assigned_sales_rep'],
    },
    {
      fields: ['assigned_project_manager'],
    },
    {
      fields: ['assigned_team_leader'],
    },
    {
      fields: ['created_at'],
    },
  ],
});

export default Project;
