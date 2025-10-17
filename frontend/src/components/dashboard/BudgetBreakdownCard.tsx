import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  Chip,
  useTheme,
  Divider,
  Alert,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';

export interface BudgetCategory {
  name: string;
  amount: number;
  percentage: number;
  color?: string;
}

export interface BudgetBreakdownProps {
  categories: BudgetCategory[];
  totalBudget: number;
  spentAmount: number;
  currency?: string;
  showVariance?: boolean;
  targetBudget?: number;
}

const BudgetBreakdownCard: React.FC<BudgetBreakdownProps> = ({
  categories,
  totalBudget,
  spentAmount,
  currency = '$',
  showVariance = true,
  targetBudget,
}) => {
  const theme = useTheme();

  const budgetUsedPercentage = (spentAmount / totalBudget) * 100;
  const variance = targetBudget ? ((totalBudget - targetBudget) / targetBudget) * 100 : 0;

  const getVarianceIcon = () => {
    if (variance < -2) return <TrendingDown />;
    if (variance > 2) return <TrendingUp />;
    return <TrendingFlat />;
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  return (
    <Card>
      <CardHeader
        avatar={<AttachMoney color="primary" />}
        title="Budget Breakdown"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        subheader="Cost transparency & tracking"
      />
      <CardContent>
        {/* Budget Overview */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Budget
            </Typography>
            <Typography variant="h6" fontWeight={600} color="primary">
              {formatCurrency(totalBudget)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Spent to Date
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatCurrency(spentAmount)}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(budgetUsedPercentage, 100)}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: `${theme.palette.primary.main}15`,
              '& .MuiLinearProgress-bar': {
                backgroundColor:
                  budgetUsedPercentage > 90
                    ? theme.palette.error.main
                    : budgetUsedPercentage > 75
                    ? theme.palette.warning.main
                    : theme.palette.success.main,
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {budgetUsedPercentage.toFixed(1)}% used
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(totalBudget - spentAmount)} remaining
            </Typography>
          </Box>
        </Box>

        {/* Variance Alert */}
        {showVariance && targetBudget && Math.abs(variance) > 2 && (
          <Alert
            severity={variance < 0 ? 'success' : variance > 5 ? 'error' : 'warning'}
            icon={getVarianceIcon()}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2" fontWeight={600}>
              {variance < 0
                ? `✓ Project tracking ${Math.abs(variance).toFixed(1)}% under budget`
                : `⚠ Project ${variance.toFixed(1)}% over initial estimate`}
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Category Breakdown */}
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
          Cost Categories
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {categories.map((category, index) => {
            const categoryColor = category.color || defaultColors[index % defaultColors.length];

            return (
              <Box key={category.name}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: categoryColor,
                      }}
                    />
                    <Typography variant="body2" fontWeight={500}>
                      {category.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(category.amount)}
                    </Typography>
                    <Chip
                      label={`${category.percentage}%`}
                      size="small"
                      sx={{
                        backgroundColor: `${categoryColor}20`,
                        color: categoryColor,
                        fontWeight: 600,
                        minWidth: 55,
                      }}
                    />
                  </Box>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={category.percentage}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: `${categoryColor}15`,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: categoryColor,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Box>

        {/* Pie Chart Visual (Simplified) */}
        <Box sx={{ mt: 3, display: 'flex', height: 20, borderRadius: 2, overflow: 'hidden' }}>
          {categories.map((category, index) => {
            const categoryColor = category.color || defaultColors[index % defaultColors.length];

            return (
              <Box
                key={category.name}
                sx={{
                  width: `${category.percentage}%`,
                  backgroundColor: categoryColor,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
                title={`${category.name}: ${category.percentage}%`}
              />
            );
          })}
        </Box>

        {/* Summary Footer */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: theme.palette.success.main + '10',
            borderRadius: 2,
            border: `1px solid ${theme.palette.success.main}30`,
          }}
        >
          <Typography variant="body2" color="success.dark" fontWeight={600} textAlign="center">
            {budgetUsedPercentage < 90
              ? '✓ Budget on track for successful completion'
              : budgetUsedPercentage < 100
              ? '⚠ Monitor spending closely'
              : '⚠ Budget exceeded - review required'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BudgetBreakdownCard;
