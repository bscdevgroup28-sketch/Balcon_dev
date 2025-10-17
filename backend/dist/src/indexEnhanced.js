"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEnhancedApplication = startEnhancedApplication;
const logger_1 = require("./utils/logger");
const appEnhanced_1 = require("./appEnhanced");
const bootstrap_1 = require("./scripts/bootstrap");
const tracing_1 = require("./observability/tracing");
// Enhanced application startup
async function startEnhancedApplication() {
    try {
        logger_1.logger.info('🚀 Starting Bal-Con Builders Enhanced Application...');
        // Phase 14: optional tracing bootstrap
        (0, tracing_1.initTracingIfEnabled)();
        logger_1.logger.info('📋 Phase 5: Advanced Feature Enhancement');
        logger_1.logger.info('🔧 Features: Authentication, Real-time, Database Integration');
        // Preflight migrations via custom loader
        await (0, bootstrap_1.ensureMigrations)(true);
        // Start the enhanced application
        await appEnhanced_1.balConApp.start();
        // Log successful startup
        logger_1.logger.info('✅ Enhanced application started successfully!');
        logger_1.logger.info('');
        logger_1.logger.info('🎉 Bal-Con Builders Enhanced API v2.0 is now running!');
        logger_1.logger.info('');
        logger_1.logger.info('📊 Available Features:');
        logger_1.logger.info('   🔐 JWT Authentication with role-based access');
        logger_1.logger.info('   🔌 Real-time WebSocket communication');
        logger_1.logger.info('   💾 Enhanced database models and relationships');
        logger_1.logger.info('   📝 Project activity tracking');
        logger_1.logger.info('   🛡️  Security middleware and rate limiting');
        logger_1.logger.info('   📁 File upload and management');
        logger_1.logger.info('   📧 Enhanced user management');
        logger_1.logger.info('');
        logger_1.logger.info('🌐 API Endpoints:');
        logger_1.logger.info('   📋 Health: /api/health');
        logger_1.logger.info('   🔐 Auth: /api/auth/*');
        logger_1.logger.info('   � Users: /api/users/*');
        logger_1.logger.info('   �📊 Projects: /api/projects/*');
        logger_1.logger.info('   💰 Quotes: /api/quotes/*');
        logger_1.logger.info('   📦 Orders: /api/orders/*');
        logger_1.logger.info('   📁 Files: /api/files/*');
        logger_1.logger.info('   🧪 Test: /api/test/*');
        logger_1.logger.info('');
        logger_1.logger.info('🔑 Admin bootstrap: if SEED_ON_START=true a temporary password is generated unless DEFAULT_USER_PASSWORD is set.');
        logger_1.logger.info('   📧 Default seeded owner email: owner@balconbuilders.com');
        logger_1.logger.info('');
        logger_1.logger.info('🔄 To reset database: npm run db:reset');
        logger_1.logger.info('🌱 To seed data: npm run db:seed');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start enhanced application:', error);
        process.exit(1);
    }
}
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
// Start the application
if (require.main === module) {
    startEnhancedApplication();
}
