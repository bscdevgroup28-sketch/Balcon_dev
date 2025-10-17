import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  FormControlLabel,
  Switch,
  Tooltip,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  ChevronLeft,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { getMenuItemsForRole, getRoleDisplayName } from '../../utils/roleUtils';
import { useLayoutDensity } from '../../theme/LayoutDensityContext';
import HealthStatus from '../system/HealthStatus';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { density, toggleDensity } = useLayoutDensity();

  const navWidth = sidebarOpen ? 240 : 0; // Hide completely when collapsed per new requirement

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

  const menuItems = getMenuItemsForRole(user?.role || 'user');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          transition: 'margin 0.3s',
        }}
        role="banner"
        aria-label="Application top bar"
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label={sidebarOpen ? 'Collapse navigation menu' : 'Expand navigation menu'}
            edge="start"
            onClick={() => dispatch(toggleSidebar())}
            sx={{ 
              mr: 2,
              minWidth: { xs: 48, sm: 40 },
              minHeight: { xs: 48, sm: 40 },
            }}
          >
            {sidebarOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Bal-Con Builders
          </Typography>

          {/* Mobile: Show role in smaller text */}
          <Typography
            variant="body2"
            sx={{
              mr: 2,
              opacity: 0.8,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {user ? getRoleDisplayName(user.role) : 'Guest'}
          </Typography>

          <HealthStatus />
          <FormControlLabel
            sx={{ mr: 1, color: 'inherit' }}
            control={<Switch size="small" checked={density === 'compact'} onChange={toggleDensity} color="default" />}
            label={density === 'compact' ? 'Compact' : 'Comfortable'}
          />

          <IconButton color="inherit" sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 44, minHeight: 44 }} aria-label="View notifications">
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton
            edge="end"
            aria-label="Account options"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Region with Inline Nav */}
      <Box sx={{ display: 'flex', flexGrow: 1, pt: 8, minHeight: 0 }}>
        {/* Inline navigation occupying previously empty left space */}
        <Collapse in={sidebarOpen || isMobile} orientation="horizontal" unmountOnExit={!isMobile} collapsedSize={0} timeout={300}>
          <Box
            component="nav"
            aria-label="Primary navigation"
            sx={{
              width: navWidth,
              transition: 'width .3s',
              borderRight: 1,
              borderColor: 'divider',
              overflowY: 'auto',
              height: 'calc(100vh - 64px)',
              backgroundColor: 'background.paper',
              display: sidebarOpen ? 'block' : (isMobile ? 'block' : 'none')
            }}
          >
            <Box sx={{ px: 2, py: 2, display: sidebarOpen ? 'block' : 'none' }}>
              <Typography variant="subtitle1" fontWeight={600}>BC Builders</Typography>
            </Box>
            <Divider sx={{ display: sidebarOpen ? 'block' : 'none' }} />
            <List role="list" aria-label="Primary navigation menu" sx={{ py: 0 }}>
              {menuItems.map(item => {
                const IconComponent = item.icon;
                const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                const node = (
                  <ListItem
                    key={item.text}
                    button
                    onClick={() => navigate(item.path)}
                    selected={active}
                    aria-current={active ? 'page' : undefined}
                    sx={{
                      minHeight: 46,
                      px: sidebarOpen ? 2 : 1.2,
                      '&.Mui-selected': { backgroundColor: 'action.selected', fontWeight: 600 },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                      <IconComponent />
                    </ListItemIcon>
                    {sidebarOpen && <ListItemText primary={item.text} />}
                  </ListItem>
                );
                if (!sidebarOpen) {
                  return (
                    <Tooltip key={item.text} title={item.text} placement="right" arrow>
                      <Box>{node}</Box>
                    </Tooltip>
                  );
                }
                return node;
              })}
            </List>
          </Box>
        </Collapse>

        {/* Content Area */}
        <Box
          component="main"
          id="main-content"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            px: { xs: 1, sm: 3 },
            pb: { xs: 2, sm: 4 },
            transition: 'padding .3s',
            width: '100%',
            overflowX: 'hidden'
          }}
        >
          <Box sx={{ width: '100%', overflowX: 'auto' }}>{children}</Box>
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box
        component="main"
        id="main-content"
        sx={{
          flexGrow: 1,
          width: '100%',
    // removed legacy drawer margin; inline nav now handled in flex layout
          transition: 'margin 0.3s',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar />
        {/* Centering container to create balanced left/right gutters independent of drawer width */}
        <Box sx={{
          width: '100%',
          maxWidth: 1600,
          mx: 'auto',
          px: { xs: 1, sm: 3 },
          pb: { xs: 2, sm: 4 },
          boxSizing: 'border-box'
        }}>
          {/* Content wrapper ensures overflowing dashboards can scroll horizontally without affecting outer centering */}
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
