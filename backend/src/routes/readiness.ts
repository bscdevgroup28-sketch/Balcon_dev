import { Router, Request, Response } from 'express';
import { sequelize } from '../config/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Basic DB check
    await sequelize.authenticate();
    // Migration status
    const { migrationStatus } = await import('../scripts/migrationLoader');
    const status = await migrationStatus();
    const pending = status.pending;

    if (pending.length) {
      return res.status(503).json({ status: 'not_ready', pendingMigrations: pending, count: pending.length });
    }

    return res.json({ status: 'ready', executedMigrations: status.executed.length });
  } catch (e) {
    return res.status(503).json({ status: 'not_ready', error: (e as Error).message });
  }
});

export default router;