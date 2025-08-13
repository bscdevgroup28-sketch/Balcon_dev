import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Add inquiry tracking fields to projects table
  await queryInterface.addColumn('projects', 'inquiryNumber', {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    defaultValue: 'INQ-2024-000001', // Temporary default
  });

  await queryInterface.addColumn('projects', 'assignedSalesRepId', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addColumn('projects', 'assignedAt', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  // Add sales rep capabilities to users table
  await queryInterface.addColumn('users', 'isSalesRep', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  await queryInterface.addColumn('users', 'salesCapacity', {
    type: DataTypes.INTEGER,
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

export const down = async (queryInterface: QueryInterface): Promise<void> => {
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
