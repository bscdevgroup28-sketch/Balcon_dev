import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  useMediaQuery,
  Tooltip,
  Button,
  Avatar,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const DRAWER_WIDTH = 240;
const MINI_DRAWER_WIDTH = 64;

interface LayoutNewProps {
  children: React.ReactNode;
}

const LayoutNew: React.FC<LayoutNewProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [pinned, setPinned] = React.useState<boolean>(() => {
    try {
      const v = localStorage.getItem('layout.sidebarPinned');
      return v ? v === '1' : true;
    } catch {
      return true;
    }
  });
  const [hovered, setHovered] = React.useState(false);
  const expanded = pinned || hovered;
  const width = isMobile ? DRAWER_WIDTH : (expanded ? DRAWER_WIDTH : MINI_DRAWER_WIDTH);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s: RootState) => s.auth);

  const menu = [
    { text: 'Home', icon: HomeIcon, path: '/home' },
  ];

  React.useEffect(() => {
    try { localStorage.setItem('layout.sidebarPinned', pinned ? '1' : '0'); } catch { /* ignore */ }
  }, [pinned]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          {isMobile && (
            <IconButton color="inherit" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ mr: 2, whiteSpace: 'nowrap' }}>Bal-Con Builders</Typography>

          {/* Global Search */}
          <TextField
            placeholder="Search projects, quotes, customers..."
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'inherit' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: 560,
              flexGrow: 1,
              '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.08)' },
              display: { xs: 'none', sm: 'flex' },
            }}
          />

          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" aria-label="Notifications">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton color="inherit" aria-label="Settings" onClick={() => navigate('/settings')}>
            <SettingsIcon />
          </IconButton>
          <Button color="inherit" startIcon={<Avatar sx={{ width: 28, height: 28 }}>{user?.firstName?.[0] || 'U'}</Avatar>}>
            {user?.firstName || 'User'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        onMouseEnter={() => !isMobile && setHovered(true)}
        onMouseLeave={() => !isMobile && setHovered(false)}
        sx={{
          width,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: theme.transitions.create('width'),
          },
        }}
      >
        <Toolbar />
        {!isMobile && (
          <Box sx={{ display: 'flex', justifyContent: expanded ? 'flex-end' : 'center', px: 1, py: 0.5 }}>
            <Tooltip title={pinned ? 'Unpin sidebar' : 'Pin sidebar'}>
              <IconButton size="small" onClick={() => setPinned(!pinned)} aria-label="Toggle pin">
                {pinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {!isMobile && expanded && <Divider sx={{ mb: 1 }} />}
        <List sx={{ px: 1 }}>
          {menu.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <ListItem
                key={item.text}
                button
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                selected={active}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  minHeight: 48,
                  justifyContent: expanded ? 'initial' : 'center',
                  px: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 2 : 'auto', justifyContent: 'center' }}>
                  <Icon />
                </ListItemIcon>
                {expanded ? <ListItemText primary={item.text} /> : <Tooltip title={item.text}><Box /></Tooltip>}
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: { md: `${width}px` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default LayoutNew;
