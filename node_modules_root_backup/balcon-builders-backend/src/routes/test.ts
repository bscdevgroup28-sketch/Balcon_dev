import { Router, Request, Response } from 'express';
import { testSprint4Features, createTestData } from '../controllers/sprint4Validation';

const router = Router();

// Simple test endpoint
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Bal-Con Builders API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      '/api/test',
      '/api/projects',
      '/api/quotes',
      '/health'
    ]
  });
});

// Test data endpoint
router.get('/data', (req: Request, res: Response) => {
  res.json({
    users: [
      { id: 1, name: 'John Smith', email: 'john@example.com', role: 'admin' },
      { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'user' }
    ],
    projects: [
      { id: 1, title: 'Metal Warehouse Structure', type: 'commercial', status: 'in_progress' },
      { id: 2, title: 'Residential Garage', type: 'residential', status: 'quoted' }
    ],
    quotes: [
      { id: 1, projectId: 1, amount: 25000, status: 'accepted' },
      { id: 2, projectId: 2, amount: 8500, status: 'sent' }
    ]
  });
});

// Sprint 4 feature validation
router.get('/sprint4', testSprint4Features);

// Create test data for Sprint 4
router.post('/sprint4/setup', createTestData);

export default router;
