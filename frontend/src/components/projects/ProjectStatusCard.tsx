import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Button,
} from '@mui/material';
import {
  Visibility,
  Chat,
  Schedule,
  Person,
  LocationOn,
  CalendarToday,
} from '@mui/icons-material';

interface ProjectStatusCardProps {
  project: {
    id: number;
    title: string;
    type: string;
    status: string;
    progress: number;
    estimatedCompletion: string;
    location: string;
    salesRep?: {
      name: string;
      avatar?: string;
    };
    lastUpdate: string;
  };
  onViewDetails?: (projectId: number) => void;
  onContactRep?: (projectId: number) => void;
}

const ProjectStatusCard: React.FC<ProjectStatusCardProps> = ({
  project,
  onViewDetails,
  onContactRep,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'inquiry': return 'info';
      case 'quoted': return 'warning';
      case 'approved': return 'success';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'error';
    if (progress < 50) return 'warning';
    if (progress < 75) return 'info';
    return 'success';
  };

  return (
    <Card sx={{ 
      border: 1, 
      borderColor: 'divider',
      '&:hover': {
        boxShadow: 3,
        borderColor: 'primary.main',
      },
      transition: 'all 0.2s ease-in-out'
    }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" noWrap>
              {project.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip 
                label={project.status} 
                size="small" 
                color={getStatusColor(project.status) as any}
                variant="filled"
              />
              <Typography variant="caption" color="text.secondary">
                {project.type}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Details">
              <IconButton 
                size="small" 
                onClick={() => onViewDetails?.(project.id)}
                sx={{ color: 'primary.main' }}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
            {project.salesRep && (
              <Tooltip title="Contact Sales Rep">
                <IconButton 
                  size="small"
                  onClick={() => onContactRep?.(project.id)}
                  sx={{ color: 'success.main' }}
                >
                  <Chat />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Project Progress
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {project.progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={project.progress} 
            color={getProgressColor(project.progress) as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Project Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {project.location}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Est. Completion: {project.estimatedCompletion}
            </Typography>
          </Box>

          {project.salesRep && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Sales Rep: {project.salesRep.name}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Last Update */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {project.lastUpdate}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            size="small" 
            fullWidth
            onClick={() => onViewDetails?.(project.id)}
          >
            View Details
          </Button>
          {project.salesRep && (
            <Button 
              variant="text" 
              size="small"
              onClick={() => onContactRep?.(project.id)}
              startIcon={<Chat />}
            >
              Contact
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectStatusCard;
