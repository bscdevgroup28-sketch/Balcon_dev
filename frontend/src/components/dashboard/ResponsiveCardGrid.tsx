import React from 'react';
import { Box } from '@mui/material';
import { layoutTokens } from '../../theme/layoutTokens';
import { useLayoutDensity } from '../../theme/LayoutDensityContext';

interface ResponsiveCardGridProps {
  children: React.ReactNode;
  minWidth?: number; // min card width
  gap?: number;
  rowGap?: number;
}

// A lightweight responsive CSS grid that auto-fills available horizontal space
// with a minimum card width so dashboards span the full content area without
// leaving unused whitespace to the left or right.
const ResponsiveCardGrid: React.FC<ResponsiveCardGridProps> = ({
  children,
  minWidth = 240,
  gap = 3,
  rowGap
}) => {
  const { density } = useLayoutDensity();
  const effectiveGap = gap ?? (density === 'compact' ? layoutTokens.card.gapDense : layoutTokens.card.gap);
  const baseMin = minWidth ?? layoutTokens.card.minWidth;
  return (
    <Box
      sx={{
        display: 'grid',
        width: '100%',
        gap: effectiveGap,
        rowGap: rowGap || effectiveGap,
        gridTemplateColumns: {
          xs: `repeat(auto-fill, minmax(${baseMin}px, 1fr))`,
          sm: `repeat(auto-fill, minmax(${baseMin + 20}px, 1fr))`,
          md: `repeat(auto-fill, minmax(${baseMin + 40}px, 1fr))`
        }
      }}
    >
      {children}
    </Box>
  );
};

export default ResponsiveCardGrid;