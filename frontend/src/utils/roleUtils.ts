import React from 'react';
import { UserRole } from '../types/auth';
import {
  Dashboard,
  AttachMoney,
  TrendingUp,
  Assessment,
  People,
  Schedule,
  Message,
  Build,
  Assignment,
  BusinessCenter,
  Engineering,
  Group,
  Task,
  HandymanOutlined,
  CameraAlt,
  Chat,
  AdminPanelSettings,
  Settings,
  ShoppingCart,
  RequestQuote,
} from '@mui/icons-material';

export interface MenuItem {
  text: string;
  icon: React.ComponentType;
  path: string;
  roles: UserRole[];
  badge?: number;
}

export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    owner: 'Business Owner',
    office_manager: 'Office Manager',
    shop_manager: 'Shop Manager',
    project_manager: 'Project Manager',
    team_leader: 'Team Leader',
    technician: 'Technician',
    admin: 'Administrator',
    user: 'Customer',
  };
  return roleNames[role];
};

export const getDashboardPath = (role: UserRole): string => {
  const dashboardPaths: Record<UserRole, string> = {
    owner: '/owner',
    office_manager: '/office',
    shop_manager: '/shop',
    project_manager: '/project-manager',
    team_leader: '/team-leader',
    technician: '/technician',
    admin: '/admin',
    user: '/dashboard',
  };
  return dashboardPaths[role];
};

export const getMenuItemsForRole = (role: UserRole): MenuItem[] => {
  const allMenuItems: MenuItem[] = [
    // Owner Menu Items
    {
      text: 'Executive Dashboard',
      icon: Dashboard,
      path: '/owner',
      roles: ['owner'],
    },
    {
      text: 'Financial Overview',
      icon: AttachMoney,
      path: '/owner/financial',
      roles: ['owner'],
    },
    {
      text: 'Strategic Metrics',
      icon: TrendingUp,
      path: '/owner/strategy',
      roles: ['owner'],
    },
    {
      text: 'Executive Reports',
      icon: Assessment,
      path: '/owner/reports',
      roles: ['owner'],
    },

    // Office Manager Menu Items
    {
      text: 'Office Dashboard',
      icon: AdminPanelSettings,
      path: '/office',
      roles: ['office_manager'],
    },
    {
      text: 'Customer Management',
      icon: People,
      path: '/office/customers',
      roles: ['office_manager'],
    },
    {
      text: 'Scheduling',
      icon: Schedule,
      path: '/office/schedule',
      roles: ['office_manager'],
    },
    {
      text: 'Communications',
      icon: Message,
      path: '/office/communications',
      roles: ['office_manager'],
    },

    // Shop Manager Menu Items
    {
      text: 'Shop Dashboard',
      icon: Build,
      path: '/shop',
      roles: ['shop_manager'],
    },
    {
      text: 'Production Management',
      icon: Engineering,
      path: '/shop/production',
      roles: ['shop_manager'],
    },
    {
      text: 'Inventory Control',
      icon: BusinessCenter,
      path: '/shop/inventory',
      roles: ['shop_manager'],
    },
    {
      text: 'Quality Control',
      icon: Assignment,
      path: '/shop/quality',
      roles: ['shop_manager'],
    },

    // Project Manager Menu Items
    {
      text: 'Project Dashboard',
      icon: Assignment,
      path: '/project-manager',
      roles: ['project_manager'],
    },
    {
      text: 'Project Portfolio',
      icon: BusinessCenter,
      path: '/project-manager/portfolio',
      roles: ['project_manager'],
    },
    {
      text: 'Timeline Management',
      icon: Schedule,
      path: '/project-manager/timeline',
      roles: ['project_manager'],
    },
    {
      text: 'Resource Planning',
      icon: Group,
      path: '/project-manager/resources',
      roles: ['project_manager'],
    },

    // Team Leader Menu Items
    {
      text: 'Team Dashboard',
      icon: Group,
      path: '/team-leader',
      roles: ['team_leader'],
    },
    {
      text: 'Team Management',
      icon: People,
      path: '/team-leader/team',
      roles: ['team_leader'],
    },
    {
      text: 'Task Coordination',
      icon: Task,
      path: '/team-leader/tasks',
      roles: ['team_leader'],
    },
    {
      text: 'Field Operations',
      icon: HandymanOutlined,
      path: '/team-leader/field',
      roles: ['team_leader'],
    },

    // Technician Menu Items
    {
      text: 'My Dashboard',
      icon: HandymanOutlined,
      path: '/technician',
      roles: ['technician'],
    },
    {
      text: 'My Tasks',
      icon: Task,
      path: '/technician/tasks',
      roles: ['technician'],
    },
    {
      text: 'Field Documentation',
      icon: CameraAlt,
      path: '/technician/documentation',
      roles: ['technician'],
    },
    {
      text: 'Team Chat',
      icon: Chat,
      path: '/technician/chat',
      roles: ['technician'],
    },

    // Shared Menu Items (visible to multiple roles)
    {
      text: 'Projects',
      icon: Assignment,
      path: '/projects',
      roles: ['admin', 'user', 'office_manager', 'project_manager', 'team_leader'],
    },
    {
      text: 'Quotes',
      icon: RequestQuote,
      path: '/quotes',
      roles: ['admin', 'user', 'office_manager', 'project_manager'],
    },
    {
      text: 'Orders',
      icon: ShoppingCart,
      path: '/orders',
      roles: ['admin', 'user', 'office_manager', 'shop_manager'],
    },
    {
      text: 'Materials',
      icon: Build,
      path: '/materials',
      roles: ['admin', 'user', 'shop_manager', 'project_manager'],
    },

    // Admin Menu Items
    {
      text: 'Admin Dashboard',
      icon: Dashboard,
      path: '/admin',
      roles: ['admin'],
    },
    {
      text: 'User Management',
      icon: People,
      path: '/admin/users',
      roles: ['admin'],
    },
    {
      text: 'System Settings',
      icon: Settings,
      path: '/admin/settings',
      roles: ['admin'],
    },
    {
      text: 'Webhooks',
      icon: Assessment,
      path: '/admin/webhooks',
      roles: ['admin'],
    },

    // Customer Menu Items
    {
      text: 'Dashboard',
      icon: Dashboard,
      path: '/dashboard',
      roles: ['user'],
    },
  ];

  return allMenuItems.filter(item => item.roles.includes(role));
};

export const getUserPermissions = (role: UserRole): string[] => {
  const rolePermissions: Record<UserRole, string[]> = {
    owner: [
      'view_all_projects',
      'view_financial_data',
      'approve_contracts',
      'view_strategic_metrics',
      'manage_company_settings',
      'view_all_reports',
    ],
    office_manager: [
      'manage_customers',
      'view_projects',
      'manage_scheduling',
      'send_communications',
      'view_quotes',
      'manage_inquiries',
    ],
    shop_manager: [
      'manage_production',
      'view_inventory',
      'manage_quality_control',
      'view_shop_projects',
      'manage_workforce',
      'view_materials',
    ],
    project_manager: [
      'manage_projects',
      'view_timelines',
      'assign_resources',
      'view_project_reports',
      'manage_project_team',
      'approve_changes',
    ],
    team_leader: [
      'manage_team',
      'assign_tasks',
      'view_team_projects',
      'manage_field_operations',
      'view_team_performance',
    ],
    technician: [
      'view_assigned_tasks',
      'update_task_status',
      'upload_documentation',
      'view_project_details',
      'communicate_with_team',
    ],
    admin: [
      'manage_users',
      'view_all_data',
      'system_administration',
      'manage_settings',
      'view_logs',
      'backup_restore',
    ],
    user: [
      'view_own_projects',
      'view_own_quotes',
      'view_own_orders',
      'update_profile',
      'communicate_with_team',
    ],
  };

  return rolePermissions[role] || [];
};
