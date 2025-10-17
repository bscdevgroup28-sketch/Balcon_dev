import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Build,
  Schedule,
  Warning,
  Cancel,
} from '@mui/icons-material';

export interface TimelinePhase {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'delayed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  progress?: number;
  details?: string[];
}

interface ProjectTimelineProps {
  phases: TimelinePhase[];
  orientation?: 'horizontal' | 'vertical';
  compact?: boolean;
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  phases,
  orientation = 'vertical',
  compact = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Force vertical on mobile
  const actualOrientation = isMobile ? 'vertical' : orientation;

  const getStatusIcon = (status: TimelinePhase['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      case 'in-progress':
        return <Build sx={{ color: theme.palette.primary.main }} />;
      case 'delayed':
        return <Warning sx={{ color: theme.palette.warning.main }} />;
      case 'cancelled':
        return <Cancel sx={{ color: theme.palette.error.main }} />;
      default:
        return <RadioButtonUnchecked sx={{ color: theme.palette.grey[400] }} />;
    }
  };

  const getStatusColor = (status: TimelinePhase['status']) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'in-progress':
        return theme.palette.primary.main;
      case 'delayed':
        return theme.palette.warning.main;
      case 'cancelled':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[400];
    }
  };

  const getStatusLabel = (status: TimelinePhase['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'delayed':
        return 'Delayed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Upcoming';
    }
  };

  const activeStep = phases.findIndex((phase) => phase.status === 'in-progress');

  if (actualOrientation === 'horizontal' && !compact) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.default,
          borderRadius: 2,
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel>
          {phases.map((phase) => (
            <Step key={phase.id} completed={phase.status === 'completed'}>
              <StepLabel
                icon={getStatusIcon(phase.status)}
                error={phase.status === 'delayed' || phase.status === 'cancelled'}
                sx={{
                  '& .MuiStepLabel-label': {
                    mt: 1,
                    fontWeight: phase.status === 'in-progress' ? 600 : 400,
                  },
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {phase.label}
                  </Typography>
                  {phase.progress !== undefined && phase.status === 'in-progress' && (
                    <Box sx={{ mt: 1, width: '100%' }}>
                      <LinearProgress
                        variant="determinate"
                        value={phase.progress}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {phase.progress}%
                      </Typography>
                    </Box>
                  )}
                  {phase.endDate && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {phase.endDate}
                    </Typography>
                  )}
                </Box>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>
    );
  }

  // Vertical layout (default and mobile)
  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 2 : 3,
        backgroundColor: theme.palette.background.default,
        borderRadius: 2,
      }}
    >
      <Stepper activeStep={activeStep} orientation="vertical">
        {phases.map((phase, index) => (
          <Step key={phase.id} expanded>
            <StepLabel
              icon={getStatusIcon(phase.status)}
              error={phase.status === 'delayed' || phase.status === 'cancelled'}
              sx={{
                '& .MuiStepLabel-label': {
                  fontSize: compact ? '0.875rem' : '1rem',
                  fontWeight: phase.status === 'in-progress' ? 600 : 500,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Typography
                  variant={compact ? 'body2' : 'body1'}
                  fontWeight={phase.status === 'in-progress' ? 600 : 500}
                >
                  {phase.label}
                </Typography>
                <Chip
                  label={getStatusLabel(phase.status)}
                  size="small"
                  sx={{
                    backgroundColor:
                      phase.status === 'completed'
                        ? `${theme.palette.success.main}15`
                        : phase.status === 'in-progress'
                        ? `${theme.palette.primary.main}15`
                        : phase.status === 'delayed'
                        ? `${theme.palette.warning.main}15`
                        : `${theme.palette.grey[400]}15`,
                    color: getStatusColor(phase.status),
                    fontWeight: 600,
                  }}
                />
              </Box>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {phase.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: phase.progress !== undefined ? 2 : 0 }}
                  >
                    {phase.description}
                  </Typography>
                )}

                {phase.progress !== undefined && phase.status === 'in-progress' && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {phase.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={phase.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: `${theme.palette.primary.main}15`,
                      }}
                    />
                  </Box>
                )}

                {(phase.startDate || phase.endDate) && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      flexWrap: 'wrap',
                      mt: 1,
                    }}
                  >
                    {phase.startDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                        <Typography variant="caption" color="text.secondary">
                          Started: {phase.startDate}
                        </Typography>
                      </Box>
                    )}
                    {phase.endDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                        <Typography variant="caption" color="text.secondary">
                          {phase.status === 'completed' ? 'Completed' : 'Target'}: {phase.endDate}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {phase.details && phase.details.length > 0 && !compact && (
                  <Box sx={{ mt: 2, pl: 2, borderLeft: `2px solid ${theme.palette.grey[300]}` }}>
                    {phase.details.map((detail, idx) => (
                      <Typography
                        key={idx}
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        • {detail}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default ProjectTimeline;
