import React, { useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { NotificationData } from '../../services/websocketService';

interface RealTimeNotificationsProps {
  maxNotifications?: number;
  autoHideDuration?: number;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  maxNotifications = 5,
  autoHideDuration = 6000,
}) => {
  const {
    notifications,
    clearNotifications,
    markNotificationRead,
    isConnected,
  } = useWebSocket();

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [currentNotification, setCurrentNotification] = React.useState<NotificationData | null>(null);

  // Show snackbar for new notifications
  useEffect(() => {
    if (notifications.length > 0 && !snackbarOpen) {
      const latestNotification = notifications[0];
      setCurrentNotification(latestNotification);
      setSnackbarOpen(true);
    }
  }, [notifications, snackbarOpen]);

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
    setCurrentNotification(null);
  };

  // Handle notification click (mark as read)
  const handleNotificationClick = (index: number) => {
    markNotificationRead(index);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      {/* Connection Status Indicator */}
      <Box
        sx={{
          position: 'fixed',
          top: 80,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Chip
          icon={<NotificationsIcon />}
          label={isConnected ? 'Live' : 'Offline'}
          color={isConnected ? 'success' : 'error'}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Real-time Notifications Panel */}
      {notifications.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            top: 120,
            right: 16,
            width: 350,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1000,
            borderRadius: 2,
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={notifications.length} color="primary">
                  <NotificationsIcon />
                </Badge>
                Notifications
              </Typography>
              <IconButton size="small" onClick={clearNotifications}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <List sx={{ py: 0 }}>
            {notifications.slice(0, maxNotifications).map((notification, index) => (
              <React.Fragment key={`${notification.timestamp}-${index}`}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(index)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {getNotificationIcon(notification.type)}
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {notification.title}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleNotificationClick(index)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          {notifications.length > maxNotifications && (
            <Box sx={{ p: 1, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                +{notifications.length - maxNotifications} more notifications
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Snackbar for individual notifications */}
      {currentNotification && (
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={autoHideDuration}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 8 }} // Account for the fixed notification panel
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={getNotificationColor(currentNotification.type) as 'success' | 'warning' | 'error' | 'info'}
            variant="filled"
            sx={{ width: '100%' }}
          >
            <AlertTitle>{currentNotification.title}</AlertTitle>
            {currentNotification.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default RealTimeNotifications;