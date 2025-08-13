import { User, Project } from '../models';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

export interface SalesRepWorkload {
  userId: number;
  user: User;
  activeProjects: number;
  capacity: number;
  utilizationPercentage: number;
}

/**
 * Generate a unique inquiry number
 * Format: INQ-YYYY-NNNNNN (e.g., INQ-2024-000001)
 */
export const generateInquiryNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `INQ-${year}-`;
  // In test environment, use count-based generation to avoid race conditions & simplify uniqueness with in-memory DB
  if (process.env.NODE_ENV === 'test') {
    const count = await Project.count({
      where: {
        inquiryNumber: {
          [Op.like]: `${prefix}%`,
        },
      },
    });
    const next = count + 1;
    return `${prefix}${next.toString().padStart(6, '0')}`;
  }

  // Production / non-test: find latest sequentially
  const latestProject = await Project.findOne({
    where: {
      inquiryNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['inquiryNumber', 'DESC']],
  });

  const nextNumber = latestProject
    ? parseInt(latestProject.inquiryNumber.split('-')[2], 10) + 1
    : 1;
  return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
};

/**
 * Get workload for all sales reps
 */
export const getSalesRepWorkloads = async (): Promise<SalesRepWorkload[]> => {
  // Get all active sales reps
  const salesReps = await User.findAll({
    where: {
      isSalesRep: true,
      isActive: true,
    },
  });

  const workloads: SalesRepWorkload[] = [];

  for (const salesRep of salesReps) {
    // Count active projects assigned to this sales rep
    const activeProjects = await Project.count({
      where: {
        assignedSalesRepId: salesRep.id,
        status: {
          [Op.in]: ['inquiry', 'quoted', 'approved', 'in_progress'],
        },
      },
    });

    const capacity = salesRep.salesCapacity || 10; // Default capacity
    const utilizationPercentage = capacity > 0 ? Math.round((activeProjects / capacity) * 100) : 100;

    workloads.push({
      userId: salesRep.id,
      user: salesRep,
      activeProjects,
      capacity,
      utilizationPercentage,
    });
  }

  return workloads.sort((a, b) => a.utilizationPercentage - b.utilizationPercentage);
};

/**
 * Automatically assign a project to the best available sales rep
 * Uses round-robin with capacity consideration
 */
export const autoAssignSalesRep = async (projectId: number): Promise<User | null> => {
  try {
    const workloads = await getSalesRepWorkloads();

    if (workloads.length === 0) {
      logger.warn('No active sales reps available for assignment');
      return null;
    }

    // Find the sales rep with the lowest utilization percentage
    const bestSalesRep = workloads.find(workload => workload.utilizationPercentage < 100);

    if (!bestSalesRep) {
      logger.warn('All sales reps are at capacity, assigning to least loaded rep');
      const leastLoadedRep = workloads[0]; // Already sorted by utilization
      
      await Project.update(
        {
          assignedSalesRepId: leastLoadedRep.userId,
          assignedAt: new Date(),
        },
        {
          where: { id: projectId },
        }
      );

      logger.info(`Project ${projectId} assigned to overloaded sales rep ${leastLoadedRep.user.fullName} (${leastLoadedRep.utilizationPercentage}% utilization)`);
      return leastLoadedRep.user;
    }

    // Assign to the best available sales rep
    await Project.update(
      {
        assignedSalesRepId: bestSalesRep.userId,
        assignedAt: new Date(),
      },
      {
        where: { id: projectId },
      }
    );

    logger.info(`Project ${projectId} assigned to sales rep ${bestSalesRep.user.fullName} (${bestSalesRep.utilizationPercentage}% utilization)`);
    return bestSalesRep.user;

  } catch (error) {
    logger.error('Error in auto assignment:', error);
    return null;
  }
};

/**
 * Manually assign a project to a specific sales rep
 */
export const assignSalesRep = async (projectId: number, salesRepId: number): Promise<boolean> => {
  try {
    // Verify the sales rep exists and is active
    const salesRep = await User.findOne({
      where: {
        id: salesRepId,
        isSalesRep: true,
        isActive: true,
      },
    });

    if (!salesRep) {
      logger.error(`Sales rep ${salesRepId} not found or inactive`);
      return false;
    }

    await Project.update(
      {
        assignedSalesRepId: salesRepId,
        assignedAt: new Date(),
      },
      {
        where: { id: projectId },
      }
    );

    logger.info(`Project ${projectId} manually assigned to sales rep ${salesRep.fullName}`);
    return true;

  } catch (error) {
    logger.error('Error in manual assignment:', error);
    return false;
  }
};

/**
 * Unassign a sales rep from a project
 */
export const unassignSalesRep = async (projectId: number): Promise<boolean> => {
  try {
    const [affected] = await Project.update(
      {
        // Cast to any to bypass type restriction for clearing fields
        assignedSalesRepId: null as any,
        assignedAt: null as any,
      },
      {
        where: { id: projectId },
      }
    );

    if (affected === 0) {
      logger.warn(`Attempted to unassign sales rep from project ${projectId} but no rows were affected`);
      return false;
    }

    logger.info(`Sales rep unassigned from project ${projectId}`);
    return true;

  } catch (error) {
    logger.error('Error unassigning sales rep:', error);
    return false;
  }
};

/**
 * Get sales rep performance metrics
 */
export const getSalesRepMetrics = async (salesRepId: number, periodDays: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const metrics = await Project.findAll({
    where: {
      assignedSalesRepId: salesRepId,
      createdAt: {
        [Op.gte]: startDate,
      },
    },
    attributes: [
      'status',
      'createdAt',
      'assignedAt',
    ],
  });

  const totalProjects = metrics.length;
  const convertedProjects = metrics.filter(p => p.status === 'approved').length;
  const conversionRate = totalProjects > 0 ? Math.round((convertedProjects / totalProjects) * 100) : 0;

  // Calculate average response time (time from inquiry to assignment)
  const responseTimes = metrics
    .filter(p => p.assignedAt)
    .map(p => {
      const created = new Date(p.createdAt).getTime();
      const assigned = new Date(p.assignedAt!).getTime();
      return assigned - created;
    });

  const avgResponseTimeMs = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0;

  const avgResponseTimeHours = Math.round(avgResponseTimeMs / (1000 * 60 * 60) * 100) / 100;

  return {
    totalProjects,
    convertedProjects,
    conversionRate,
    avgResponseTimeHours,
    periodDays,
  };
};

// Legacy aggregate export for compatibility with existing tests
export const salesAssignment = {
  generateInquiryNumber,
  getSalesRepWorkloads,
  autoAssignSalesRep,
  assignSalesRep,
  unassignSalesRep,
  getSalesRepMetrics,
};
