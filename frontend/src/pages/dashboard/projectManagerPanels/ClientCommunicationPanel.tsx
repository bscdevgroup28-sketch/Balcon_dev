import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Chip, Box } from '@mui/material';

interface CommunicationItem {
  client: string;
  topic: string;
  lastContact: string;
  nextAction: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Escalated';
}

interface ClientCommunicationPanelProps {
  communications: CommunicationItem[];
  getCommStatusColor: (status: string) => 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const ClientCommunicationPanel: React.FC<ClientCommunicationPanelProps> = ({ communications, getCommStatusColor }) => {
  return (
    <Card>
      <CardContent>
        <Typography id="client-communication-heading" variant="h6" gutterBottom sx={{ color: '#0288d1', fontWeight: 600 }}>
          Client Communication
        </Typography>
        <List>
          {communications.map((item, idx) => (
            <ListItem key={idx} sx={{ px: 0 }} alignItems="flex-start">
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {item.client}
                    </Typography>
                    <Chip label={item.status} color={getCommStatusColor(item.status)} size="small" />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                      {item.topic}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last: {item.lastContact} • Next: {item.nextAction}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default ClientCommunicationPanel;
