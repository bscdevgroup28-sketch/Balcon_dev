import React from 'react';
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress, Box } from '@mui/material';

interface BudgetItem {
  project: string;
  budget: number;
  spent: number;
  variance: number; // positive = under, negative = over
}

interface BudgetPerformancePanelProps {
  budgets: BudgetItem[];
  formatCurrency: (value: number) => string;
}

const BudgetPerformancePanel: React.FC<BudgetPerformancePanelProps> = ({ budgets, formatCurrency }) => {
  return (
    <Card>
      <CardContent>
        <Typography id="budget-performance-heading" variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 600 }}>
          Budget Performance
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell align="right">Budget</TableCell>
              <TableCell align="right">Spent</TableCell>
              <TableCell align="right">Variance</TableCell>
              <TableCell sx={{ width: 140 }}>Progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {budgets.map((row, idx) => {
              const pct = Math.min(100, (row.spent / row.budget) * 100);
              const varianceColor = row.variance < 0 ? 'error.main' : row.variance > 0 ? 'success.main' : 'text.secondary';
              return (
                <TableRow key={idx} hover>
                  <TableCell>{row.project}</TableCell>
                  <TableCell align="right">{formatCurrency(row.budget)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.spent)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: varianceColor }}>
                    {row.variance > 0 ? '+' : ''}{formatCurrency(row.variance)}
                  </TableCell>
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

export default BudgetPerformancePanel;
