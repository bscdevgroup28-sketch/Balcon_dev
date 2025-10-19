import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Add password_hash column to users table for authentication
  // This is needed for tests that create users with passwordHash
  try {
    await queryInterface.addColumn('users', 'password_hash', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  } catch (error) {
    // Column may already exist in some databases
    console.log('[migration 005] password_hash column may already exist, skipping');
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    await queryInterface.removeColumn('users', 'password_hash');
  } catch (error) {
    console.log('[migration 005 down] Could not remove password_hash column');
  }
};
