import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import { Home, NavigateNext } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { UserRole } from '../../types/auth';
import { getRoleDisplayName } from '../../utils/roleUtils';

interface BaseDashboardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  role: UserRole;
  breadcrumbs?: { label: string; href?: string }[];
}

export const BaseDashboard: React.FC<BaseDashboardProps> = ({
  title,
  subtitle,
  children,
  actions,
  role,
  breadcrumbs = []
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const defaultBreadcrumbs = [
    { label: 'Home', href: '/' },
    { label: getRoleDisplayName(role) }
  ];

  const allBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        separator={<NavigateNext fontSize="small" />}
        sx={{ mb: 2 }}
      >
        {allBreadcrumbs.map((crumb, index) => (
          crumb.href ? (
            <Link
              key={index}
              color="inherit"
              href={crumb.href}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {index === 0 && <Home sx={{ mr: 0.5 }} fontSize="inherit" />}
              {crumb.label}
            </Link>
          ) : (
            <Typography key={index} color="text.primary">
              {crumb.label}
            </Typography>
          )
        ))}
      </Breadcrumbs>

      {/* Dashboard Header */}
      <DashboardHeader 
        title={title} 
        subtitle={subtitle} 
        actions={actions} 
        role={role}
        user={user}
      />

      {/* Dashboard Content */}
      <DashboardContent role={role}>
        {children}
      </DashboardContent>
    </Box>
  );
};

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  role: UserRole;
  user: any;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  actions,
  role,
  user
}) => {
  const getDemoChip = () => {
    if (user?.isDemo) {
      return (
        <Chip
          label="Demo Mode"
          color="info"
          variant="outlined"
          size="small"
          sx={{ ml: 2 }}
        />
      );
    }
    return null;
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      mb: 4 
    }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {getDemoChip()}
        </Box>
        {subtitle && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          Welcome back, {user?.firstName || 'User'} • {getRoleDisplayName(role)}
        </Typography>
      </Box>
      
      {actions && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {actions}
        </Box>
      )}
    </Box>
  );
};

interface DashboardContentProps {
  children: React.ReactNode;
  role: UserRole;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  children,
  role
}) => {
  const getRoleSpecificStyles = (role: UserRole) => {
    const roleStyles = {
      owner: {
        backgroundColor: 'rgba(25, 118, 210, 0.02)',
        border: '1px solid rgba(25, 118, 210, 0.1)'
      },
      office_manager: {
        backgroundColor: 'rgba(156, 39, 176, 0.02)',
        border: '1px solid rgba(156, 39, 176, 0.1)'
      },
      shop_manager: {
        backgroundColor: 'rgba(255, 152, 0, 0.02)',
        border: '1px solid rgba(255, 152, 0, 0.1)'
      },
      project_manager: {
        backgroundColor: 'rgba(76, 175, 80, 0.02)',
        border: '1px solid rgba(76, 175, 80, 0.1)'
      },
      team_leader: {
        backgroundColor: 'rgba(244, 67, 54, 0.02)',
        border: '1px solid rgba(244, 67, 54, 0.1)'
      },
      technician: {
        backgroundColor: 'rgba(96, 125, 139, 0.02)',
        border: '1px solid rgba(96, 125, 139, 0.1)'
      },
      admin: {
        backgroundColor: 'rgba(33, 33, 33, 0.02)',
        border: '1px solid rgba(33, 33, 33, 0.1)'
      },
      user: {
        backgroundColor: 'rgba(63, 81, 181, 0.02)',
        border: '1px solid rgba(63, 81, 181, 0.1)'
      }
    };

    return roleStyles[role] || roleStyles.user;
  };

  return (
    <Paper 
      elevation={0}
      sx={{
        p: 0,
        minHeight: 'calc(100vh - 200px)',
        ...getRoleSpecificStyles(role)
      }}
    >
      {children}
    </Paper>
  );
};

export default BaseDashboard;
