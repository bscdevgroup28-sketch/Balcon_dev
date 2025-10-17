import { QueryInterface } from 'sequelize';

export async function up(qi: QueryInterface) {
  const add = async (table: string, cols: string[]) => {
    try { await qi.addIndex(table, cols); } catch (e:any) { if (!/exists/i.test(e.message)) throw e; }
  };
  await add('orders', ['status']);
  await add('orders', ['createdAt']);
  await add('work_orders', ['status']);
  await add('quotes', ['status']);
}

export async function down(qi: QueryInterface) {
  const drop = async (table: string, cols: string[]) => {
    try { await qi.removeIndex(table, cols); } catch { /* ignore */ }
  };
  await drop('orders', ['status']);
  await drop('orders', ['createdAt']);
  await drop('work_orders', ['status']);
  await drop('quotes', ['status']);
}
