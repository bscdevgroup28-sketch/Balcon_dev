import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Container,
  Fade,
  Grow,
} from '@mui/material';
import {
  BusinessCenter,
  AdminPanelSettings,
  Build,
  Assignment,
  Group,
  HandymanOutlined,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { UserRole } from '../../types/auth';
import { setUser } from '../../store/slices/authSlice';

interface DemoRole {
  role: UserRole;
  title: string;
  description: string;
  responsibilities: string[];
  icon: React.ReactElement;
  color: string;
  gradient: string;
}

const demoRoles: DemoRole[] = [
  {
    role: 'owner',
    title: 'Business Owner',
    description: 'Executive dashboard with financial metrics and strategic insights',
    responsibilities: [
      'Strategic business oversight',
      'Financial performance monitoring',
      'Executive decision making',
      'Company growth planning'
    ],
    icon: <BusinessCenter />,
    color: '#1976d2',
    gradient: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
  },
  {
    role: 'office_manager',
    title: 'Office Manager',
    description: 'Customer relations, scheduling, and administrative oversight',
    responsibilities: [
      'Customer relationship management',
      'Administrative coordination',
      'Scheduling and appointments',
      'Communication management'
    ],
    icon: <AdminPanelSettings />,
    color: '#9c27b0',
    gradient: 'linear-gradient(135deg, #9c27b0 0%, #8e24aa 100%)'
  },
  {
    role: 'shop_manager',
    title: 'Shop Manager',
    description: 'Production management, inventory control, and quality assurance',
    responsibilities: [
      'Production oversight',
      'Inventory management',
      'Quality control',
      'Workforce coordination'
    ],
    icon: <Build />,
    color: '#ff9800',
    gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
  },
  {
    role: 'project_manager',
    title: 'Project Manager',
    description: 'Project coordination, timeline management, and resource allocation',
    responsibilities: [
      'Project coordination',
      'Timeline management',
      'Resource allocation',
      'Client communication'
    ],
    icon: <Assignment />,
    color: '#4caf50',
    gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
  },
  {
    role: 'team_leader',
    title: 'Team Leader',
    description: 'Team coordination, task assignment, and field operations',
    responsibilities: [
      'Team management',
      'Task coordination',
      'Field operations',
      'Performance tracking'
    ],
    icon: <Group />,
    color: '#f44336',
    gradient: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
  },
  {
    role: 'technician',
    title: 'Technician',
    description: 'Field work, task execution, and progress documentation',
    responsibilities: [
      'Task execution',
      'Field documentation',
      'Progress reporting',
      'Quality implementation'
    ],
    icon: <HandymanOutlined />,
    color: '#607d8b',
    gradient: 'linear-gradient(135deg, #607d8b 0%, #455a64 100%)'
  }
];

export const DemoAccountSelector: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleDemoLogin = async (role: UserRole) => {
    try {
      // Create demo user object
      const demoUser = {
        id: Math.floor(Math.random() * 1000),
        email: `demo.${role}@balconbuilders.com`,
        firstName: getDemoFirstName(role),
        lastName: 'Demo',
        role: role,
        permissions: getDemoPermissions(role),
        isDemo: true,
        demoExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set demo user in auth state
      dispatch(setUser(demoUser));

      // Navigate to role-specific dashboard
      const dashboardPath = getDashboardPath(role);
      navigate(dashboardPath);
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  const getDemoFirstName = (role: UserRole): string => {
    const names = {
      owner: 'Executive',
      office_manager: 'Sarah',
      shop_manager: 'Mike',
      project_manager: 'Alex',
      team_leader: 'Jordan',
      technician: 'Chris',
      admin: 'Admin',
      user: 'User'
    };
    return names[role] || 'Demo';
  };

  const getDemoPermissions = (role: UserRole): string[] => {
    const permissions = {
      owner: ['view_all_data', 'financial_oversight', 'strategic_planning'],
      office_manager: ['customer_management', 'scheduling', 'communications'],
      shop_manager: ['production_management', 'inventory_control', 'quality_assurance'],
      project_manager: ['project_coordination', 'resource_allocation', 'timeline_management'],
      team_leader: ['team_management', 'task_coordination', 'field_operations'],
      technician: ['task_execution', 'field_documentation', 'progress_reporting'],
      admin: ['full_system_access', 'user_management', 'system_configuration'],
      user: ['basic_access', 'view_projects', 'submit_requests']
    };
    return permissions[role] || [];
  };

  const getDashboardPath = (role: UserRole): string => {
    const paths = {
      owner: '/owner',
      office_manager: '/office',
      shop_manager: '/shop',
      project_manager: '/project-manager',
      team_leader: '/team-leader',
      technician: '/technician',
      admin: '/admin',
      user: '/dashboard'
    };
    return paths[role] || '/dashboard';
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Fade in timeout={1000}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Experience Our Complete Solution
          </Typography>
        </Fade>
        
        <Fade in timeout={1500}>
          <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 6 }}>
            Select a role to explore the full functionality of our business management platform
          </Typography>
        </Fade>
        
        <Grid container spacing={3} sx={{ mt: 4 }}>
          {demoRoles.map((demo, index) => (
            <Grid item xs={12} sm={6} md={4} key={demo.role}>
              <Grow in timeout={1000 + (index * 200)}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      transform: 'translateY(-8px)',
                      boxShadow: (theme) => theme.shadows[8],
                    },
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                  onClick={() => handleDemoLogin(demo.role)}
                >
                  <Box
                    sx={{
                      background: demo.gradient,
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        width: 64, 
                        height: 64, 
                        mx: 'auto', 
                        mb: 2,
                        color: 'white',
                      }}
                    >
                      {demo.icon}
                    </Avatar>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {demo.title}
                    </Typography>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {demo.description}
                    </Typography>
                    
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Key Responsibilities:
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      {demo.responsibilities.map((responsibility, idx) => (
                        <Typography 
                          key={idx}
                          variant="caption" 
                          display="block"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          • {responsibility}
                        </Typography>
                      ))}
                    </Box>
                    
                    <Button 
                      variant="contained" 
                      endIcon={<ArrowForward />}
                      fullWidth
                      sx={{
                        background: demo.gradient,
                        '&:hover': {
                          background: demo.gradient,
                          filter: 'brightness(1.1)',
                        },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 'bold',
                      }}
                    >
                      Try {demo.title} Demo
                    </Button>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        <Fade in timeout={2000}>
          <Box sx={{ mt: 8, p: 4, backgroundColor: 'background.paper', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              💡 Demo Features
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Each demo includes realistic data, complete workflows, and cross-role interactions.
              Explore how different roles collaborate to deliver successful construction projects.
            </Typography>
          </Box>
        </Fade>
      </Box>
    </Container>
  );
};

export default DemoAccountSelector;
