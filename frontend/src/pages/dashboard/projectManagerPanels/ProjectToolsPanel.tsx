import React from 'react';
import { Card, CardContent, Typography, Grid, Button, Box } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddTaskIcon from '@mui/icons-material/PlaylistAddCheck';
import TimelineIcon from '@mui/icons-material/Timeline';
import PeopleIcon from '@mui/icons-material/People';
import BackupTableIcon from '@mui/icons-material/BackupTable';
import SettingsIcon from '@mui/icons-material/Settings';

interface ToolItem {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

interface ProjectToolsPanelProps {
  onAction?: (toolLabel: string) => void;
}

const ProjectToolsPanel: React.FC<ProjectToolsPanelProps> = ({ onAction }) => {
  const tools: ToolItem[] = [
    { label: 'Generate Report', icon: <AssessmentIcon fontSize="small" />, color: 'primary' },
    { label: 'Add Task Batch', icon: <AddTaskIcon fontSize="small" />, color: 'secondary' },
    { label: 'Timeline Review', icon: <TimelineIcon fontSize="small" />, color: 'info' },
    { label: 'Team Assignments', icon: <PeopleIcon fontSize="small" />, color: 'success' },
    { label: 'Data Export', icon: <BackupTableIcon fontSize="small" />, color: 'warning' },
    { label: 'Settings', icon: <SettingsIcon fontSize="small" />, color: 'error' },
  ];

  return (
    <Card>
      <CardContent>
        <Typography id="project-tools-heading" variant="h6" gutterBottom sx={{ color: '#455a64', fontWeight: 600 }}>
          Project Tools
        </Typography>
        <Grid container spacing={1}>
          {tools.map((tool, idx) => (
            <Grid item xs={12} sm={6} key={idx}>
              <Button
                variant="outlined"
                startIcon={tool.icon}
                color={tool.color}
                fullWidth
                size="small"
                onClick={() => onAction?.(tool.label)}
                sx={{ justifyContent: 'flex-start', fontWeight: 500, textTransform: 'none' }}
              >
                {tool.label}
              </Button>
            </Grid>
          ))}
        </Grid>
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            These quick tools trigger project management workflows (placeholder actions).
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectToolsPanel;
