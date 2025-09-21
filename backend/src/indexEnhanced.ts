import { logger } from './utils/logger';
import { balConApp } from './appEnhanced';

// Enhanced application startup
async function startEnhancedApplication(): Promise<void> {
  try {
    logger.info('🚀 Starting Bal-Con Builders Enhanced Application...');
    logger.info('📋 Phase 5: Advanced Feature Enhancement');
    logger.info('🔧 Features: Authentication, Real-time, Database Integration');

    // Start the enhanced application
    await balConApp.start();

    // Log successful startup
    logger.info('✅ Enhanced application started successfully!');
    logger.info('');
    logger.info('🎉 Bal-Con Builders Enhanced API v2.0 is now running!');
    logger.info('');
    logger.info('📊 Available Features:');
    logger.info('   🔐 JWT Authentication with role-based access');
    logger.info('   🔌 Real-time WebSocket communication');
    logger.info('   💾 Enhanced database models and relationships');
    logger.info('   📝 Project activity tracking');
    logger.info('   🛡️  Security middleware and rate limiting');
    logger.info('   📁 File upload and management');
    logger.info('   📧 Enhanced user management');
    logger.info('');
    logger.info('🌐 API Endpoints:');
    logger.info('   📋 Health: /api/health');
    logger.info('   🔐 Auth: /api/auth/*');
    logger.info('   � Users: /api/users/*');
    logger.info('   �📊 Projects: /api/projects/*');
    logger.info('   💰 Quotes: /api/quotes/*');
    logger.info('   📦 Orders: /api/orders/*');
    logger.info('   📁 Files: /api/files/*');
    logger.info('   🧪 Test: /api/test/*');
    logger.info('');
    logger.info('🔑 Default Admin Credentials:');
    logger.info('   📧 Email: owner@balconbuilders.com');
    logger.info('   🔒 Password: admin123');
    logger.info('');
    logger.info('🔄 To reset database: npm run db:reset');
    logger.info('🌱 To seed data: npm run db:seed');

  } catch (error) {
    logger.error('❌ Failed to start enhanced application:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  startEnhancedApplication();
}

export { startEnhancedApplication };
