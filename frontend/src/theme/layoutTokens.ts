export const layoutTokens = {
  card: {
    minWidth: 260,
    gap: 3,
    gapDense: 2,
  },
  section: {
    spacingY: { xs: 2, sm: 3 },
    spacingYDense: { xs: 1.5, sm: 2 },
    titleMb: { xs: 1.5, sm: 2 },
  },
  container: {
    maxWidth: 'xl' as const,
    gutters: { xs: 1, sm: 2, md: 3 },
    guttersDense: { xs: 1, sm: 1.5, md: 2 },
  },
};

export type LayoutTokens = typeof layoutTokens;
