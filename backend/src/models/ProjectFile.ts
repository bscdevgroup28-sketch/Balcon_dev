import { DataTypes, Model, Optional, Association } from 'sequelize';
import { sequelize } from '../config/database';
import { Project } from './Project';

export interface ProjectFileAttributes {
  id: number;
  projectId: number;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: number;
  fileType: 'document' | 'image' | 'drawing' | 'other';
  isPublic: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFileCreationAttributes extends Optional<ProjectFileAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ProjectFile extends Model<ProjectFileAttributes, ProjectFileCreationAttributes> implements ProjectFileAttributes {
  public id!: number;
  public projectId!: number;
  public originalName!: string;
  public fileName!: string;
  public filePath!: string;
  public mimeType!: string;
  public fileSize!: number;
  public uploadedBy!: number;
  public fileType!: 'document' | 'image' | 'drawing' | 'other';
  public isPublic!: boolean;
  public description?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly project?: Project;

  public static associations: {
    project: Association<ProjectFile, Project>;
  };
}

ProjectFile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    fileType: {
      type: DataTypes.ENUM('document', 'image', 'drawing', 'other'),
      allowNull: false,
      defaultValue: 'document',
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'project_files',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id'],
      },
      {
        fields: ['uploaded_by'],
      },
      {
        fields: ['file_type'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

// Define associations in a separate function to avoid circular dependencies
export const defineProjectFileAssociations = () => {
  ProjectFile.belongsTo(Project, {
    foreignKey: 'projectId',
    as: 'project',
  });
};
