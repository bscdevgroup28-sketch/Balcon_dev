import { User, Project } from '@/models';
import { generateInquiryNumber } from '@/services/salesAssignment';

export const createTestUser = async (overrides: Partial<User['_creationAttributes']> = {}) => {
  return User.create({
    firstName: 'Test',
    lastName: 'User',
    email: `test_${Date.now()}_${Math.random().toString(36).slice(2,6)}@example.com`,
    phone: '+15550000',
    role: 'user',
    isActive: true,
    isSalesRep: false,
    ...overrides,
  } as any);
};

export const createTestSalesRep = async (overrides: Partial<User['_creationAttributes']> = {}) => {
  return createTestUser({
    firstName: 'Rep',
    lastName: 'User',
    role: 'sales',
    isSalesRep: true,
    salesCapacity: 10,
    ...overrides,
  });
};

export const createTestProject = async (userId: number, overrides: Partial<Project['_creationAttributes']> = {}) => {
  const inquiryNumber = await generateInquiryNumber();
  return Project.create({
    userId,
    inquiryNumber,
    title: 'Test Project',
    description: 'A project created for integration testing',
    projectType: 'residential',
    status: 'inquiry',
    priority: 'medium',
    requirements: {},
    materials: [],
    ...overrides,
  } as any);
};
