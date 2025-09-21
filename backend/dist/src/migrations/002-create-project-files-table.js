"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    // Create project_files table
    await queryInterface.createTable('project_files', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        projectId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'projects',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        uploadedBy: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        originalName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        fileName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        filePath: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        mimeType: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        fileSize: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        fileType: {
            type: sequelize_1.DataTypes.ENUM('document', 'image', 'drawing', 'other'),
            allowNull: false,
            defaultValue: 'other',
        },
        isPublic: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
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
exports.up = up;
const down = async (queryInterface) => {
    // Remove indexes first
    await queryInterface.removeIndex('project_files', 'project_files_project_id_idx');
    await queryInterface.removeIndex('project_files', 'project_files_uploaded_by_idx');
    await queryInterface.removeIndex('project_files', 'project_files_file_type_idx');
    await queryInterface.removeIndex('project_files', 'project_files_created_at_idx');
    // Drop the table
    await queryInterface.dropTable('project_files');
};
exports.down = down;
