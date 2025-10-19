import { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { getMenuItemsForRole } from '../../utils/roleUtils';

const miniSidebarWidth = 64;
const expandedSidebarWidth = 240;

export const MiniSidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useSelector((state: RootState) => state.auth);

  // Get menu items based on user role
  const menuItems = getMenuItemsForRole(user?.role || 'user');

  const handleMouseEnter = () => {
    if (!isMobile) {
      setExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setExpanded(false);
    }
  };

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // On mobile, don't show the sidebar
  if (isMobile) {
    return null;
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: expanded ? expandedSidebarWidth : miniSidebarWidth,
        flexShrink: 0,
        transition: 'width 0.3s ease-in-out',
        '& .MuiDrawer-paper': {
          width: expanded ? expandedSidebarWidth : miniSidebarWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: 'width 0.3s ease-in-out',
          top: 64, // Below AppBar
          height: 'calc(100vh - 64px)',
          borderRight: 1,
          borderColor: 'divider',
        },
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'flex-start' : 'center',
          p: 2,
          minHeight: 64,
        }}
      >
        <IconButton
          onClick={handleToggle}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          size="small"
        >
          <MenuIcon />
        </IconButton>
        {expanded && (
          <Box sx={{ ml: 2, fontWeight: 600, fontSize: '0.9rem' }}>
            Navigation
          </Box>
        )}
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const active =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');

          const listItemButton = (
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={active}
              sx={{
                minHeight: 48,
                justifyContent: expanded ? 'initial' : 'center',
                px: 2.5,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: expanded ? 3 : 'auto',
                  justifyContent: 'center',
                  color: active ? 'primary.contrastText' : 'text.secondary',
                }}
              >
                <IconComponent />
              </ListItemIcon>
              {expanded && (
                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: expanded ? 1 : 0,
                    transition: 'opacity 0.3s',
                  }}
                />
              )}
            </ListItemButton>
          );

          // Wrap with Tooltip only when collapsed
          if (!expanded) {
            return (
              <Tooltip
                key={item.text}
                title={item.text}
                placement="right"
                arrow
              >
                <ListItem disablePadding>
                  {listItemButton}
                </ListItem>
              </Tooltip>
            );
          }

          return (
            <ListItem key={item.text} disablePadding>
              {listItemButton}
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default MiniSidebar;
