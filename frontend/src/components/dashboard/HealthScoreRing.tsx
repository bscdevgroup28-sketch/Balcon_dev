import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  CircularProgress,
  useTheme,
  Tooltip,
  Grid,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
} from '@mui/icons-material';

export interface HealthMetric {
  name: string;
  score: number; // 0-100
  trend?: 'up' | 'down' | 'flat';
  trendValue?: number;
  description?: string;
}

interface HealthScoreRingProps {
  overall: number; // 0-100
  breakdown: HealthMetric[] | Record<string, number>;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  showTrends?: boolean;
}

const HealthScoreRing: React.FC<HealthScoreRingProps> = ({
  overall,
  breakdown,
  title = 'Business Health Score',
  size = 'large',
  showTrends = true,
}) => {
  const theme = useTheme();

  // Convert breakdown to array if it's an object
  const metrics: HealthMetric[] = Array.isArray(breakdown)
    ? breakdown
    : Object.entries(breakdown).map(([name, score]) => ({ name, score }));

  const getScoreColor = (score: number) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 75) return theme.palette.info.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Attention';
  };

  const getTrendIcon = (trend?: string, value?: number) => {
    if (!trend) return null;

    const iconProps = { sx: { fontSize: 16 } };

    switch (trend) {
      case 'up':
        return <TrendingUp {...iconProps} sx={{ ...iconProps.sx, color: theme.palette.success.main }} />;
      case 'down':
        return <TrendingDown {...iconProps} sx={{ ...iconProps.sx, color: theme.palette.error.main }} />;
      default:
        return <TrendingFlat {...iconProps} sx={{ ...iconProps.sx, color: theme.palette.grey[500] }} />;
    }
  };

  const ringSize = size === 'small' ? 120 : size === 'medium' ? 160 : 220;
  const ringThickness = size === 'small' ? 8 : size === 'medium' ? 10 : 14;

  return (
    <Card>
      <CardContent>
        {/* Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Tooltip title="Composite score based on key business metrics">
            <Info sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
          </Tooltip>
        </Box>

        {/* Main Score Ring */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            {/* Background ring */}
            <CircularProgress
              variant="determinate"
              value={100}
              size={ringSize}
              thickness={ringThickness}
              sx={{
                color: `${theme.palette.grey[300]}`,
                position: 'absolute',
              }}
            />
            {/* Score ring */}
            <CircularProgress
              variant="determinate"
              value={overall}
              size={ringSize}
              thickness={ringThickness}
              sx={{
                color: getScoreColor(overall),
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
            {/* Center text */}
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant={size === 'small' ? 'h4' : size === 'medium' ? 'h3' : 'h2'}
                component="div"
                fontWeight={700}
                color={getScoreColor(overall)}
              >
                {overall}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                out of 100
              </Typography>
            </Box>
          </Box>

          {/* Overall Status Label */}
          <Chip
            label={getScoreLabel(overall)}
            sx={{
              mt: 2,
              backgroundColor: `${getScoreColor(overall)}15`,
              color: getScoreColor(overall),
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '4px 8px',
            }}
          />
        </Box>

        {/* Breakdown Metrics */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            Performance Breakdown
          </Typography>

          <Grid container spacing={2}>
            {metrics.map((metric, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.default,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight={500} color="text.secondary">
                      {metric.name}
                    </Typography>
                    {showTrends && metric.trend && metric.trendValue && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getTrendIcon(metric.trend, metric.trendValue)}
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          sx={{
                            color:
                              metric.trend === 'up'
                                ? theme.palette.success.main
                                : metric.trend === 'down'
                                ? theme.palette.error.main
                                : theme.palette.grey[500],
                          }}
                        >
                          {metric.trendValue > 0 ? '+' : ''}
                          {metric.trendValue}%
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      {/* Background mini ring */}
                      <CircularProgress
                        variant="determinate"
                        value={100}
                        size={50}
                        thickness={5}
                        sx={{
                          color: `${theme.palette.grey[300]}`,
                          position: 'absolute',
                        }}
                      />
                      {/* Score mini ring */}
                      <CircularProgress
                        variant="determinate"
                        value={metric.score}
                        size={50}
                        thickness={5}
                        sx={{
                          color: getScoreColor(metric.score),
                        }}
                      />
                      {/* Center number */}
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" fontWeight={700} color={getScoreColor(metric.score)}>
                          {metric.score}
                        </Typography>
                      </Box>
                    </Box>

                    {metric.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                        {metric.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Insights */}
        {overall >= 90 && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: `${theme.palette.success.main}10`,
              borderRadius: 2,
              border: `1px solid ${theme.palette.success.main}30`,
            }}
          >
            <Typography variant="body2" color="success.dark" fontWeight={600}>
              ✓ Excellent performance! All systems operating optimally.
            </Typography>
          </Box>
        )}

        {overall < 60 && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: `${theme.palette.warning.main}10`,
              borderRadius: 2,
              border: `1px solid ${theme.palette.warning.main}30`,
            }}
          >
            <Typography variant="body2" color="warning.dark" fontWeight={600}>
              ⚠ Attention needed: Review low-performing metrics for improvement opportunities.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthScoreRing;
