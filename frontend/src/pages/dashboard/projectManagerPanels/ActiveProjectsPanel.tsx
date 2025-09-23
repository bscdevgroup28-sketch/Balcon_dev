import React from 'react';
import { Card, CardContent, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Box, LinearProgress, Chip } from '@mui/material';

interface ProjectItem {
  id: string;
  name: string;
  client: string;
  progress: number;
  budget: number;
  spent: number;
  deadline: string;
  status: string;
  team: number;
  phase: string;
}

interface ActiveProjectsPanelProps {
  projects: ProjectItem[];
  formatCurrency: (v: number) => string;
  getProjectStatusColor: (status: string) => any;
}

const ActiveProjectsPanel: React.FC<ActiveProjectsPanelProps> = ({ projects, formatCurrency, getProjectStatusColor }) => {
  return (
    <Card>
      <CardContent>
        <Typography id="active-projects-heading" variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
          Active Projects
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Budget</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Deadline</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {project.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {project.id} - {project.client}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{
                          width: 60,
                          mr: 1,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: project.progress >= 80 ? '#4caf50' : project.progress >= 50 ? '#ff9800' : '#f44336'
                          }
                        }}
                      />
                      <Typography variant="caption">
                        {project.progress}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(project.spent)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      of {formatCurrency(project.budget)}
                    </Typography>
                  </TableCell>
                  <TableCell>{project.team} members</TableCell>
                  <TableCell>
                    <Chip
                      label={project.status}
                      color={getProjectStatusColor(project.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{project.deadline}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ActiveProjectsPanel;
