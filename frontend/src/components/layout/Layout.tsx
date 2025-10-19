import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import OfflineIndicator from '../offline/OfflineIndicator';
import MiniSidebar from '../navigation/MiniSidebar';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <OfflineIndicator />
      
      {/* Simplified App Bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        role="banner"
        aria-label="Application top bar"
      >
        <Toolbar>
          {/* Logo */}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <img 
              src="/logo-full.png" 
              alt="Bal-Con Builders" 
              style={{ 
                height: '48px',
                width: 'auto',
                maxWidth: '220px',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)' // Convert logo to white for blue AppBar
              }}
              onError={(e) => {
                // Fallback to text if image fails to load
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              sx={{ display: 'none' }} // Hidden unless image fails
            >
              Bal-Con Builders
            </Typography>
          </Box>

          {/* Notifications */}
          <IconButton 
            color="inherit" 
            aria-label="View notifications"
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Profile Menu */}
          <IconButton
            edge="end"
            aria-label="Account options"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content Area with MiniSidebar */}
      <Box sx={{ display: 'flex', flexGrow: 1, pt: 8 }}>
        {/* Mini Sidebar */}
        <MiniSidebar />

        {/* Content Area - Full Width */}
        <Box
          component="main"
          id="main-content"
          role="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: '100%',
            minHeight: 'calc(100vh - 64px)',
            overflowX: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
