import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Chip, Box } from '@mui/material';

interface RiskItem {
  project: string;
  risk: string;
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  owner: string;
  due: string;
}

interface RiskAlertsPanelProps {
  risks: RiskItem[];
  getRiskColor: (level: string) => 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const RiskAlertsPanel: React.FC<RiskAlertsPanelProps> = ({ risks, getRiskColor }) => {
  return (
    <Card>
      <CardContent>
        <Typography id="risk-alerts-heading" variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
          Risk Alerts
        </Typography>
        <List>
          {risks.map((item, idx) => (
            <ListItem key={idx} alignItems="flex-start" sx={{ mb: 1, px: 0 }}>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {item.project}
                    </Typography>
                    <Chip label={item.level} color={getRiskColor(item.level)} size="small" />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                      {item.risk}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Owner: {item.owner} • Due: {item.due}
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

export default RiskAlertsPanel;
