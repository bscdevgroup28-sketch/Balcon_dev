import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Paper,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  Phone,
  Email,
  CheckCircle,
  Warning,
  Info,
  Error,
} from '@mui/icons-material';

interface BusinessMetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

const BusinessMetricsCard: React.FC<BusinessMetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  actionButton,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: `${color}.main`, mr: 1 }}>
            {icon}
          </Box>
          <Typography variant="h6" component="div" color="text.secondary">
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h3" component="div" color={`${color}.main`} sx={{ mb: 1 }}>
          {value}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUp 
              sx={{ 
                fontSize: 16, 
                color: trend.direction === 'up' ? 'success.main' : 'error.main',
                transform: trend.direction === 'down' ? 'rotate(180deg)' : 'none'
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                ml: 0.5,
                color: trend.direction === 'up' ? 'success.main' : 'error.main'
              }}
            >
              {trend.percentage}% from last month
            </Typography>
          </Box>
        )}
        
        {actionButton && (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={actionButton.onClick}
            sx={{ mt: 1 }}
          >
            {actionButton.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
  featured?: boolean;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  color = 'primary',
  featured = false,
}) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        border: featured ? 2 : 1,
        borderColor: featured ? `${color}.main` : 'divider',
        bgcolor: featured ? `${color}.50` : 'background.paper',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: `${color}.main`, mr: 2 }}>
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
        
        <Button
          variant={featured ? 'contained' : 'outlined'}
          color={color}
          fullWidth
          onClick={onAction}
          startIcon={icon}
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

interface NotificationItemProps {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  actionable?: boolean;
  onAction?: () => void;
  onDismiss?: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  title,
  message,
  timestamp,
  actionable = false,
  onAction,
  onDismiss,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'error': return <Error color="error" />;
      default: return <Info color="info" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'success.50';
      case 'warning': return 'warning.50';
      case 'error': return 'error.50';
      default: return 'info.50';
    }
  };

  return (
    <ListItem
      sx={{
        bgcolor: getBackgroundColor(),
        borderRadius: 1,
        mb: 1,
        border: 1,
        borderColor: `${type}.200`,
      }}
    >
      <ListItemIcon>
        {getIcon()}
      </ListItemIcon>
      <ListItemText
        primary={title}
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {timestamp}
            </Typography>
          </Box>
        }
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        {actionable && onAction && (
          <Button size="small" variant="outlined" onClick={onAction}>
            Action
          </Button>
        )}
        {onDismiss && (
          <IconButton size="small" onClick={() => onDismiss(id)}>
            <CheckCircle />
          </IconButton>
        )}
      </Box>
    </ListItem>
  );
};

interface SalesRepContactCardProps {
  salesRep: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    specialties: string[];
    activeProjects: number;
    responseTime: string;
  };
}

const SalesRepContactCard: React.FC<SalesRepContactCardProps> = ({ salesRep }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Your Sales Representative
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          src={salesRep.avatar}
          sx={{ width: 60, height: 60, mr: 2 }}
        >
          {salesRep.name.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="h6">{salesRep.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Sales Representative
          </Typography>
          <Box sx={{ mt: 1 }}>
            {salesRep.specialties.map((specialty, index) => (
              <Chip 
                key={index}
                label={specialty} 
                size="small" 
                sx={{ mr: 0.5, mb: 0.5 }}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Contact Information
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2">{salesRep.email}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2">{salesRep.phone}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            {salesRep.activeProjects}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Active Projects
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="success.main">
            {salesRep.responseTime}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Avg Response Time
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<Phone />}
          href={`tel:${salesRep.phone}`}
          sx={{ flex: 1 }}
        >
          Call
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Email />}
          href={`mailto:${salesRep.email}`}
          sx={{ flex: 1 }}
        >
          Email
        </Button>
      </Box>
    </Paper>
  );
};

export {
  BusinessMetricsCard,
  QuickActionCard,
  NotificationItem,
  SalesRepContactCard,
};
