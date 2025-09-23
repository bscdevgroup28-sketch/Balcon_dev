import { Router } from 'express';
import { metrics } from '../monitoring/metrics';

const router = Router();

router.get('/', (req, res) => {
  res.json(metrics.snapshot());
});

router.get('/prometheus', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(metrics.toPrometheus());
});

export default router;
