import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, Container } from '@mui/material';
import { RefreshOutlined, BugReportOutlined } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Error caught by boundary
    
    this.setState({
      error,
      errorInfo
    });

    // Log to external service if in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Log to error reporting service
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;
    
    // Error report generated
    // TODO: Send to error reporting service
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Box textAlign="center">
            <BugReportOutlined sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            
            <Typography variant="h4" gutterBottom>
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<RefreshOutlined />}
                onClick={this.handleRefresh}
              >
                Refresh Page
              </Button>
              
              <Button
                variant="outlined"
                onClick={this.handleReportError}
              >
                Report Issue
              </Button>
            </Box>

            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 4, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom>
                  Development Debug Info:
                </Typography>
                <Alert severity="info">
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {this.state.error?.stack}
                  </pre>
                </Alert>
                {this.state.errorInfo && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </Alert>
                )}
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
