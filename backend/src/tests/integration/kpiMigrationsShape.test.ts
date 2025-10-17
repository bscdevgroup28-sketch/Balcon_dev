import { sequelize } from '../../config/database';
import fs from 'fs';
import path from 'path';

// Basic integration test: ensure critical tables & columns exist after migrations.

describe('Migration schema shape', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = 'sqlite::memory:'; // in-memory for speed
    // Dynamically load and run every migration's up() in order
    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => /^[0-9].*\.(ts|js)$/.test(f)).sort();
    const qi: any = sequelize.getQueryInterface();
    for (const file of files) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(path.join(migrationsDir, file));
      const up = mod.up || (mod.default && mod.default.up);
      if (!up) throw new Error('Migration missing up(): ' + file);
      await up(qi);
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('inventory_transactions has snake_case columns', async () => {
    const qi: any = sequelize.getQueryInterface();
    const desc = await qi.describeTable('inventory_transactions');
    expect(desc.created_at).toBeDefined();
    expect(desc.updated_at).toBeDefined();
    expect(desc.materialId || desc.material_id).toBeDefined();
  });

  test('kpi_daily_snapshots uses snake_case metric columns', async () => {
    const qi: any = sequelize.getQueryInterface();
    const desc = await qi.describeTable('kpi_daily_snapshots');
    expect(desc.quotes_sent).toBeDefined();
    expect(desc.orders_created).toBeDefined();
    expect(desc.inventory_net_change).toBeDefined();
  });
});
