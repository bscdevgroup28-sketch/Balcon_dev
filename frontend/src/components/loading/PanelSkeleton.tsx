import React from 'react';
import { Card, CardContent, Skeleton, Box, Grid, Typography } from '@mui/material';

interface PanelSkeletonProps {
  lines?: number;
  variant?: 'table' | 'list' | 'metrics' | 'grid' | 'tools';
  titleWidth?: number | string;
  dense?: boolean;
  height?: number;
}

const PanelSkeleton: React.FC<PanelSkeletonProps> = ({
  lines = 4,
  variant = 'list',
  titleWidth = 160,
  dense = false,
  height
}) => {
  const lineArray = Array.from({ length: lines });

  const renderContent = () => {
    switch (variant) {
      case 'table':
        return (
          <>
            <Skeleton variant="rectangular" height={32} sx={{ mb: 1, borderRadius: 1 }} />
            {lineArray.map((_, i) => (
              <Box key={i} display="flex" gap={2} mb={0.75}>
                <Skeleton variant="text" width={140} height={18} />
                <Skeleton variant="text" width={80} height={18} />
                <Skeleton variant="text" width={60} height={18} />
                <Skeleton variant="text" width={90} height={18} />
                <Skeleton variant="text" width={70} height={18} />
              </Box>
            ))}
          </>
        );
      case 'metrics':
        return (
          <Grid container spacing={2}>
            {lineArray.slice(0, 6).map((_, i) => (
              <Grid item xs={6} sm={4} md={2} key={i}>
                <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        );
      case 'grid':
        return (
          <Grid container spacing={2}>
            {lineArray.map((_, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Skeleton variant="rectangular" height={dense ? 110 : 140} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        );
      case 'tools':
        return (
          <Grid container spacing={1}>
            {lineArray.slice(0, 6).map((_, i) => (
              <Grid item xs={12} sm={6} md={2} key={i}>
                <Skeleton variant="rectangular" height={38} sx={{ borderRadius: 1 }} />
              </Grid>
            ))}
          </Grid>
        );
      case 'list':
      default:
        return (
          <>
            {lineArray.map((_, i) => (
              <Box key={i} mb={dense ? 0.75 : 1.25}>
                <Skeleton variant="text" width={titleWidth} height={18} />
                {!dense && <Skeleton variant="text" width={titleWidth as number * 0.6 || 100} height={14} />}
              </Box>
            ))}
          </>
        );
    }
  };

  return (
    <Card sx={{ height: height ? `${height}px` : '100%' }}>
      <CardContent>
        <Typography component="div" variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          <Skeleton variant="text" width={titleWidth} height={28} />
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default PanelSkeleton;
