// TODO: Replace manual any casts with typed repository abstraction
// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { generateInquiryNumber, getSalesRepWorkloads, autoAssignSalesRep, assignSalesRep, unassignSalesRep } from '../../../src/services/salesAssignment';
import { User, Project } from '../../../src/models';

// Mock the models
jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');

const MockUser: any = User as any;
const MockProject: any = Project as any;

describe('Sales Assignment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateInquiryNumber (test mode count strategy)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('produces sequential padded numbers based on count', async () => {
      MockProject.count = jest.fn()
        .mockResolvedValueOnce(0) // first call
        .mockResolvedValueOnce(1) // second call
        .mockResolvedValueOnce(2); // third call

      const year = new Date().getFullYear();
      const first = await generateInquiryNumber();
      const second = await generateInquiryNumber();
      const third = await generateInquiryNumber();

      expect(first).toBe(`INQ-${year}-000001`);
      expect(second).toBe(`INQ-${year}-000002`);
      expect(third).toBe(`INQ-${year}-000003`);
      expect(MockProject.count).toHaveBeenCalledTimes(3);
    });
  });

  describe('getSalesRepWorkloads', () => {
    it('should return workloads for all active sales reps', async () => {
      const mockSalesReps = [
        {
          id: 1,
          fullName: 'John Doe',
          salesCapacity: 10,
          isSalesRep: true,
          isActive: true,
        },
        {
          id: 2,
          fullName: 'Jane Smith',
          salesCapacity: 15,
          isSalesRep: true,
          isActive: true,
        },
      ];

      MockUser.findAll = jest.fn().mockResolvedValue(mockSalesReps);
      MockProject.count = jest.fn()
        .mockResolvedValueOnce(3) // John has 3 active projects
        .mockResolvedValueOnce(7); // Jane has 7 active projects

  const result = await getSalesRepWorkloads();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        userId: 1,
        user: mockSalesReps[0],
        activeProjects: 3,
        capacity: 10,
        utilizationPercentage: 30,
      });
      expect(result[1]).toEqual({
        userId: 2,
        user: mockSalesReps[1],
        activeProjects: 7,
        capacity: 15,
  utilizationPercentage: 47,
      });
    });

    it('should handle sales reps with no active projects', async () => {
      const mockSalesReps = [
        {
          id: 1,
          fullName: 'New Rep',
          salesCapacity: 5,
          isSalesRep: true,
          isActive: true,
        },
      ];

      MockUser.findAll = jest.fn().mockResolvedValue(mockSalesReps);
      MockProject.count = jest.fn().mockResolvedValue(0);

  const result = await getSalesRepWorkloads();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        userId: 1,
        user: mockSalesReps[0],
        activeProjects: 0,
        capacity: 5,
        utilizationPercentage: 0,
      });
    });
  });

  describe('autoAssignSalesRep', () => {
    const mockProject = {
      id: 123,
      title: 'Test Project',
      status: 'inquiry',
    };

    const mockSalesReps = [
      {
        id: 1,
        fullName: 'Low Load Rep',
        salesCapacity: 10,
        isSalesRep: true,
        isActive: true,
      },
      {
        id: 2,
        fullName: 'High Load Rep',
        salesCapacity: 10,
        isSalesRep: true,
        isActive: true,
      },
    ];

    beforeEach(() => {
      MockUser.findAll = jest.fn().mockResolvedValue(mockSalesReps);
      MockProject.update = jest.fn().mockResolvedValue([1]); // Mock successful update
    });

    it('should assign to sales rep with lowest utilization', async () => {
      // Mock workloads: first rep has 20% utilization, second has 60%
      MockProject.count = jest.fn()
        .mockResolvedValueOnce(2) // First rep: 2 projects
        .mockResolvedValueOnce(6); // Second rep: 6 projects

  const result = await autoAssignSalesRep(123);

      expect(result).toEqual(mockSalesReps[0]); // Should assign to first rep (lower utilization)
      expect(MockProject.update).toHaveBeenCalledWith(
        {
          assignedSalesRepId: 1,
          assignedAt: expect.any(Date),
        },
        {
          where: { id: 123 },
        }
      );
    });

    it('should assign to overloaded rep when all are at 100% capacity', async () => {
      // Mock workloads: both reps at 100% capacity
      MockProject.count = jest.fn()
        .mockResolvedValueOnce(10) // First rep: 10/10 projects (100%)
        .mockResolvedValueOnce(10); // Second rep: 10/10 projects (100%)

  const result = await autoAssignSalesRep(123);

      expect(result).toEqual(mockSalesReps[0]); // Should assign to first rep (least overloaded)
      expect(MockProject.update).toHaveBeenCalledWith(
        {
          assignedSalesRepId: 1,
          assignedAt: expect.any(Date),
        },
        {
          where: { id: 123 },
        }
      );
    });

    it('should return null when no sales reps are available', async () => {
      MockUser.findAll = jest.fn().mockResolvedValue([]);

  const result = await autoAssignSalesRep(123);

      expect(result).toBeNull();
      expect(MockProject.update).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      MockUser.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

  const result = await autoAssignSalesRep(123);

      expect(result).toBeNull();
      expect(MockProject.update).not.toHaveBeenCalled();
    });
  });

  describe('assignSalesRep', () => {
    it('should successfully assign a specific sales rep', async () => {
      const mockSalesRep = {
        id: 5,
        fullName: 'Specific Rep',
        isSalesRep: true,
        isActive: true,
      };

      MockUser.findOne = jest.fn().mockResolvedValue(mockSalesRep);
      MockProject.update = jest.fn().mockResolvedValue([1]);

  const result = await assignSalesRep(123, 5);

      expect(result).toBe(true);
        expect(MockUser.findOne).toHaveBeenCalledWith({
          where: {
            id: 5,
            isActive: true,
          },
        });
      expect(MockProject.update).toHaveBeenCalledWith(
        {
          assignedSalesRepId: 5,
          assignedAt: expect.any(Date),
        },
        {
          where: { id: 123 },
        }
      );
    });

    it('should return false when sales rep is not found', async () => {
      MockUser.findOne = jest.fn().mockResolvedValue(null);

  const result = await assignSalesRep(123, 999);

      expect(result).toBe(false);
      expect(MockProject.update).not.toHaveBeenCalled();
    });

    it('should return false when sales rep is inactive', async () => {
      const mockInactiveRep = {
        id: 5,
        fullName: 'Inactive Rep',
        isSalesRep: true,
        isActive: false,
      };

      MockUser.findOne = jest.fn().mockResolvedValue(null); // Mock query returns null for inactive rep

  const result = await assignSalesRep(123, 5);

      expect(result).toBe(false);
      expect(MockProject.update).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      MockUser.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

  const result = await assignSalesRep(123, 5);

      expect(result).toBe(false);
      expect(MockProject.update).not.toHaveBeenCalled();
    });
  });

  describe('unassignSalesRep', () => {
    it('should successfully unassign a sales rep', async () => {
      MockProject.update = jest.fn().mockResolvedValue([1]);

  const result = await unassignSalesRep(123);

      expect(result).toBe(true);
      expect(MockProject.update).toHaveBeenCalledWith(
        {
          assignedSalesRepId: null,
          assignedAt: null,
        },
        {
          where: { id: 123 },
        }
      );
    });

    it('should return false when project is not found', async () => {
      MockProject.update = jest.fn().mockResolvedValue([0]); // No rows affected

  const result = await unassignSalesRep(999);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      MockProject.update = jest.fn().mockRejectedValue(new Error('Database error'));

  const result = await unassignSalesRep(123);

      expect(result).toBe(false);
    });
  });
});
