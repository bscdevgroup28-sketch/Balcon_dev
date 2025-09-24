import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { getMenuItemsForRole, getRoleDisplayName } from '../../utils/roleUtils';
import { useLayoutDensity } from '../../theme/LayoutDensityContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { density, toggleDensity } = useLayoutDensity();

  const drawerWidth = 240;

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
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          ml: { sm: `${sidebarOpen ? drawerWidth : 0}px` },
          transition: 'width 0.3s, margin 0.3s',
        }}
        role="banner"
        aria-label="Application top bar"
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            edge="start"
            onClick={() => dispatch(toggleSidebar())}
            sx={{ mr: 2, display: { sm: sidebarOpen ? 'none' : 'block' } }}
          >
            <MenuIcon />
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

          <FormControlLabel
            sx={{ mr: 1, color: 'inherit' }}
            control={<Switch size="small" checked={density === 'compact'} onChange={toggleDensity} color="default" />}
            label={density === 'compact' ? 'Compact' : 'Comfortable'}
          />

          <IconButton color="inherit" sx={{ display: { xs: 'none', sm: 'block' } }} aria-label="View notifications">
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
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={sidebarOpen}
        onClose={() => dispatch(toggleSidebar())}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            BC Builders
          </Typography>
        </Toolbar>
        <Divider />

  <List role="list" aria-label="Primary navigation menu (mobile)">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  dispatch(toggleSidebar()); // Close drawer on mobile after navigation
                }}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>
                  <IconComponent />
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            BC Builders
          </Typography>
        </Toolbar>
        <Divider />

  <List role="list" aria-label="Primary navigation menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <ListItem
                button
                key={item.text}
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>
                  <IconComponent />
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            );
          })}
        </List>
      </Drawer>

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
          width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          ml: { sm: `${sidebarOpen ? drawerWidth : 0}px` },
          transition: 'width 0.3s, margin 0.3s',
          p: { xs: 1, sm: 3 }, // Less padding on mobile
        }}
      >
        <Toolbar />
        <Box sx={{
          maxWidth: '100%',
          overflowX: 'auto', // Allow horizontal scrolling on small screens if needed
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
