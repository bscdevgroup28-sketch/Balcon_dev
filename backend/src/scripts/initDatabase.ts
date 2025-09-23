import { sequelize } from '../config/database';
import { User, Project } from '../models';
import { logger } from '../utils/logger';

export const initializeDatabase = async (): Promise<void> => {
  try {
    logger.info('🔄 Initializing database...');
    
    // Drop and recreate all tables
    await sequelize.drop();
    await sequelize.sync({ force: true });
    logger.info('✅ Database tables created');
    
    // Create seed data
    await createSeedData();
    logger.info('✅ Seed data created');
    
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export const createSeedData = async (): Promise<void> => {
  try {
    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@balconbuilders.com',
      phone: '555-0100',
      role: 'admin',
      isActive: true,
      isSalesRep: false,
      salesCapacity: 0
    });

    // Create sales representatives
    const salesRep1 = await User.create({
      firstName: 'John',
      lastName: 'Sales',
      email: 'john.sales@balconbuilders.com',
      phone: '555-0101',
      role: 'sales',
      isActive: true,
      isSalesRep: true,
      salesCapacity: 15
    });

    const salesRep2 = await User.create({
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@balconbuilders.com',
      phone: '555-0102',
      role: 'sales',
      isActive: true,
      isSalesRep: true,
      salesCapacity: 12
    });

    // Create test customer
    const customer = await User.create({
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@example.com',
      phone: '555-0200',
      company: 'ABC Construction',
      role: 'user',
      isActive: true,
      isSalesRep: false,
      salesCapacity: 0
    });

    // Create a sample project
    const sampleProject = await Project.create({
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

    logger.info('✅ Seed data created successfully:', {
      users: 4,
      projects: 1,
      adminUser: adminUser.email,
      salesReps: [salesRep1.email, salesRep2.email],
      customer: customer.email,
      sampleProject: sampleProject.inquiryNumber
    });

  } catch (error) {
    logger.error('❌ Failed to create seed data:', error);
    throw error;
  }
};

export const resetDatabase = async (): Promise<void> => {
  try {
    logger.info('🔄 Resetting database...');
    await sequelize.drop();
    await initializeDatabase();
    logger.info('✅ Database reset complete');
  } catch (error) {
    logger.error('❌ Database reset failed:', error);
    throw error;
  }
};
