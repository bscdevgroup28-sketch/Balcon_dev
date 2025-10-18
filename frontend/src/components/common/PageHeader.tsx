import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export interface BreadcrumbItem { label: string; to?: string }

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, breadcrumbs = [] }) => {
  return (
    <Box component="header" aria-label="page header" sx={{ mb: 3 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="breadcrumbs" separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
          {breadcrumbs.map((bc, i) => bc.to ? (
            <Link key={i} color="inherit" href={bc.to}>{bc.label}</Link>
          ) : (
            <Typography key={i} color="text.primary">{bc.label}</Typography>
          ))}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">{title}</Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
          )}
        </Box>
        {actions && <Box aria-label="page actions">{actions}</Box>}
      </Box>
    </Box>
  );
};

export default PageHeader;
