"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestProject = exports.createTestSalesRep = exports.createTestUser = void 0;
const models_1 = require("@/models");
const salesAssignment_1 = require("@/services/salesAssignment");
const createTestUser = async (overrides = {}) => {
    return models_1.User.create({
        firstName: 'Test',
        lastName: 'User',
        email: `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`,
        role: 'user',
        isActive: true,
        passwordHash: 'temp',
        ...overrides,
    });
};
exports.createTestUser = createTestUser;
const createTestSalesRep = async (overrides = {}) => {
    return (0, exports.createTestUser)({
        firstName: 'Rep',
        lastName: 'User',
        role: 'sales',
        passwordHash: 'temp',
        ...overrides,
    });
};
exports.createTestSalesRep = createTestSalesRep;
const createTestProject = async (overrides = {}) => {
    const user = await (0, exports.createTestUser)();
    const inquiryNumber = await (0, salesAssignment_1.generateInquiryNumber)();
    return models_1.Project.create({
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
    });
};
exports.createTestProject = createTestProject;
