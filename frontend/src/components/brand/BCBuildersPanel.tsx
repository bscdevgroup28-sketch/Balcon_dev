import React from 'react';
import { Card, CardContent, Typography, Box, Divider, Chip, Link, Stack } from '@mui/material';
import { Business, Info } from '@mui/icons-material';

/**
 * BC Builders brand/intro panel
 * - Compact and informational; designed to sit in a left rail on dashboards
 * - Sticky on larger screens via parent layout
 */
const BCBuildersPanel: React.FC = () => {
  return (
    <Card elevation={1} sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Business color="primary" />
          <Typography variant="h6" fontWeight={700}>
            BC Builders
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Modern construction management—quotes, orders, work orders, inventory, and real-time insights in one place.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Chip size="small" label="Projects" color="primary" variant="outlined" />
          <Chip size="small" label="Inventory" color="primary" variant="outlined" />
          <Chip size="small" label="Analytics" color="primary" variant="outlined" />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Info fontSize="small" color="action" />
          <Typography variant="subtitle2">Demo tips</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1.5 }}>
          Use the role switcher/login to explore each dashboard. Health in the top bar reflects backend status.
        </Typography>

        <Typography variant="caption" color="text.secondary" component="div">
          Need help? Visit{' '}
          <Link href="/docs" underline="hover">Docs</Link>
          {' '}or contact support.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default BCBuildersPanel;
