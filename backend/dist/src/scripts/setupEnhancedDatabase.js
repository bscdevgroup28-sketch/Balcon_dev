"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupEnhancedDatabase = exports.createEnhancedSeedData = exports.resetDatabase = exports.initializeDatabase = void 0;
// DEPRECATION: This script formerly targeted a separate enhancedSequelize instance.
// It now reuses the unified sequelize instance. Plan to remove after migration-driven init is stable.
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
// removed unused bcrypt import
// Import enhanced models
const UserEnhanced_1 = require("../models/UserEnhanced");
const ProjectEnhanced_1 = require("../models/ProjectEnhanced");
const ProjectActivity_1 = require("../models/ProjectActivity");
// Setup model associations
const setupAssociations = () => {
    // User associations
    UserEnhanced_1.User.hasMany(ProjectEnhanced_1.Project, { foreignKey: 'assignedSalesRep', as: 'salesProjects' });
    UserEnhanced_1.User.hasMany(ProjectEnhanced_1.Project, { foreignKey: 'assignedProjectManager', as: 'managedProjects' });
    UserEnhanced_1.User.hasMany(ProjectEnhanced_1.Project, { foreignKey: 'assignedTeamLeader', as: 'ledProjects' });
    UserEnhanced_1.User.hasMany(ProjectActivity_1.ProjectActivity, { foreignKey: 'userId', as: 'activities' });
    // Project associations
    ProjectEnhanced_1.Project.belongsTo(UserEnhanced_1.User, { foreignKey: 'assignedSalesRep', as: 'salesRep' });
    ProjectEnhanced_1.Project.belongsTo(UserEnhanced_1.User, { foreignKey: 'assignedProjectManager', as: 'projectManager' });
    ProjectEnhanced_1.Project.belongsTo(UserEnhanced_1.User, { foreignKey: 'assignedTeamLeader', as: 'teamLeader' });
    ProjectEnhanced_1.Project.hasMany(ProjectActivity_1.ProjectActivity, { foreignKey: 'projectId', as: 'activities' });
    // ProjectActivity associations
    ProjectActivity_1.ProjectActivity.belongsTo(UserEnhanced_1.User, { foreignKey: 'userId', as: 'user' });
    ProjectActivity_1.ProjectActivity.belongsTo(ProjectEnhanced_1.Project, { foreignKey: 'projectId', as: 'project' });
};
// Initialize database with enhanced models
const initializeDatabase = async () => {
    try {
        logger_1.logger.info('🔄 Initializing enhanced database...');
        // Setup associations
        setupAssociations();
        const inProd = process.env.NODE_ENV === 'production';
        const forceSync = process.env.DB_FORCE_SYNC === 'true';
        if (inProd) {
            logger_1.logger.info('ℹ️  Production mode: skipping sequelize.sync (migrations required).');
        }
        else {
            if (forceSync)
                logger_1.logger.warn('⚠️  DB_FORCE_SYNC=true - performing destructive sync (force: true)');
            await database_1.sequelize.sync({ force: forceSync, alter: false });
            logger_1.logger.info('✅ Enhanced database tables created/updated successfully (sync path)');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Database initialization failed:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
// Reset database for fresh start
const resetDatabase = async () => {
    try {
        logger_1.logger.info('🔄 Resetting database...');
        // Setup associations
        setupAssociations();
        // Drop and recreate all tables
        await database_1.sequelize.sync({ force: true });
        logger_1.logger.info('✅ Database reset completed');
    }
    catch (error) {
        logger_1.logger.error('❌ Database reset failed:', error);
        throw error;
    }
};
exports.resetDatabase = resetDatabase;
// Create enhanced seed data
const createEnhancedSeedData = async () => {
    try {
        if (process.env.SEED_ON_START !== 'true') {
            logger_1.logger.info('🌱 Skipping seed data creation (SEED_ON_START!=true)');
            return;
        }
        logger_1.logger.info('🌱 Creating enhanced seed data (SEED_ON_START=true)...');
        // Create admin users for each role
        const adminUsers = [
            {
                email: 'owner@balconbuilders.com',
                firstName: 'Executive',
                lastName: 'Owner',
                role: 'owner',
                isActive: true,
                isVerified: true,
                canAccessFinancials: true,
                canManageProjects: true,
                canManageUsers: true,
                employeeId: 'EMP001',
                department: 'Executive',
                position: 'Chief Executive Officer',
                hireDate: new Date('2020-01-01'),
            },
            {
                email: 'office@balconbuilders.com',
                firstName: 'Sarah',
                lastName: 'Johnson',
                role: 'office_manager',
                isActive: true,
                isVerified: true,
                canAccessFinancials: false,
                canManageProjects: true,
                canManageUsers: false,
                employeeId: 'EMP002',
                department: 'Administration',
                position: 'Office Manager',
                hireDate: new Date('2021-03-15'),
            },
            {
                email: 'shop@balconbuilders.com',
                firstName: 'Mike',
                lastName: 'Rodriguez',
                role: 'shop_manager',
                isActive: true,
                isVerified: true,
                canAccessFinancials: false,
                canManageProjects: true,
                canManageUsers: false,
                employeeId: 'EMP003',
                department: 'Production',
                position: 'Shop Manager',
                hireDate: new Date('2021-06-01'),
            },
            {
                email: 'pm@balconbuilders.com',
                firstName: 'Alex',
                lastName: 'Chen',
                role: 'project_manager',
                isActive: true,
                isVerified: true,
                canAccessFinancials: false,
                canManageProjects: true,
                canManageUsers: false,
                employeeId: 'EMP004',
                department: 'Projects',
                position: 'Senior Project Manager',
                hireDate: new Date('2021-09-01'),
            },
            {
                email: 'leader@balconbuilders.com',
                firstName: 'Jordan',
                lastName: 'Davis',
                role: 'team_leader',
                isActive: true,
                isVerified: true,
                canAccessFinancials: false,
                canManageProjects: false,
                canManageUsers: false,
                employeeId: 'EMP005',
                department: 'Field Operations',
                position: 'Team Leader',
                hireDate: new Date('2022-01-15'),
            },
            {
                email: 'tech@balconbuilders.com',
                firstName: 'Chris',
                lastName: 'Taylor',
                role: 'technician',
                isActive: true,
                isVerified: true,
                canAccessFinancials: false,
                canManageProjects: false,
                canManageUsers: false,
                employeeId: 'EMP006',
                department: 'Field Operations',
                position: 'Senior Technician',
                hireDate: new Date('2022-04-01'),
            },
        ];
        // Create users with default password
        const createdUsers = [];
        const defaultPassword = process.env.DEFAULT_USER_PASSWORD || Math.random().toString(36).slice(-12);
        if (!process.env.DEFAULT_USER_PASSWORD) {
            logger_1.logger.warn('🔐 DEFAULT_USER_PASSWORD not set. Generated a temporary random password for seeded users.');
        }
        const forcePassword = !!process.env.DEFAULT_USER_PASSWORD;
        for (const userData of adminUsers) {
            const existingUser = await UserEnhanced_1.User.findByEmail(userData.email);
            if (!existingUser) {
                const user = await UserEnhanced_1.User.createWithPassword(userData, defaultPassword);
                if (!forcePassword) {
                    // Require password change on first login when using generated password
                    user.mustChangePassword = true;
                    await user.save();
                }
                else {
                    user.mustChangePassword = false;
                    await user.save();
                }
                createdUsers.push(user);
                logger_1.logger.info(`✅ Created user: ${user.email} (${user.role})`);
            }
            else {
                createdUsers.push(existingUser);
                logger_1.logger.info(`ℹ️  User already exists: ${userData.email}`);
            }
        }
        // Create sample projects
        const sampleProjects = [
            {
                projectNumber: 'PROJ-2025-001',
                title: 'Downtown Office Building Renovation',
                description: 'Complete renovation of 5-story office building including HVAC, electrical, and interior design',
                type: 'commercial',
                status: 'in_progress',
                priority: 'high',
                customerName: 'Metro Properties LLC',
                customerEmail: 'contact@metroproperties.com',
                customerPhone: '+1 (555) 555-0101',
                customerAddress: '123 Main St, Downtown, NY 10001',
                startDate: new Date('2025-01-15'),
                estimatedCompletionDate: new Date('2025-06-30'),
                quotedAmount: 450000.00,
                approvedBudget: 475000.00,
                assignedSalesRep: createdUsers[1]?.id, // Office Manager
                assignedProjectManager: createdUsers[3]?.id, // Project Manager
                assignedTeamLeader: createdUsers[4]?.id, // Team Leader
                inquiryNumber: 'INQ-2025-000001',
                leadSource: 'Website Contact Form',
                tags: ['commercial', 'renovation', 'downtown'],
                notes: 'High-profile client with potential for additional projects'
            },
            {
                projectNumber: 'PROJ-2025-002',
                title: 'Residential Balcony Installation',
                description: 'Installation of premium balcony systems for luxury residential complex',
                type: 'residential',
                status: 'quoted',
                priority: 'medium',
                customerName: 'Sunshine Residences',
                customerEmail: 'admin@sunshineresidences.com',
                customerPhone: '+1 (555) 555-0102',
                customerAddress: '456 Oak Avenue, Suburbs, NY 10002',
                estimatedCompletionDate: new Date('2025-05-15'),
                quotedAmount: 125000.00,
                assignedSalesRep: createdUsers[1]?.id,
                inquiryNumber: 'INQ-2025-000002',
                leadSource: 'Referral',
                tags: ['residential', 'balcony', 'luxury'],
                notes: 'Customer interested in premium materials'
            },
            {
                projectNumber: 'PROJ-2025-003',
                title: 'Emergency Balcony Repair',
                description: 'Urgent repair of damaged balcony structure for safety compliance',
                type: 'repair',
                status: 'approved',
                priority: 'urgent',
                customerName: 'City Housing Authority',
                customerEmail: 'maintenance@cityhousing.gov',
                customerPhone: '+1 (555) 555-0103',
                startDate: new Date('2025-02-01'),
                estimatedCompletionDate: new Date('2025-02-15'),
                quotedAmount: 75000.00,
                approvedBudget: 80000.00,
                assignedProjectManager: createdUsers[3]?.id,
                assignedTeamLeader: createdUsers[4]?.id,
                inquiryNumber: 'INQ-2025-000003',
                leadSource: 'Emergency Call',
                tags: ['repair', 'urgent', 'safety'],
                notes: 'Safety-critical repair with tight deadline'
            }
        ];
        // Create projects
        const createdProjects = [];
        for (const projectData of sampleProjects) {
            const existingProject = await ProjectEnhanced_1.Project.findOne({
                where: { projectNumber: projectData.projectNumber }
            });
            if (!existingProject) {
                const project = await ProjectEnhanced_1.Project.create(projectData);
                createdProjects.push(project);
                logger_1.logger.info(`✅ Created project: ${project.projectNumber} - ${project.title}`);
            }
            else {
                createdProjects.push(existingProject);
                logger_1.logger.info(`ℹ️  Project already exists: ${projectData.projectNumber}`);
            }
        }
        // Create sample activities
        for (const project of createdProjects) {
            const activities = [
                {
                    projectId: project.id,
                    userId: createdUsers[1]?.id || 1, // Office Manager
                    activityType: 'created',
                    description: `Project "${project.title}" was created`,
                },
                {
                    projectId: project.id,
                    userId: createdUsers[3]?.id || 1, // Project Manager
                    activityType: 'assigned',
                    description: 'Project manager assigned to project',
                }
            ];
            for (const activityData of activities) {
                const existingActivity = await ProjectActivity_1.ProjectActivity.findOne({
                    where: {
                        projectId: activityData.projectId,
                        userId: activityData.userId,
                        activityType: activityData.activityType
                    }
                });
                if (!existingActivity) {
                    await ProjectActivity_1.ProjectActivity.create(activityData);
                }
            }
        }
        logger_1.logger.info('✅ Enhanced seed data created successfully');
        logger_1.logger.info('ℹ️  Users created:');
        createdUsers.forEach(user => {
            logger_1.logger.info(`   - ${user.email} (${user.getDisplayRole()})`);
        });
        logger_1.logger.info('🔑 Seed password (masking last 4 chars): ' + defaultPassword.replace(/.(?=.{4})/g, '*'));
    }
    catch (error) {
        logger_1.logger.error('❌ Seed data creation failed:', error);
        throw error;
    }
};
exports.createEnhancedSeedData = createEnhancedSeedData;
// Main initialization function
const setupEnhancedDatabase = async () => {
    try {
        // Ensure all migrations applied first to avoid missing columns (e.g., export_jobs.fileKey)
        try {
            const { runAllMigrations } = await Promise.resolve().then(() => __importStar(require('./migrationLoader')));
            await runAllMigrations();
        }
        catch (mErr) {
            logger_1.logger.warn('[setupEnhancedDatabase] Failed to apply migrations prior to sync (continuing): ' + mErr?.message);
        }
        await (0, exports.initializeDatabase)();
        await (0, exports.createEnhancedSeedData)();
        logger_1.logger.info('🎉 Enhanced database setup completed successfully!');
    }
    catch (error) {
        logger_1.logger.error('❌ Enhanced database setup failed:', error);
        throw error;
    }
};
exports.setupEnhancedDatabase = setupEnhancedDatabase;
// Export for CLI usage
if (require.main === module) {
    (0, exports.setupEnhancedDatabase)()
        .then(() => {
        logger_1.logger.info('✅ Database setup completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('❌ Database setup failed:', error);
        process.exit(1);
    });
}
