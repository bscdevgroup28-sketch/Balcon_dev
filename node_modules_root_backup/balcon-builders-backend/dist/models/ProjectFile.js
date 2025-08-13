"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineProjectFileAssociations = exports.ProjectFile = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Project_1 = require("./Project");
class ProjectFile extends sequelize_1.Model {
}
exports.ProjectFile = ProjectFile;
ProjectFile.init({
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
    originalName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    fileName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    filePath: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    mimeType: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    fileSize: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    uploadedBy: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    fileType: {
        type: sequelize_1.DataTypes.ENUM('document', 'image', 'drawing', 'other'),
        allowNull: false,
        defaultValue: 'document',
    },
    isPublic: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
}, {
    sequelize: database_1.sequelize,
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
});
// Define associations in a separate function to avoid circular dependencies
const defineProjectFileAssociations = () => {
    ProjectFile.belongsTo(Project_1.Project, {
        foreignKey: 'projectId',
        as: 'project',
    });
};
exports.defineProjectFileAssociations = defineProjectFileAssociations;
