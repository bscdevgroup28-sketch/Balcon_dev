"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const sequelize_1 = require("sequelize");
const enhancedDatabase_1 = require("../config/enhancedDatabase");
class Project extends sequelize_1.Model {
    // Helper methods
    isOverdue() {
        if (!this.estimatedCompletionDate)
            return false;
        return new Date() > this.estimatedCompletionDate && this.status !== 'completed';
    }
    getDaysUntilDeadline() {
        if (!this.estimatedCompletionDate)
            return null;
        const now = new Date();
        const deadline = new Date(this.estimatedCompletionDate);
        const diffTime = deadline.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    getProgressPercentage() {
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
    getBudgetUtilization() {
        if (!this.approvedBudget || !this.actualCost)
            return 0;
        return (this.actualCost / this.approvedBudget) * 100;
    }
}
exports.Project = Project;
Project.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    projectNumber: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
        },
    },
    title: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 200],
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('residential', 'commercial', 'renovation', 'repair'),
        allowNull: false,
        defaultValue: 'residential',
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
    customerName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    customerEmail: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    customerPhone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: /^[\+]?[\d\s\-\(\)]+$/, // Allow phone with spaces, dashes, parentheses
        },
    },
    customerAddress: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    estimatedCompletionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    actualCompletionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    estimatedCost: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    actualCost: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    quotedAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    approvedBudget: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    assignedSalesRep: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'enhanced_users',
            key: 'id',
        },
    },
    assignedProjectManager: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'enhanced_users',
            key: 'id',
        },
    },
    assignedTeamLeader: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'enhanced_users',
            key: 'id',
        },
    },
    inquiryNumber: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        unique: true,
    },
    leadSource: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    tags: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: enhancedDatabase_1.enhancedSequelize,
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
exports.default = Project;
