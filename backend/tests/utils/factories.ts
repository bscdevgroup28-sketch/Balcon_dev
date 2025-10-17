import { User, Project } from '@/models';
import { generateInquiryNumber } from '@/services/salesAssignment';

export const createTestUser = async (overrides: any = {}) => {
  return User.create({
    firstName: 'Test',
    lastName: 'User',
    email: `test_${Date.now()}_${Math.random().toString(36).slice(2,6)}@example.com`,
    role: 'user',
    isActive: true,
    passwordHash: 'temp',
    ...overrides,
  } as any);
};

export const createTestSalesRep = async (overrides: any = {}) => {
  return createTestUser({
    firstName: 'Rep',
    lastName: 'User',
    role: 'sales',
    passwordHash: 'temp',
    ...overrides,
  });
};

export const createTestProject = async (overrides: any = {}) => {
  const user = await createTestUser();
  const inquiryNumber = await generateInquiryNumber();
  return Project.create({
    userId: user.id,
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
