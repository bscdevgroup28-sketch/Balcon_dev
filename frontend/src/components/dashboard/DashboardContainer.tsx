import React from 'react';
import { Container } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { layoutTokens } from '../../theme/layoutTokens';
import { useLayoutDensity } from '../../theme/LayoutDensityContext';

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
  const { density } = useLayoutDensity();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  
  return (
    <Container 
      maxWidth={sidebarOpen ? layoutTokens.container.maxWidth : false}
      disableGutters={disableGutters}
      sx={{
        position: 'relative',
        width: '100%',
        mx: 'auto',
        px: disableGutters ? 0 : (density === 'compact' ? layoutTokens.container.guttersDense : layoutTokens.container.gutters),
        pb: { xs: 4, md: 6 },
        pt: 0,
        minHeight: fullHeight ? {
          xs: `calc(100vh - ${APP_BAR_MOBILE}px)`,
          sm: `calc(100vh - ${APP_BAR_DESKTOP}px)`
        } : 'auto',
        boxSizing: 'border-box'
      }}
    >
      {children}
    </Container>
  );
};

export default DashboardContainer;
