import { QueryInterface, DataTypes } from 'sequelize';

export async function up(arg: { context: QueryInterface } | QueryInterface) {
  const context: QueryInterface = (arg as any).context || (arg as any);
  const table = await context.describeTable('enhanced_users').catch(()=>null);
  if (table && !table['must_change_password']) {
    await context.addColumn('enhanced_users', 'must_change_password', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  }
}

export async function down(arg: { context: QueryInterface } | QueryInterface) {
  const context: QueryInterface = (arg as any).context || (arg as any);
  const table = await context.describeTable('enhanced_users').catch(()=>null);
  if (table && table['must_change_password']) {
    await context.removeColumn('enhanced_users', 'must_change_password');
  }
}
