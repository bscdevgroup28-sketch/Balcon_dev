import React from 'react';
import { Box, Typography } from '@mui/material';
import { layoutTokens } from '../../theme/layoutTokens';
import { useLayoutDensity } from '../../theme/LayoutDensityContext';

interface DashboardSectionProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  dense?: boolean;
  children: React.ReactNode;
  id?: string;
  sticky?: boolean;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  subtitle,
  actions,
  dense = false,
  children,
  id,
  sticky = false
}) => {
  const { density } = useLayoutDensity();
  const effectiveDense = dense || density === 'compact';
  return (
    <Box sx={{
      mb: effectiveDense ? layoutTokens.section.spacingYDense : layoutTokens.section.spacingY
    }} id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      {(title || actions) && (
        <Box sx={{ 
          position: sticky ? 'sticky' : 'relative',
          top: sticky ? { xs: 56, sm: 64 } : undefined,
          zIndex: sticky ? 1 : 'auto',
          backdropFilter: sticky ? 'saturate(180%) blur(8px)' : undefined,
          backgroundColor: sticky ? 'background.paper' : 'transparent',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', 
          mb: layoutTokens.section.titleMb 
        }}>
          <Box>
            {title && (
              <Typography variant="h6" id={id ? `${id}-heading` : undefined} sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
        </Box>
      )}
      {children}
    </Box>
  );
};

export default DashboardSection;
