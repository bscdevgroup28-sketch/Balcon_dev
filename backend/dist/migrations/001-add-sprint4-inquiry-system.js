"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    // Add inquiry tracking fields to projects table
    await queryInterface.addColumn('projects', 'inquiryNumber', {
        type: sequelize_1.DataTypes.STRING,
        unique: true,
        allowNull: false,
        defaultValue: 'INQ-2024-000001', // Temporary default
    });
    await queryInterface.addColumn('projects', 'assignedSalesRepId', {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('projects', 'assignedAt', {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    });
    // Add sales rep capabilities to users table
    await queryInterface.addColumn('users', 'isSalesRep', {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    });
    await queryInterface.addColumn('users', 'salesCapacity', {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
    });
    // Create index for better query performance
    await queryInterface.addIndex('projects', ['inquiryNumber'], {
        name: 'projects_inquiry_number_idx',
        unique: true,
    });
    await queryInterface.addIndex('projects', ['assignedSalesRepId'], {
        name: 'projects_assigned_sales_rep_idx',
    });
    await queryInterface.addIndex('users', ['isSalesRep'], {
        name: 'users_is_sales_rep_idx',
    });
};
exports.up = up;
const down = async (queryInterface) => {
    // Remove indexes first
    await queryInterface.removeIndex('projects', 'projects_inquiry_number_idx');
    await queryInterface.removeIndex('projects', 'projects_assigned_sales_rep_idx');
    await queryInterface.removeIndex('users', 'users_is_sales_rep_idx');
    // Remove columns from projects table
    await queryInterface.removeColumn('projects', 'inquiryNumber');
    await queryInterface.removeColumn('projects', 'assignedSalesRepId');
    await queryInterface.removeColumn('projects', 'assignedAt');
    // Remove columns from users table
    await queryInterface.removeColumn('users', 'isSalesRep');
    await queryInterface.removeColumn('users', 'salesCapacity');
};
exports.down = down;
