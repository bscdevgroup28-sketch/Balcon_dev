"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectActivity = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ProjectActivity extends sequelize_1.Model {
    // Instance methods
    getFormattedMessage() {
        const user = this.user;
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
    getActivityIcon() {
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
    getActivityColor() {
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
exports.ProjectActivity = ProjectActivity;
// Initialize the model
ProjectActivity.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    projectId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'enhanced_projects',
            key: 'id',
        },
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'enhanced_users',
            key: 'id',
        },
    },
    activityType: {
        type: sequelize_1.DataTypes.ENUM('created', 'updated', 'status_changed', 'assigned', 'comment_added', 'file_uploaded', 'milestone_reached'),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    previousValue: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    newValue: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ProjectActivity',
    tableName: 'enhanced_project_activities',
    // Use camelCase columns under SQLite (global config sets underscored false for sqlite).
    underscored: false,
    timestamps: true,
    indexes: [
        { fields: ['projectId'] },
        { fields: ['userId'] },
        { fields: ['activityType'] },
        { fields: ['createdAt'] },
        { fields: ['projectId', 'createdAt'] },
    ],
});
// Instance methods
ProjectActivity.prototype.getFormattedMessage = function () {
    const user = this.user;
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
ProjectActivity.prototype.getActivityIcon = function () {
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
exports.default = ProjectActivity;
