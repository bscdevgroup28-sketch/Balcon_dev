import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface ErrorInfo {
  title: string;
  message: string;
  details?: string;
  errorCode?: string;
  canRetry?: boolean;
  onRetry?: () => void;
  reportable?: boolean;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showError: (error: ErrorInfo) => void;
  showSuccess: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [errorDialog, setErrorDialog] = useState<ErrorInfo | null>(null);

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 6000,
    };

    setNotifications(prev => [...prev, newNotification]);

    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showError = (error: ErrorInfo) => {
    setErrorDialog(error);
  };

  const showSuccess = (message: string, title?: string) => {
    showNotification({
      type: 'success',
      title,
      message,
    });
  };

  const showWarning = (message: string, title?: string) => {
    showNotification({
      type: 'warning',
      title,
      message,
    });
  };

  const showInfo = (message: string, title?: string) => {
    showNotification({
      type: 'info',
      title,
      message,
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleErrorReport = () => {
    // In a real app, this would send error details to your logging service
    console.log('Error reported:', errorDialog);
    showSuccess('Error report sent successfully. Thank you for helping us improve!');
    setErrorDialog(null);
  };

  const contextValue: NotificationContextType = {
    showNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Snackbars */}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          TransitionComponent={Transition}
          sx={{
            '& .MuiSnackbar-root': {
              position: 'relative',
              transform: 'none !important',
              mb: notifications.length > 1 ? 1 : 0,
            },
          }}
        >
          <Alert
            severity={notification.type}
            onClose={() => removeNotification(notification.id)}
            action={
              notification.action ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={notification.action.onClick}
                >
                  {notification.action.label}
                </Button>
              ) : undefined
            }
            sx={{ minWidth: 300 }}
          >
            {notification.title && <AlertTitle>{notification.title}</AlertTitle>}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}

      {/* Error Dialog */}
      <Dialog
        open={!!errorDialog}
        onClose={() => setErrorDialog(null)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" color="error">
              {errorDialog?.title || 'An Error Occurred'}
            </Typography>
            {errorDialog?.errorCode && (
              <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                Error Code: {errorDialog.errorCode}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography paragraph>
            {errorDialog?.message}
          </Typography>
          
          {errorDialog?.details && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Technical Details:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                {errorDialog.details}
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          {errorDialog?.reportable && (
            <Button
              onClick={handleErrorReport}
              color="primary"
              variant="outlined"
            >
              Report Issue
            </Button>
          )}
          
          {errorDialog?.canRetry && errorDialog?.onRetry && (
            <Button
              onClick={() => {
                errorDialog.onRetry?.();
                setErrorDialog(null);
              }}
              color="primary"
              variant="contained"
            >
              Try Again
            </Button>
          )}
          
          <Button
            onClick={() => setErrorDialog(null)}
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Utility functions for common error scenarios
export const errorHandlers = {
  networkError: (showError: (error: ErrorInfo) => void, retry?: () => void) => {
    showError({
      title: 'Network Connection Error',
      message: 'Unable to connect to our servers. Please check your internet connection and try again.',
      canRetry: !!retry,
      onRetry: retry,
      reportable: true,
      errorCode: 'NETWORK_ERROR'
    });
  },

  validationError: (showWarning: (message: string, title?: string) => void, message: string) => {
    showWarning(message, 'Validation Error');
  },

  permissionError: (showError: (error: ErrorInfo) => void) => {
    showError({
      title: 'Permission Denied',
      message: 'You do not have permission to perform this action. Please contact your administrator if you believe this is an error.',
      reportable: false,
      errorCode: 'PERMISSION_DENIED'
    });
  },

  fileUploadError: (showError: (error: ErrorInfo) => void, details: string, retry?: () => void) => {
    showError({
      title: 'File Upload Failed',
      message: 'There was a problem uploading your file. Please check the file size and format, then try again.',
      details,
      canRetry: !!retry,
      onRetry: retry,
      reportable: true,
      errorCode: 'FILE_UPLOAD_ERROR'
    });
  },

  sessionExpired: (showWarning: (message: string, title?: string) => void) => {
    showWarning('Your session has expired. Please log in again to continue.', 'Session Expired');
    // Redirect to login after a delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  }
};

export default NotificationProvider;
