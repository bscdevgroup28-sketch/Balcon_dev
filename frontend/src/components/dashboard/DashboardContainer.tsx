import React from 'react';
import { Box } from '@mui/material';

interface DashboardContainerProps {
  children: React.ReactNode;
  fullHeight?: boolean;
  disableGutters?: boolean;
}

// Centralized layout wrapper for dashboards to enforce consistent spacing and width usage.
const APP_BAR_DESKTOP = 64; // MUI default AppBar height (desktop)
const APP_BAR_MOBILE = 56;  // Mobile variant height

const DashboardContainer: React.FC<DashboardContainerProps> = ({
  children,
  fullHeight = false,
  disableGutters = false
}) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        mx: 'auto',
        px: disableGutters ? 0 : { xs: 1, sm: 2, md: 3 },
        pb: { xs: 4, md: 6 },
        pt: 0, // Layout already adds top spacing via Toolbar spacer
        minHeight: fullHeight ? {
          xs: `calc(100vh - ${APP_BAR_MOBILE}px)`,
          sm: `calc(100vh - ${APP_BAR_DESKTOP}px)`
        } : 'auto',
        boxSizing: 'border-box'
      }}
    >
      {children}
    </Box>
  );
};

export default DashboardContainer;
