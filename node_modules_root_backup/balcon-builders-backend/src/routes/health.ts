import { Router, Request, Response } from 'express';
import { sequelize } from '../config/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Check database connection
    await sequelize.authenticate();
    
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        database: 'healthy',
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      checks: {
        database: 'unhealthy',
      }
    });
  }
});

export default router;
