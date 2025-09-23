import { QueryInterface, DataTypes } from 'sequelize';

export async function up({ context }: { context: QueryInterface }) {
  await context.addColumn('enhanced_users', 'must_change_password', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeColumn('enhanced_users', 'must_change_password');
}
