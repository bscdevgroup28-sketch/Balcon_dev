import express, { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { logger } from '../utils/logger';
import { requirePermission } from '../middleware/authEnhanced';
import ProjectEnhanced from '../models/ProjectEnhanced';
import UserEnhanced from '../models/UserEnhanced';
import ProjectActivity from '../models/ProjectActivity';

const router = express.Router();

// Dashboard overview statistics
router.get('/dashboard', requirePermission('view_all_data'), async (req: Request, res: Response) => {
  try {
    // Get basic project counts
    const totalProjects = await ProjectEnhanced.count();
    const activeProjects = await ProjectEnhanced.count({
      where: { status: ['in_progress', 'planning', 'approved'] }
    });
    const completedProjects = await ProjectEnhanced.count({
      where: { status: 'completed' }
    });
    const pendingQuotes = await ProjectEnhanced.count({
      where: { status: 'quoted' }
    });

    // Get revenue statistics
    const totalRevenue = await ProjectEnhanced.sum('quotedAmount', {
      where: { status: 'completed' }
    }) || 0;

    const pendingRevenue = await ProjectEnhanced.sum('quotedAmount', {
      where: { status: ['approved', 'in_progress'] }
    }) || 0;

    const potentialRevenue = await ProjectEnhanced.sum('quotedAmount', {
      where: { status: 'quoted' }
    }) || 0;

    // Get project distribution by type
    const projectsByType = await ProjectEnhanced.findAll({
      attributes: [
        'type',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('quotedAmount')), 'revenue']
      ],
      group: ['type'],
      raw: true
    });

    // Get project distribution by status
    const projectsByStatus = await ProjectEnhanced.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('quotedAmount')), 'revenue']
      ],
      group: ['status'],
      raw: true
    });

    // Get recent activities
    const recentActivities = await ProjectActivity.findAll({
      include: [
        {
          model: UserEnhanced,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: ProjectEnhanced,
          as: 'project',
          attributes: ['id', 'projectNumber', 'title']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get top performing users
    const topUsers = await UserEnhanced.findAll({
      attributes: [
        'id',
        'firstName', 
        'lastName',
        'email',
        'role',
        'projectsAssigned',
        'projectsCompleted',
        'totalRevenue'
      ],
      where: {
        role: ['project_manager', 'office_manager', 'team_leader']
      },
      order: [['totalRevenue', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          activeProjects,
          completedProjects,
          pendingQuotes,
          totalRevenue,
          pendingRevenue,
          potentialRevenue,
          completionRate: totalProjects > 0 ? (completedProjects / totalProjects * 100).toFixed(1) : 0
        },
        projectsByType,
        projectsByStatus,
        recentActivities,
        topUsers
      }
    });

    logger.info(`📊 Dashboard analytics retrieved for user: ${req.user?.email}`);
  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Revenue analytics over time
router.get('/revenue', requirePermission('access_financials'), async (req: Request, res: Response) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;

    let dateFormat: string;
    let groupBy: string;

    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        groupBy = 'DATE(createdAt)';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        groupBy = 'YEARWEEK(createdAt)';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        groupBy = 'DATE_FORMAT(createdAt, "%Y-%m")';
        break;
      case 'quarter':
        dateFormat = '%Y-Q%q';
        groupBy = 'CONCAT(YEAR(createdAt), "-Q", QUARTER(createdAt))';
        break;
      default:
        dateFormat = '%Y-%m';
        groupBy = 'DATE_FORMAT(createdAt, "%Y-%m")';
    }

    const revenueData = await ProjectEnhanced.findAll({
      attributes: [
        [literal(groupBy), 'period'],
        [fn('COUNT', col('id')), 'projectCount'],
        [fn('SUM', col('quotedAmount')), 'revenue'],
        [fn('AVG', col('quotedAmount')), 'averageValue']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(`${year}-01-01`),
          [Op.lt]: new Date(`${Number(year) + 1}-01-01`)
        },
        status: {
          [Op.in]: ['completed', 'in_progress', 'approved']
        }
      },
      group: [literal(groupBy) as any],
      order: [[literal(groupBy), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        period,
        year,
        revenueData
      }
    });

    logger.info(`📊 Revenue analytics retrieved for period: ${period}, year: ${year}`);
  } catch (error) {
    logger.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue analytics',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// User performance analytics
router.get('/users/:id/performance', requirePermission('view_all_data'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period = 'month', limit = 12 } = req.query;

    const user = await UserEnhanced.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `No user found with ID: ${id}`
      });
    }

    // Get user's assigned projects
    const assignedProjects = await ProjectEnhanced.findAll({
      where: {
        [Op.or]: [
          { assignedProjectManager: id },
          { assignedSalesRep: id },
          { assignedTeamLeader: id }
        ]
      },
      include: [{
        model: ProjectActivity,
        as: 'activities',
        where: { userId: id },
        required: false
      }]
    });

    // Performance metrics
    const totalAssigned = assignedProjects.length;
    const completed = assignedProjects.filter(p => p.status === 'completed').length;
    const inProgress = assignedProjects.filter(p => p.status === 'in_progress').length;
    const totalRevenue = assignedProjects
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.quotedAmount || 0), 0);

    // Activity over time
    const activityData = await ProjectActivity.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'month'],
        [fn('COUNT', col('id')), 'activityCount']
      ],
      where: { userId: id },
      group: [fn('DATE_FORMAT', col('createdAt'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'DESC']],
      limit: Number(limit),
      raw: true
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role
        },
        performance: {
          totalAssigned,
          completed,
          inProgress,
          completionRate: totalAssigned > 0 ? (completed / totalAssigned * 100).toFixed(1) : 0,
          totalRevenue,
          averageProjectValue: totalAssigned > 0 ? (totalRevenue / totalAssigned).toFixed(2) : 0
        },
        activityData
      }
    });

    logger.info(`📊 User performance analytics retrieved for user ID: ${id}`);
  } catch (error) {
    logger.error('Error fetching user performance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user performance analytics',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Project analytics
router.get('/projects/insights', requirePermission('view_all_data'), async (req: Request, res: Response) => {
  try {
    // Average project duration
    const completedProjects = await ProjectEnhanced.findAll({
      where: { 
        status: 'completed',
        startDate: { [Op.ne]: null as any },
        estimatedCompletionDate: { [Op.ne]: null as any }
      } as any,
      attributes: ['startDate', 'estimatedCompletionDate', 'quotedAmount', 'type']
    });

    const projectInsights = {
      averageDuration: 0,
      averageValue: 0,
      typeBreakdown: {} as Record<string, any>,
      seasonalTrends: {} as Record<string, number>
    };

    if (completedProjects.length > 0) {
      // Calculate average duration
      const totalDuration = completedProjects.reduce((sum, project) => {
        if (project.startDate && project.estimatedCompletionDate) {
          const duration = new Date(project.estimatedCompletionDate).getTime() - new Date(project.startDate).getTime();
          return sum + (duration / (1000 * 60 * 60 * 24)); // Convert to days
        }
        return sum;
      }, 0);
      projectInsights.averageDuration = Math.round(totalDuration / completedProjects.length);

      // Calculate average value
      const totalValue = completedProjects.reduce((sum, p) => sum + (p.quotedAmount || 0), 0);
      projectInsights.averageValue = totalValue / completedProjects.length;

      // Type breakdown
      const typeBreakdown = completedProjects.reduce((acc, project) => {
        const type = project.type || 'unknown';
        if (!acc[type]) {
          acc[type] = { count: 0, totalValue: 0 };
        }
        acc[type].count++;
        acc[type].totalValue += project.quotedAmount || 0;
        return acc;
      }, {} as Record<string, any>);

      projectInsights.typeBreakdown = typeBreakdown;
    }

    // Seasonal trends (projects created by month)
    const seasonalData = await ProjectEnhanced.findAll({
      attributes: [
        [fn('MONTH', col('createdAt')), 'month'],
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('quotedAmount')), 'revenue']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear() - 1, 0, 1)
        }
      },
      group: [fn('MONTH', col('createdAt'))],
      raw: true
    });

    projectInsights.seasonalTrends = seasonalData.reduce((acc, item: any) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      acc[monthNames[item.month - 1]] = item.count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: projectInsights
    });

    logger.info(`📊 Project insights analytics retrieved`);
  } catch (error) {
    logger.error('Error fetching project insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project insights',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Export data for reports
router.get('/export/:type', requirePermission('generate_reports'), async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { format = 'json', startDate, endDate } = req.query;

    let data: any;
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    switch (type) {
      case 'projects':
        data = await ProjectEnhanced.findAll({
          where: whereClause,
          include: [
            {
              model: UserEnhanced,
              as: 'projectManager',
              attributes: ['firstName', 'lastName', 'email']
            },
            {
              model: UserEnhanced,
              as: 'salesRep',
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        });
        break;

      case 'users':
        data = await UserEnhanced.findAll({
          where: whereClause,
          attributes: { exclude: ['passwordHash'] }
        });
        break;

      case 'activities':
        data = await ProjectActivity.findAll({
          where: whereClause,
          include: [
            {
              model: UserEnhanced,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email']
            },
            {
              model: ProjectEnhanced,
              as: 'project',
              attributes: ['projectNumber', 'title']
            }
          ]
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid export type',
          message: 'Supported types: projects, users, activities'
        });
    }

    if (format === 'csv') {
      // For now, return JSON. In a real implementation, convert to CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export.json"`);
    }

    res.json({
      success: true,
      exportType: type,
      format,
      recordCount: data.length,
      data
    });

    logger.info(`📊 Data export completed: ${type} (${data.length} records) for user: ${req.user?.email}`);
  } catch (error) {
    logger.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
