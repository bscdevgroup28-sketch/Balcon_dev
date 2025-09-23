import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, Chip } from '@mui/material';
import { Flag } from '@mui/icons-material';

interface MilestoneItem {
  project: string;
  milestone: string;
  date: string;
  status: string;
}

interface UpcomingMilestonesPanelProps {
  milestones: MilestoneItem[];
  getMilestoneStatusColor: (status: string) => any;
}

const UpcomingMilestonesPanel: React.FC<UpcomingMilestonesPanelProps> = ({ milestones, getMilestoneStatusColor }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography id="milestones-heading" variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
          Upcoming Milestones
        </Typography>
        <List sx={{ maxHeight: '280px', overflow: 'auto' }}>
          {milestones.map((milestone, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemIcon>
                  <Flag color={getMilestoneStatusColor(milestone.status) as any} />
                </ListItemIcon>
                <ListItemText
                  primary={milestone.milestone}
                  secondary={`${milestone.project} - ${milestone.date}`}
                />
                <Chip
                  label={milestone.status}
                  color={getMilestoneStatusColor(milestone.status) as any}
                  size="small"
                />
              </ListItem>
              {index < milestones.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default UpcomingMilestonesPanel;
