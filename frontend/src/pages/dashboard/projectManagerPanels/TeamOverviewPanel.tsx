import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Avatar, Chip, Divider, Box } from '@mui/material';

interface TeamMember {
  name: string;
  role: string;
  projects: number;
  utilization: number;
  status: string;
}

interface TeamOverviewPanelProps {
  team: TeamMember[];
  getTeamStatusColor: (status: string) => any;
}

const TeamOverviewPanel: React.FC<TeamOverviewPanelProps> = ({ team, getTeamStatusColor }) => {
  return (
    <Card>
      <CardContent>
        <Typography id="team-overview-heading" variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
          Team Overview
        </Typography>
        <List>
          {team.map((member, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <ListItemText
                  primary={member.name}
                  secondary={`${member.role} - ${member.projects} projects`}
                />
                <Box display="flex" flexDirection="column" alignItems="flex-end">
                  <Chip
                    label={member.status}
                    color={getTeamStatusColor(member.status) as any}
                    size="small"
                    sx={{ mb: 0.5 }}
                  />
                  <Typography variant="caption">
                    {member.utilization}% util.
                  </Typography>
                </Box>
              </ListItem>
              {index < team.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default TeamOverviewPanel;
