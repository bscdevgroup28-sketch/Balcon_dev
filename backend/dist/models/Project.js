"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Project extends sequelize_1.Model {
    get isOverdue() {
        if (!this.targetCompletionDate || this.status === 'completed' || this.status === 'cancelled') {
            return false;
        }
        return new Date() > this.targetCompletionDate;
    }
    get daysRemaining() {
        if (!this.targetCompletionDate || this.status === 'completed' || this.status === 'cancelled') {
            return null;
        }
        const today = new Date();
        const target = new Date(this.targetCompletionDate);
        const diffTime = target.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
exports.Project = Project;
Project.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    assignedSalesRepId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    inquiryNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [8, 20],
        },
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [3, 200],
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [10, 5000],
        },
    },
    projectType: {
        type: sequelize_1.DataTypes.ENUM('residential', 'commercial', 'industrial'),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('inquiry', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'inquiry',
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
    },
    estimatedBudget: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    actualCost: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    targetCompletionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    actualCompletionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    assignedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    location: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 500],
        },
    },
    requirements: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    materials: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
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
});
exports.default = Project;
