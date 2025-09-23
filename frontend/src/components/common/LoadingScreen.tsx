import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: '240px',
      py: 4
    }}>
      <CircularProgress size={48} thickness={4} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {label}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
