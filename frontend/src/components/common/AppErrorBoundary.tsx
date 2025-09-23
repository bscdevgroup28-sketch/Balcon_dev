import React from 'react';
import { Box, Button, Typography, Alert, Container } from '@mui/material';
import { RefreshOutlined, BugReportOutlined } from '@mui/icons-material';
import { reportError } from '../../services/errorReporting';

interface Props {
  children: React.ReactNode;
}

function Fallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box textAlign="center">
        <BugReportOutlined sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>Something went wrong</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          An unexpected error occurred. You can try refreshing the page.
        </Typography>
        <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body2"><strong>Error:</strong> {error.message}</Typography>
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<RefreshOutlined />} onClick={() => window.location.reload()}>Refresh Page</Button>
          <Button variant="outlined" onClick={resetErrorBoundary}>Try Again</Button>
        </Box>
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 4, textAlign: 'left' }}>
            <Typography variant="h6" gutterBottom>Dev Stack Trace</Typography>
            <Alert severity="info">
              <pre style={{ fontSize: 12, overflow: 'auto' }}>{error.stack}</pre>
            </Alert>
          </Box>
        )}
      </Box>
    </Container>
  );
}

// Factory to wrap children since current TS config misinterprets ErrorBoundary JSX type.
interface BoundaryState { hasError: boolean; error: Error | null; info: { componentStack: string } | null; }

export default class AppErrorBoundary extends React.Component<Props, BoundaryState> {
  state: BoundaryState = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ info });
    reportError(error, { extra: { componentStack: info.componentStack } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return <Fallback error={this.state.error} resetErrorBoundary={this.handleReset} />;
    }
    return this.props.children as React.ReactElement;
  }
}
