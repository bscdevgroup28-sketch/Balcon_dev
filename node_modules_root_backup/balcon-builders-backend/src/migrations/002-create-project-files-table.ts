import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Create project_files table
  await queryInterface.createTable('project_files', {
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
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fileType: {
      type: DataTypes.ENUM('document', 'image', 'drawing', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
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
  });

  // Create indexes for better performance
  await queryInterface.addIndex('project_files', ['projectId'], {
    name: 'project_files_project_id_idx',
  });

  await queryInterface.addIndex('project_files', ['uploadedBy'], {
    name: 'project_files_uploaded_by_idx',
  });

  await queryInterface.addIndex('project_files', ['fileType'], {
    name: 'project_files_file_type_idx',
  });

  await queryInterface.addIndex('project_files', ['createdAt'], {
    name: 'project_files_created_at_idx',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Remove indexes first
  await queryInterface.removeIndex('project_files', 'project_files_project_id_idx');
  await queryInterface.removeIndex('project_files', 'project_files_uploaded_by_idx');
  await queryInterface.removeIndex('project_files', 'project_files_file_type_idx');
  await queryInterface.removeIndex('project_files', 'project_files_created_at_idx');

  // Drop the table
  await queryInterface.dropTable('project_files');
};
