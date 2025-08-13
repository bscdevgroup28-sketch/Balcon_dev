import { sequelize } from '../../src/config/database';

export async function resetDb() {
  const models = sequelize.models;
  for (const name of Object.keys(models)) {
    await (models as any)[name].destroy({ where: {}, truncate: true, force: true });
  }
}
