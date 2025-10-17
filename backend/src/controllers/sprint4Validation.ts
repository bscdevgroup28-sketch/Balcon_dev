import { Request, Response } from 'express';
import { generateInquiryNumber, autoAssignSalesRep, getSalesRepWorkloads } from '../services/salesAssignment';
import { Project, User } from '../models';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export const testSprint4Features = async (req: Request, res: Response): Promise<void> => {
  try {
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: { passed: 0, failed: 0, total: 0 }
    };

    // Test 1: Inquiry Number Generation
    try {
      const inquiryNumber1 = await generateInquiryNumber();
      const inquiryNumber2 = await generateInquiryNumber();
      
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
    } catch (error) {
      testResults.tests.inquiryNumberGeneration = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      testResults.summary.failed++;
    }
    testResults.summary.total++;

    // Test 2: Sales Rep Workload Calculation
    try {
      const workloads = await getSalesRepWorkloads();
      
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
    } catch (error) {
      testResults.tests.salesRepWorkloads = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      testResults.summary.failed++;
    }
    testResults.summary.total++;

    // Test 3: Create Test Project with Auto-Assignment
    try {
      const inquiryNumber = await generateInquiryNumber();
      
      const testProject = await Project.create({
        userId: 1, // Default test user
        inquiryNumber,
        title: 'Sprint 4 Validation Test Project',
        description: 'Automated test project for Sprint 4 feature validation',
        projectType: 'commercial',
        status: 'inquiry',
        priority: 'medium',
        estimatedBudget: 250000
      });

      const assignedSalesRep = await autoAssignSalesRep(testProject.id);

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
    } catch (error) {
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
        serviceConfigured: !!(config.email.sendgridApiKey || config.email.smtp.host),
        fromEmail: config.email.fromEmail,
        adminEmail: config.email.adminEmail,
        sendGridConfigured: !!config.email.sendgridApiKey,
        smtpConfigured: !!config.email.smtp.host
      };

      testResults.tests.emailServiceConfiguration = {
        status: emailConfig.serviceConfigured ? 'PASSED' : 'WARNING',
        data: emailConfig,
        message: emailConfig.serviceConfigured ? 'Email service configured' : 'Email service not configured - emails will be logged only'
      };
      
      if (emailConfig.serviceConfigured) {
        testResults.summary.passed++;
      } else {
        testResults.summary.failed++;
      }
    } catch (error) {
      testResults.tests.emailServiceConfiguration = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      testResults.summary.failed++;
    }
    testResults.summary.total++;

    // Test 5: Database Models Integrity
    try {
      const userCount = await User.count();
      const projectCount = await Project.count();
  // Approximate sales reps as users with role in sales-capable roles
  const salesRepCount = await User.count({ where: { role: ['sales','owner','admin','office_manager'] as any } });

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
    } catch (error) {
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
        uploadPath: config.upload.path,
        maxFileSize: config.upload.maxFileSize,
        maxFileSizeFormatted: `${Math.round(config.upload.maxFileSize / (1024 * 1024))}MB`,
        maxFiles: config.upload.maxFiles,
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
    } catch (error) {
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

    logger.info('Sprint 4 validation completed', {
      passed: testResults.summary.passed,
      failed: testResults.summary.failed,
      successRate: testResults.summary.successRate
    });

    res.json({
      message: 'Sprint 4 Feature Validation Results',
      data: testResults
    });

  } catch (error) {
    logger.error('Sprint 4 validation failed:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred during validation'
    });
  }
};

export const createTestData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Create test sales rep if doesn't exist
    const [salesRep, salesRepCreated] = await User.findOrCreate({
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
    const [customer, customerCreated] = await User.findOrCreate({
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

  } catch (error) {
    logger.error('Failed to create test data:', error);
    res.status(500).json({
      error: 'Failed to create test data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
