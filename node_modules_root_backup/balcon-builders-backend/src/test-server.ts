import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/environment';
import { logger } from './utils/logger';
import demoRoutes from './routes/demo';

const app = express();

// Trust proxy for Cloud Run
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple test routes without database
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'Bal-Con Builders API is running'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Bal-Con Builders API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/test',
      '/api/test/data'
    ]
  });
});

app.get('/api/test/data', (req, res) => {
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

// Add demo routes
app.use('/api/demo', demoRoutes);

// Basic 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

const PORT = Number(process.env.PORT) || 3030;

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Health check: http://localhost:${PORT}/health`);
  logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  logger.info(`📊 Test data: http://localhost:${PORT}/api/test/data`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export { app, server };
