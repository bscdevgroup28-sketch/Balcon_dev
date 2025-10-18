import React from 'react';
import { Button } from '@mui/material';

interface CSVDownloadButtonProps {
  onClick: () => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'text' | 'outlined' | 'contained';
}

const CSVDownloadButton: React.FC<CSVDownloadButtonProps> = ({ onClick, label = 'Download CSV', size = 'small', variant = 'outlined' }) => {
  return (
    <Button onClick={onClick} size={size} variant={variant}>
      {label}
    </Button>
  );
};

export default CSVDownloadButton;
