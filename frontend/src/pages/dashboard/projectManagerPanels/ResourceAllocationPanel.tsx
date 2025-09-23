import React from 'react';
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress, Box } from '@mui/material';

interface ResourceItem {
  resource: string;
  type: string;
  allocated: number; // hours allocated
  capacity: number;  // total capacity
  critical?: boolean;
}

interface ResourceAllocationPanelProps {
  resources: ResourceItem[];
}

const ResourceAllocationPanel: React.FC<ResourceAllocationPanelProps> = ({ resources }) => {
  return (
    <Card>
      <CardContent>
        <Typography id="resource-allocation-heading" variant="h6" gutterBottom sx={{ color: '#6a1b9a', fontWeight: 600 }}>
          Resource Allocation
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Resource</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Allocated</TableCell>
              <TableCell align="right">Capacity</TableCell>
              <TableCell sx={{ width: 140 }}>Utilization</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resources.map((row, idx) => {
              const pct = Math.min(100, (row.allocated / row.capacity) * 100);
              return (
                <TableRow key={idx} hover>
                  <TableCell>{row.resource}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell align="right">{row.allocated}</TableCell>
                  <TableCell align="right">{row.capacity}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box flexGrow={1}>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{ height: 6, borderRadius: 4 }}
                          color={pct < 80 ? 'primary' : pct < 100 ? 'warning' : 'error'}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ minWidth: 30, textAlign: 'right' }}>
                        {pct.toFixed(0)}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ResourceAllocationPanel;
