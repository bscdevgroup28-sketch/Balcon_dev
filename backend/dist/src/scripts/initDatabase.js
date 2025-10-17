"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDatabase = exports.createSeedData = exports.initializeDatabase = void 0;
const database_1 = require("../config/database");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const initializeDatabase = async () => {
    try {
        logger_1.logger.info('🔄 Initializing database...');
        // Drop and recreate all tables
        await database_1.sequelize.drop();
        await database_1.sequelize.sync({ force: true });
        logger_1.logger.info('✅ Database tables created');
        // Create seed data
        await (0, exports.createSeedData)();
        logger_1.logger.info('✅ Seed data created');
    }
    catch (error) {
        logger_1.logger.error('❌ Database initialization failed:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
const createSeedData = async () => {
    try {
        // Create admin user
        const adminUser = await models_1.User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@balconbuilders.com',
            phone: '555-0100',
            role: 'admin',
            isActive: true,
            isVerified: true,
            passwordHash: 'temp',
            permissions: [],
            canAccessFinancials: true,
            canManageProjects: true,
            canManageUsers: true,
            mustChangePassword: false
        });
        // Create sales representatives
        const salesRep1 = await models_1.User.create({
            firstName: 'John',
            lastName: 'Sales',
            email: 'john.sales@balconbuilders.com',
            phone: '555-0101',
            role: 'sales',
            isActive: true,
            isVerified: true,
            passwordHash: 'temp',
            permissions: [],
            canAccessFinancials: false,
            canManageProjects: true,
            canManageUsers: false,
            mustChangePassword: false
        });
        const salesRep2 = await models_1.User.create({
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah.johnson@balconbuilders.com',
            phone: '555-0102',
            role: 'sales',
            isActive: true,
            isVerified: true,
            passwordHash: 'temp',
            permissions: [],
            canAccessFinancials: false,
            canManageProjects: true,
            canManageUsers: false,
            mustChangePassword: false
        });
        // Create test customer
        const customer = await models_1.User.create({
            firstName: 'Test',
            lastName: 'Customer',
            email: 'customer@example.com',
            phone: '555-0200',
            role: 'user',
            isActive: true,
            isVerified: true,
            passwordHash: 'temp',
            permissions: [],
            canAccessFinancials: false,
            canManageProjects: false,
            canManageUsers: false,
            mustChangePassword: false
        });
        // Create a sample project
        const sampleProject = await models_1.Project.create({
            userId: customer.id,
            inquiryNumber: 'INQ-2024-000001',
            title: 'Commercial Warehouse Project',
            description: 'Large commercial warehouse construction with metal building components',
            projectType: 'commercial',
            status: 'inquiry',
            priority: 'medium',
            estimatedBudget: 250000,
            location: '123 Industrial Blvd, Business City, BC 12345',
            requirements: {
                buildingSize: '10,000 sq ft',
                height: '20 feet',
                specialRequirements: ['crane access', 'loading docks', 'office space']
            },
            assignedSalesRepId: salesRep1.id,
            assignedAt: new Date()
        });
        logger_1.logger.info('✅ Seed data created successfully:', {
            users: 4,
            projects: 1,
            adminUser: adminUser.email,
            salesReps: [salesRep1.email, salesRep2.email],
            customer: customer.email,
            sampleProject: sampleProject.inquiryNumber
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to create seed data:', error);
        throw error;
    }
};
exports.createSeedData = createSeedData;
const resetDatabase = async () => {
    try {
        logger_1.logger.info('🔄 Resetting database...');
        await database_1.sequelize.drop();
        await (0, exports.initializeDatabase)();
        logger_1.logger.info('✅ Database reset complete');
    }
    catch (error) {
        logger_1.logger.error('❌ Database reset failed:', error);
        throw error;
    }
};
exports.resetDatabase = resetDatabase;
