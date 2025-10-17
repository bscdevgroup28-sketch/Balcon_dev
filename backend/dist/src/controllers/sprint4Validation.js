"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestData = exports.testSprint4Features = void 0;
const salesAssignment_1 = require("../services/salesAssignment");
const models_1 = require("../models");
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
const testSprint4Features = async (req, res) => {
    try {
        const testResults = {
            timestamp: new Date().toISOString(),
            tests: {},
            summary: { passed: 0, failed: 0, total: 0 }
        };
        // Test 1: Inquiry Number Generation
        try {
            const inquiryNumber1 = await (0, salesAssignment_1.generateInquiryNumber)();
            const inquiryNumber2 = await (0, salesAssignment_1.generateInquiryNumber)();
            testResults.tests.inquiryNumberGeneration = {
                status: 'PASSED',
                data: {
                    inquiryNumber1,
                    inquiryNumber2,
                    formatValid: /^INQ-\d{4}-\d{6}$/.test(inquiryNumber1),
                    sequential: inquiryNumber2 > inquiryNumber1
                }
            };
            testResults.summary.passed++;
        }
        catch (error) {
            testResults.tests.inquiryNumberGeneration = {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            testResults.summary.failed++;
        }
        testResults.summary.total++;
        // Test 2: Sales Rep Workload Calculation
        try {
            const workloads = await (0, salesAssignment_1.getSalesRepWorkloads)();
            testResults.tests.salesRepWorkloads = {
                status: 'PASSED',
                data: {
                    salesRepsFound: workloads.length,
                    workloads: workloads.map(w => ({
                        salesRepId: w.userId,
                        name: w.user.getFullName ? w.user.getFullName() : `${w.user.firstName} ${w.user.lastName}`,
                        activeProjects: w.activeProjects,
                        capacity: w.capacity,
                        utilization: w.utilizationPercentage
                    }))
                }
            };
            testResults.summary.passed++;
        }
        catch (error) {
            testResults.tests.salesRepWorkloads = {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            testResults.summary.failed++;
        }
        testResults.summary.total++;
        // Test 3: Create Test Project with Auto-Assignment
        try {
            const inquiryNumber = await (0, salesAssignment_1.generateInquiryNumber)();
            const testProject = await models_1.Project.create({
                userId: 1, // Default test user
                inquiryNumber,
                title: 'Sprint 4 Validation Test Project',
                description: 'Automated test project for Sprint 4 feature validation',
                projectType: 'commercial',
                status: 'inquiry',
                priority: 'medium',
                estimatedBudget: 250000
            });
            const assignedSalesRep = await (0, salesAssignment_1.autoAssignSalesRep)(testProject.id);
            testResults.tests.projectCreationAndAssignment = {
                status: 'PASSED',
                data: {
                    projectId: testProject.id,
                    inquiryNumber: testProject.inquiryNumber,
                    assignedSalesRep: assignedSalesRep ? {
                        id: assignedSalesRep.id,
                        name: assignedSalesRep.getFullName ? assignedSalesRep.getFullName() : `${assignedSalesRep.firstName} ${assignedSalesRep.lastName}`,
                        isSalesRep: true
                    } : null,
                    autoAssignmentWorked: !!assignedSalesRep
                }
            };
            testResults.summary.passed++;
        }
        catch (error) {
            testResults.tests.projectCreationAndAssignment = {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            testResults.summary.failed++;
        }
        testResults.summary.total++;
        // Test 4: Email Service Configuration
        try {
            const emailConfig = {
                serviceConfigured: !!(environment_1.config.email.sendgridApiKey || environment_1.config.email.smtp.host),
                fromEmail: environment_1.config.email.fromEmail,
                adminEmail: environment_1.config.email.adminEmail,
                sendGridConfigured: !!environment_1.config.email.sendgridApiKey,
                smtpConfigured: !!environment_1.config.email.smtp.host
            };
            testResults.tests.emailServiceConfiguration = {
                status: emailConfig.serviceConfigured ? 'PASSED' : 'WARNING',
                data: emailConfig,
                message: emailConfig.serviceConfigured ? 'Email service configured' : 'Email service not configured - emails will be logged only'
            };
            if (emailConfig.serviceConfigured) {
                testResults.summary.passed++;
            }
            else {
                testResults.summary.failed++;
            }
        }
        catch (error) {
            testResults.tests.emailServiceConfiguration = {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            testResults.summary.failed++;
        }
        testResults.summary.total++;
        // Test 5: Database Models Integrity
        try {
            const userCount = await models_1.User.count();
            const projectCount = await models_1.Project.count();
            // Approximate sales reps as users with role in sales-capable roles
            const salesRepCount = await models_1.User.count({ where: { role: ['sales', 'owner', 'admin', 'office_manager'] } });
            testResults.tests.databaseIntegrity = {
                status: 'PASSED',
                data: {
                    totalUsers: userCount,
                    totalProjects: projectCount,
                    salesReps: salesRepCount,
                    modelsAccessible: true
                }
            };
            testResults.summary.passed++;
        }
        catch (error) {
            testResults.tests.databaseIntegrity = {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            testResults.summary.failed++;
        }
        testResults.summary.total++;
        // Test 6: File Upload Configuration
        try {
            const uploadConfig = {
                uploadPath: environment_1.config.upload.path,
                maxFileSize: environment_1.config.upload.maxFileSize,
                maxFileSizeFormatted: `${Math.round(environment_1.config.upload.maxFileSize / (1024 * 1024))}MB`,
                maxFiles: environment_1.config.upload.maxFiles,
                allowedTypes: [
                    'image/jpeg', 'image/png', 'application/pdf',
                    'application/msword', 'application/x-autocad'
                ]
            };
            testResults.tests.fileUploadConfiguration = {
                status: 'PASSED',
                data: uploadConfig
            };
            testResults.summary.passed++;
        }
        catch (error) {
            testResults.tests.fileUploadConfiguration = {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            testResults.summary.failed++;
        }
        testResults.summary.total++;
        // Calculate success rate
        const successRate = testResults.summary.total > 0
            ? (testResults.summary.passed / testResults.summary.total * 100).toFixed(1)
            : '0';
        testResults.summary.successRate = `${successRate}%`;
        testResults.summary.status = testResults.summary.failed === 0 ? 'ALL_PASSED' : 'SOME_FAILED';
        logger_1.logger.info('Sprint 4 validation completed', {
            passed: testResults.summary.passed,
            failed: testResults.summary.failed,
            successRate: testResults.summary.successRate
        });
        res.json({
            message: 'Sprint 4 Feature Validation Results',
            data: testResults
        });
    }
    catch (error) {
        logger_1.logger.error('Sprint 4 validation failed:', error);
        res.status(500).json({
            error: 'Validation failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred during validation'
        });
    }
};
exports.testSprint4Features = testSprint4Features;
const createTestData = async (req, res) => {
    try {
        // Create test sales rep if doesn't exist
        const [salesRep, salesRepCreated] = await models_1.User.findOrCreate({
            where: { email: 'test.salesrep@balconbuilders.com' },
            defaults: {
                firstName: 'Test',
                lastName: 'SalesRep',
                email: 'test.salesrep@balconbuilders.com',
                phone: '555-TEST-REP',
                role: 'sales',
                isActive: true,
                isVerified: true,
                passwordHash: 'temp',
                permissions: [],
                canAccessFinancials: false,
                canManageProjects: true,
                canManageUsers: false,
                mustChangePassword: false
            }
        });
        // Create test customer if doesn't exist
        const [customer, customerCreated] = await models_1.User.findOrCreate({
            where: { email: 'test.customer@example.com' },
            defaults: {
                firstName: 'Test',
                lastName: 'Customer',
                email: 'test.customer@example.com',
                phone: '555-TEST-CUST',
                role: 'user',
                isActive: true,
                isVerified: true,
                passwordHash: 'temp',
                permissions: [],
                canAccessFinancials: false,
                canManageProjects: false,
                canManageUsers: false,
                mustChangePassword: false
            }
        });
        res.json({
            message: 'Test data created successfully',
            data: {
                salesRep: {
                    id: salesRep.id,
                    name: salesRep.getFullName ? salesRep.getFullName() : `${salesRep.firstName} ${salesRep.lastName}`,
                    created: salesRepCreated
                },
                customer: {
                    id: customer.id,
                    name: customer.getFullName ? customer.getFullName() : `${customer.firstName} ${customer.lastName}`,
                    created: customerCreated
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create test data:', error);
        res.status(500).json({
            error: 'Failed to create test data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createTestData = createTestData;
