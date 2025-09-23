import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Box, Typography, Button, Alert, Container } from '@mui/material';
import { RefreshOutlined, BugReportOutlined } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
  stack?: string;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message, stack: error.stack };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === 'production') {
      // TODO: log error + info.componentStack to remote service
    }
  }

  handleRefresh = () => window.location.reload();
  handleReport = () => {
    // TODO: send this.state.message to reporting service
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Box textAlign="center">
            <BugReportOutlined sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>Oops! Something went wrong</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Error:</strong> {this.state.message || 'Unknown error'}
              </Typography>
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<RefreshOutlined />} onClick={this.handleRefresh}>Refresh Page</Button>
              <Button variant="outlined" onClick={this.handleReport}>Report Issue</Button>
            </Box>
            {process.env.NODE_ENV === 'development' && this.state.stack && (
              <Box sx={{ mt: 4, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom>Development Debug Info:</Typography>
                <Alert severity="info">
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>{this.state.stack}</pre>
                </Alert>
              </Box>
            )}
          </Box>
        </Container>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
