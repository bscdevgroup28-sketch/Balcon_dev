import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Divider,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Fade,
  useTheme,
  alpha,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  BusinessCenter,
  AdminPanelSettings,
  Assignment,
  Group,
  HandymanOutlined,
  Person,
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, setUser } from '../../store/slices/authSlice';
import { RootState } from '../../store/store';
import { UserRole } from '../../types/auth';
import { authAPI } from '../../services/api';
import { loginSchema, LoginFormData } from '../../validation/loginSchema';

interface DemoAccount {
  role: UserRole;
  title: string;
  email: string;
  password: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  features: string[];
}

const demoAccounts: DemoAccount[] = [
  {
    role: 'user',
    title: 'Customer Demo',
    email: 'customer@demo.com',
    password: 'demo123',
    description: 'Experience the customer portal - request projects, view quotes, track progress',
    icon: <Person />,
    color: '#2196f3',
    features: ['Project Requests', 'Quote Management', 'Progress Tracking', 'Communication']
  },
  {
    role: 'admin',
    title: 'Admin Demo',
    email: 'admin@demo.com',
    password: 'demo123',
    description: 'Full administrative access - manage users, oversee all projects and analytics',
    icon: <AdminPanelSettings />,
    color: '#f44336',
    features: ['User Management', 'System Analytics', 'All Projects', 'Company Settings']
  },
  {
    role: 'office_manager',
    title: 'Office Manager Demo',
    email: 'office@demo.com',
    password: 'demo123',
    description: 'Office management - customer relations, scheduling, administrative oversight',
    icon: <BusinessCenter />,
    color: '#4caf50',
    features: ['Customer Relations', 'Scheduling', 'Admin Tasks', 'Communication']
  },
  {
    role: 'project_manager',
    title: 'Project Manager Demo',
    email: 'pm@demo.com',
    password: 'demo123',
    description: 'Project coordination - timeline management, resource allocation, team oversight',
    icon: <Assignment />,
    color: '#ff9800',
    features: ['Project Planning', 'Resource Management', 'Team Coordination', 'Progress Reports']
  },
  {
    role: 'team_leader',
    title: 'Team Leader Demo',
    email: 'leader@demo.com',
    password: 'demo123',
    description: 'Field operations - team management, task assignment, daily operations',
    icon: <Group />,
    color: '#9c27b0',
    features: ['Team Management', 'Task Assignment', 'Field Operations', 'Daily Reports']
  },
  {
    role: 'technician',
    title: 'Technician Demo',
    email: 'tech@demo.com',
    password: 'demo123',
    description: 'Field worker view - task completion, time tracking, material requests',
    icon: <HandymanOutlined />,
    color: '#607d8b',
    features: ['Task Management', 'Time Tracking', 'Material Requests', 'Work Reports']
  }
];

const Login: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isLoading, error, user } = useSelector((state: RootState) => state.auth);

  // React Hook Form setup with Yup validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onChange', // Validate on change for real-time feedback
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [forgotMessage, setForgotMessage] = useState<string>('');

  const from = location.state?.from?.pathname || '/dashboard';

  // Watch email for forgot password functionality
  const watchedEmail = watch('email');

  const performLogin = async (creds: { email: string; password: string }) => {
    try {
      const result = await dispatch(loginUser(creds) as any);
      if (result.type === 'auth/login/fulfilled') {
        navigate(from, { replace: true });
      }
      return result.type === 'auth/login/fulfilled';
    } catch {
      return false;
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    await performLogin(data);
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    try {
      // Create a demo user object that matches the User interface
      const demoUser = {
        id: Math.floor(Math.random() * 10000), // Generate a demo ID
        email: account.email,
        firstName: account.title.split(' ')[0],
        lastName: account.title.split(' ')[1] || 'Demo',
        role: account.role,
        permissions: ['read', 'write'], // Basic permissions for demo
        isDemo: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set the demo user in the store
      dispatch(setUser(demoUser));
      
      // Navigate to appropriate dashboard based on role
      let dashboardRoute = '/dashboard';
      if (account.role === 'admin') {
        dashboardRoute = '/dashboard/admin';
      } else if (account.role !== 'user') {
        dashboardRoute = `/dashboard/${account.role}`;
      }
      
      navigate(dashboardRoute, { replace: true });
    } catch (error) {
      // Demo login error handling
    }
  };

  // Auto-authenticate support: if URL contains autoLogin=1 and creds or a demo alias, attempt once.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (user) return; // already logged in
    if (!params.get('autoLogin')) return;
    const emailParam = params.get('email');
    const passwordParam = params.get('password');
    const demoRole = params.get('demo');
    // Prevent repeat loops
    if (sessionStorage.getItem('autoLoginAttempted')) return;
    sessionStorage.setItem('autoLoginAttempted', '1');
    if (emailParam && passwordParam) {
      performLogin({ email: emailParam, password: passwordParam });
      return;
    }
    if (demoRole) {
      const acct = demoAccounts.find(a => a.role === demoRole);
      if (acct) handleDemoLogin(acct);
    }
    // We intentionally exclude performLogin/handleDemoLogin from deps to avoid re-attempt loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, user]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Company Header */}
          <Box textAlign="center" mb={4}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 1,
              }}
            >
              🏗️ Bal-Con Builders
            </Typography>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Professional Construction Management Platform
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Streamline your construction projects with our comprehensive management system.
              From initial customer inquiry to project completion.
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ maxWidth: 1200 }}>
            {/* Login Form */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  height: 'fit-content',
                  background: alpha(theme.palette.background.paper, 0.9),
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box textAlign="center" mb={3}>
                  <Avatar 
                    sx={{ 
                      mx: 'auto', 
                      mb: 2, 
                      bgcolor: theme.palette.primary.main,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <LoginIcon />
                  </Avatar>
                  <Typography component="h2" variant="h5" gutterBottom>
                    Sign In
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Access your construction management dashboard
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
                  <TextField
                    {...register('email')}
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                    error={!!errors.email}
                    helperText={errors.email?.message || ' '}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    {...register('password')}
                    margin="normal"
                    required
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    error={!!errors.password}
                    helperText={errors.password?.message || 'Minimum 8 characters'}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 1 }}
                  />

                  {/* Password Requirements Info */}
                  <Alert severity="info" sx={{ mb: 3, py: 0.5 }}>
                    <Typography variant="caption" component="div">
                      Password requirements:
                      <Box component="ul" sx={{ margin: '4px 0', paddingLeft: '20px', fontSize: '0.75rem' }}>
                        <li>At least 8 characters</li>
                        <li>Include uppercase and lowercase letters (recommended)</li>
                        <li>Include at least one number (recommended)</li>
                      </Box>
                    </Typography>
                  </Alert>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading || !isValid || !isDirty}
                    sx={{ 
                      mb: 2,
                      py: 1.5,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    }}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
                  </Button>

                  <Box textAlign="center">
                    <Link component={RouterLink} to="/register" variant="body2" sx={{ mr: 2 }}>
                      Don't have an account? Sign Up
                    </Link>
                    <Link component="button" type="button" variant="body2" onClick={() => { setForgotOpen(true); setForgotEmail(watchedEmail); }}>
                      Forgot Password?
                    </Link>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }}>
                  <Chip label="OR" />
                </Divider>

                <Typography variant="h6" textAlign="center" gutterBottom>
                  🎯 Try Demo Accounts
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                  Experience different user roles and features
                </Typography>
              </Paper>
            </Grid>

            {/* Demo Accounts */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom textAlign="center" sx={{ mb: 3 }}>
                🚀 Explore User Dashboards
              </Typography>
              
              <Grid container spacing={2}>
                {demoAccounts.map((account, index) => (
                  <Grid item xs={12} sm={6} key={account.role}>
                    <Fade in={true} timeout={600 + index * 100}>
                      <Card
                        sx={{
                          height: '100%',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[8],
                          },
                          border: `1px solid ${alpha(account.color, 0.2)}`,
                        }}
                        onClick={() => handleDemoLogin(account)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Avatar
                              sx={{
                                bgcolor: account.color,
                                mr: 1,
                                width: 32,
                                height: 32,
                              }}
                            >
                              {React.cloneElement(account.icon, { fontSize: 'small' })}
                            </Avatar>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {account.title}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                            {account.description}
                          </Typography>
                          
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {account.features.slice(0, 2).map((feature) => (
                              <Chip 
                                key={feature}
                                label={feature}
                                size="small"
                                sx={{ 
                                  fontSize: '0.65rem',
                                  bgcolor: alpha(account.color, 0.1),
                                  color: account.color,
                                }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Fade>
                  </Grid>
                ))}
              </Grid>

              <Box textAlign="center" mt={3}>
                <Typography variant="body2" color="text.secondary">
                  💡 Click any demo account to explore that role's dashboard
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Features Overview */}
          <Box mt={6} textAlign="center">
            <Typography variant="h6" gutterBottom>
              🚀 Platform Features
            </Typography>
            <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 800 }}>
              {[
                'Project Management', 'Quote Generation', 'Real-time Updates',
                'User Management', 'Mobile PWA', 'Analytics Dashboard'
              ].map((feature) => (
                <Grid item key={feature}>
                  <Chip 
                    label={feature} 
                    variant="outlined"
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Forgot Password Dialog */}
          <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Reset your password</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your account email. If it exists, we'll send a password reset link.
              </Typography>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={forgotEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForgotEmail(e.target.value)}
                autoFocus
                error={forgotEmail.length > 0 && !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(forgotEmail)}
                helperText={forgotEmail.length > 0 && !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(forgotEmail) ? 'Enter a valid email' : ' '}
              />
              {forgotStatus === 'success' && (
                <Alert severity="success" sx={{ mt: 2 }}>{forgotMessage || 'If the email exists, a reset link has been sent.'}</Alert>
              )}
              {forgotStatus === 'error' && (
                <Alert severity="error" sx={{ mt: 2 }}>{forgotMessage || 'Something went wrong. Please try again later.'}</Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setForgotOpen(false)} disabled={forgotStatus === 'loading'}>Close</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    setForgotStatus('loading');
                    setForgotMessage('');
                    await authAPI.requestPasswordReset(forgotEmail);
                    setForgotStatus('success');
                    setForgotMessage('If the email exists, a reset link has been sent.');
                  } catch (e: any) {
                    setForgotStatus('error');
                    setForgotMessage(e?.response?.data?.message || 'Unable to process request');
                  }
                }}
                disabled={forgotStatus === 'loading' || !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(forgotEmail)}
              >
                {forgotStatus === 'loading' ? <CircularProgress size={20} /> : 'Send reset link'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
