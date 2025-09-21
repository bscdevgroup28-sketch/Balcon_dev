import React, { useState, useEffect, useCallback } from 'react';
import {
  Fab,
  Popover,
  Paper,
  Typography,
  Button,
  Box,
  IconButton,
  Zoom,
  Backdrop,
} from '@mui/material';
import {
  Lightbulb,
  Close,
  NavigateNext,
  NavigateBefore,
  TipsAndUpdates,
} from '@mui/icons-material';

interface FeatureTip {
  id: string;
  element: string; // CSS selector
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface FeatureDiscoveryProps {
  tips: FeatureTip[];
  autoStart?: boolean;
  showButton?: boolean;
}

const FeatureDiscovery: React.FC<FeatureDiscoveryProps> = ({ 
  tips, 
  autoStart = false, 
  showButton = true 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (autoStart && !localStorage.getItem('feature_discovery_seen')) {
      setTimeout(() => startTour(), 2000);
    }
  }, [autoStart]);

  useEffect(() => {
    if (isActive && tips.length > 0) {
      showCurrentTip();
    }
  }, [isActive, currentTipIndex, tips, showCurrentTip]);

  const startTour = () => {
    setCurrentTipIndex(0);
    setIsActive(true);
  };

  const endTour = useCallback(() => {
    setIsActive(false);
    setAnchorEl(null);
    localStorage.setItem('feature_discovery_seen', 'true');
  }, []);

  const showCurrentTip = useCallback(() => {
    if (currentTipIndex >= tips.length) {
      endTour();
      return;
    }

    const tip = tips[currentTipIndex];
    const element = document.querySelector(tip.element) as HTMLElement;
    
    if (element) {
      setAnchorEl(element);
      
      // Scroll element into view
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight element
      element.style.position = 'relative';
      element.style.zIndex = '1001';
      element.style.outline = '3px solid #1976d2';
      element.style.outlineOffset = '4px';
      element.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
    }
  }, [currentTipIndex, tips, endTour]);

  const removeHighlight = () => {
    if (currentTipIndex < tips.length) {
      const tip = tips[currentTipIndex];
      const element = document.querySelector(tip.element) as HTMLElement;
      
      if (element) {
        element.style.position = '';
        element.style.zIndex = '';
        element.style.outline = '';
        element.style.outlineOffset = '';
        element.style.backgroundColor = '';
      }
    }
  };

  const nextTip = () => {
    removeHighlight();
    setCurrentTipIndex(prev => prev + 1);
  };

  const previousTip = () => {
    removeHighlight();
    setCurrentTipIndex(prev => prev - 1);
  };

  const skipTour = () => {
    removeHighlight();
    endTour();
  };

  const currentTip = tips[currentTipIndex];

  return (
    <>
      {/* Feature Discovery Button */}
      {showButton && !isActive && (
        <Zoom in timeout={1000}>
          <Fab
            color="secondary"
            aria-label="feature discovery"
            sx={{
              position: 'fixed',
              bottom: 140,
              right: 16,
              zIndex: 1000,
            }}
            onClick={startTour}
          >
            <TipsAndUpdates />
          </Fab>
        </Zoom>
      )}

      {/* Backdrop for tour */}
      <Backdrop
        open={isActive}
        sx={{ 
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}
      />

      {/* Feature Tip Popover */}
      <Popover
        open={isActive && !!anchorEl && !!currentTip}
        anchorEl={anchorEl}
        onClose={skipTour}
        anchorOrigin={{
          vertical: currentTip?.position === 'top' ? 'top' : currentTip?.position === 'bottom' ? 'bottom' : 'center',
          horizontal: currentTip?.position === 'left' ? 'left' : currentTip?.position === 'right' ? 'right' : 'center',
        }}
        transformOrigin={{
          vertical: currentTip?.position === 'top' ? 'bottom' : currentTip?.position === 'bottom' ? 'top' : 'center',
          horizontal: currentTip?.position === 'left' ? 'right' : currentTip?.position === 'right' ? 'left' : 'center',
        }}
        PaperProps={{
          sx: {
            maxWidth: 320,
            zIndex: 1002,
            border: '2px solid',
            borderColor: 'primary.main',
          }
        }}
      >
        {currentTip && (
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Lightbulb color="primary" sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="h6" component="div">
                  {currentTip.title}
                </Typography>
              </Box>
              <IconButton size="small" onClick={skipTour}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {currentTip.description}
            </Typography>

            {currentTip.action && (
              <Button
                size="small"
                variant="outlined"
                onClick={currentTip.action.onClick}
                sx={{ mb: 2 }}
              >
                {currentTip.action.label}
              </Button>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {currentTipIndex + 1} of {tips.length}
              </Typography>
              
              <Box>
                {currentTipIndex > 0 && (
                  <IconButton size="small" onClick={previousTip}>
                    <NavigateBefore />
                  </IconButton>
                )}
                
                {currentTipIndex < tips.length - 1 ? (
                  <IconButton size="small" onClick={nextTip}>
                    <NavigateNext />
                  </IconButton>
                ) : (
                  <Button size="small" onClick={endTour}>
                    Finish
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Popover>
    </>
  );
};

// Pre-defined tips for different pages
export const projectPageTips: FeatureTip[] = [
  {
    id: 'new-project-button',
    element: '[data-testid="new-project-button"], .MuiFab-root:has([data-testid="add-icon"])',
    title: 'Create New Project',
    description: 'Click here to start a new metal building project. Our wizard will guide you through all the details.',
    position: 'left',
    action: {
      label: 'Try it now',
      onClick: () => window.location.href = '/projects/new'
    }
  },
  {
    id: 'project-filters',
    element: '[data-testid="project-filters"], .MuiTextField-root:has([placeholder*="Search"])',
    title: 'Filter Your Projects',
    description: 'Use these filters to quickly find specific projects by name, status, or type.',
    position: 'bottom'
  },
  {
    id: 'project-stats',
    element: '[data-testid="project-stats"], .MuiGrid-container:first-child',
    title: 'Project Overview',
    description: 'Get a quick overview of all your projects with these summary statistics.',
    position: 'bottom'
  }
];

export const dashboardTips: FeatureTip[] = [
  {
    id: 'welcome-section',
    element: '[data-testid="welcome-section"], .MuiTypography-h4:first-child',
    title: 'Your Dashboard',
    description: 'This is your central hub. See project summaries, recent activity, and quick actions.',
    position: 'bottom'
  },
  {
    id: 'quick-actions',
    element: '[data-testid="quick-actions"], .MuiButton-contained',
    title: 'Quick Actions',
    description: 'Access the most common actions directly from your dashboard.',
    position: 'top'
  }
];

export default FeatureDiscovery;
