import { enhancedSequelize } from '../config/enhancedDatabase';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

// Import enhanced models
import { User } from '../models/UserEnhanced';
import { Project } from '../models/ProjectEnhanced';
import { ProjectActivity } from '../models/ProjectActivity';

// Setup model associations
const setupAssociations = () => {
  // User associations
  User.hasMany(Project, { foreignKey: 'assignedSalesRep', as: 'salesProjects' });
  User.hasMany(Project, { foreignKey: 'assignedProjectManager', as: 'managedProjects' });
  User.hasMany(Project, { foreignKey: 'assignedTeamLeader', as: 'ledProjects' });
  User.hasMany(ProjectActivity, { foreignKey: 'userId', as: 'activities' });

  // Project associations
  Project.belongsTo(User, { foreignKey: 'assignedSalesRep', as: 'salesRep' });
  Project.belongsTo(User, { foreignKey: 'assignedProjectManager', as: 'projectManager' });
  Project.belongsTo(User, { foreignKey: 'assignedTeamLeader', as: 'teamLeader' });
  Project.hasMany(ProjectActivity, { foreignKey: 'projectId', as: 'activities' });

  // ProjectActivity associations
  ProjectActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ProjectActivity.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
};

// Initialize database with enhanced models
export const initializeDatabase = async (): Promise<void> => {
  try {
    logger.info('🔄 Initializing enhanced database...');

    // Setup associations
    setupAssociations();

    // Create tables (force: true for clean start with enhanced models)
    await enhancedSequelize.sync({ force: true, alter: false });
    
    logger.info('✅ Enhanced database tables created/updated successfully');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Reset database for fresh start
export const resetDatabase = async (): Promise<void> => {
  try {
    logger.info('🔄 Resetting database...');

    // Setup associations
    setupAssociations();

    // Drop and recreate all tables
    await enhancedSequelize.sync({ force: true });
    
    logger.info('✅ Database reset completed');
  } catch (error) {
    logger.error('❌ Database reset failed:', error);
    throw error;
  }
};

// Create enhanced seed data
export const createEnhancedSeedData = async (): Promise<void> => {
  try {
    logger.info('🌱 Creating enhanced seed data...');

    // Create admin users for each role
    const adminUsers = [
      {
        email: 'owner@balconbuilders.com',
        firstName: 'Executive',
        lastName: 'Owner',
        role: 'owner' as const,
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
        role: 'office_manager' as const,
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
        role: 'shop_manager' as const,
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
        role: 'project_manager' as const,
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
        role: 'team_leader' as const,
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
        role: 'technician' as const,
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
    const createdUsers: User[] = [];
    for (const userData of adminUsers) {
      const existingUser = await User.findByEmail(userData.email);
      if (!existingUser) {
        const user = await User.createWithPassword(userData, 'admin123');
        createdUsers.push(user);
        logger.info(`✅ Created user: ${user.email} (${user.role})`);
      } else {
        createdUsers.push(existingUser);
        logger.info(`ℹ️  User already exists: ${userData.email}`);
      }
    }

    // Create sample projects
    const sampleProjects = [
      {
        projectNumber: 'PROJ-2025-001',
        title: 'Downtown Office Building Renovation',
        description: 'Complete renovation of 5-story office building including HVAC, electrical, and interior design',
        type: 'commercial' as const,
        status: 'in_progress' as const,
        priority: 'high' as const,
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
        type: 'residential' as const,
        status: 'quoted' as const,
        priority: 'medium' as const,
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
        type: 'repair' as const,
        status: 'approved' as const,
        priority: 'urgent' as const,
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
    const createdProjects: Project[] = [];
    for (const projectData of sampleProjects) {
      const existingProject = await Project.findOne({ 
        where: { projectNumber: projectData.projectNumber } 
      });
      
      if (!existingProject) {
        const project = await Project.create(projectData);
        createdProjects.push(project);
        logger.info(`✅ Created project: ${project.projectNumber} - ${project.title}`);
      } else {
        createdProjects.push(existingProject);
        logger.info(`ℹ️  Project already exists: ${projectData.projectNumber}`);
      }
    }

    // Create sample activities
    for (const project of createdProjects) {
      const activities = [
        {
          projectId: project.id,
          userId: createdUsers[1]?.id || 1, // Office Manager
          activityType: 'created' as const,
          description: `Project "${project.title}" was created`,
        },
        {
          projectId: project.id,
          userId: createdUsers[3]?.id || 1, // Project Manager
          activityType: 'assigned' as const,
          description: 'Project manager assigned to project',
        }
      ];

      for (const activityData of activities) {
        const existingActivity = await ProjectActivity.findOne({
          where: {
            projectId: activityData.projectId,
            userId: activityData.userId,
            activityType: activityData.activityType
          }
        });

        if (!existingActivity) {
          await ProjectActivity.create(activityData);
        }
      }
    }

    logger.info('✅ Enhanced seed data created successfully');
    logger.info('ℹ️  Default admin password for all users: admin123');
    logger.info('ℹ️  Users created:');
    createdUsers.forEach(user => {
      logger.info(`   - ${user.email} (${user.getDisplayRole()})`);
    });

  } catch (error) {
    logger.error('❌ Seed data creation failed:', error);
    throw error;
  }
};

// Main initialization function
export const setupEnhancedDatabase = async (): Promise<void> => {
  try {
    await initializeDatabase();
    await createEnhancedSeedData();
    logger.info('🎉 Enhanced database setup completed successfully!');
  } catch (error) {
    logger.error('❌ Enhanced database setup failed:', error);
    throw error;
  }
};

// Export for CLI usage
if (require.main === module) {
  setupEnhancedDatabase()
    .then(() => {
      logger.info('✅ Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}
