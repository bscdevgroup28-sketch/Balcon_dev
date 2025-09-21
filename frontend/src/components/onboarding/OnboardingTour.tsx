import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  IconButton,
  Fade,
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Assignment,
  Person,
  Dashboard,
  Help,
  PlayArrow,
  NavigateNext,
  NavigateBefore,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface OnboardingStep {
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
  userType: 'customer' | 'admin';
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose, userType }) => {
  const [activeStep, setActiveStep] = useState(0);
  const { user } = useSelector((state: RootState) => state.auth);

  const customerSteps: OnboardingStep[] = [
    {
      title: "Welcome to Bal-Con Builders!",
      description: "Let's get you started with your custom metal building project",
      content: (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Avatar
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main', 
              mx: 'auto', 
              mb: 2,
              fontSize: '2rem'
            }}
          >
            {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            Hello, {user?.firstName || 'Valued Customer'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We're excited to help you build your dream metal structure. 
            This quick tour will show you how to get the most out of our platform.
          </Typography>
        </Box>
      ),
    },
    {
      title: "Create Your First Project",
      description: "Start by submitting your project details and requirements",
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Our project wizard makes it easy to submit your building requirements:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="Basic Information" 
                secondary="Tell us about your project type and location"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="Specifications" 
                secondary="Building size, foundation, and material preferences"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="Timeline & Budget" 
                secondary="Your desired timeline and estimated budget"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="Files & Requirements" 
                secondary="Upload plans, photos, or special requirements"
              />
            </ListItem>
          </List>
        </Box>
      ),
      action: {
        label: "Create Project Now",
        onClick: () => {
          onClose();
          window.location.href = '/projects/new';
        }
      }
    },
    {
      title: "Track Your Project Progress",
      description: "Monitor every stage of your building project",
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Stay informed throughout your project lifecycle:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip label="Inquiry Received" color="default" size="small" />
            <Chip label="In Design" color="primary" size="small" />
            <Chip label="Quote Ready" color="info" size="small" />
            <Chip label="Approved" color="success" size="small" />
            <Chip label="In Production" color="warning" size="small" />
            <Chip label="Completed" color="success" size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            You'll receive real-time updates and can communicate directly with our team 
            through the project dashboard.
          </Typography>
        </Box>
      ),
      action: {
        label: "View Projects",
        onClick: () => {
          onClose();
          window.location.href = '/projects';
        }
      }
    },
    {
      title: "Get Support When You Need It",
      description: "We're here to help every step of the way",
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Need assistance? We've got you covered:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><Help color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Help Center" 
                secondary="Find answers to common questions"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Person color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Live Chat" 
                secondary="Chat with our support team during business hours"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Assignment color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Project Comments" 
                secondary="Communicate directly on your project"
              />
            </ListItem>
          </List>
        </Box>
      ),
    }
  ];

  const adminSteps: OnboardingStep[] = [
    {
      title: "Welcome to the Admin Dashboard",
      description: "Manage all projects and customers from one central location",
      content: (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Dashboard sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Admin Control Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You have full access to manage projects, quotes, orders, and users. 
            Let's walk through the key features.
          </Typography>
        </Box>
      ),
    },
    {
      title: "Project Management Hub",
      description: "Monitor and manage all customer projects",
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Your project management capabilities:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="View All Projects" 
                secondary="See project status, progress, and customer details"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="Update Status" 
                secondary="Move projects through workflow stages"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="Communication" 
                secondary="Add comments and updates for customers"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="File Management" 
                secondary="Upload drawings, photos, and documents"
              />
            </ListItem>
          </List>
        </Box>
      ),
      action: {
        label: "Open Project Dashboard",
        onClick: () => {
          onClose();
          window.location.href = '/projects';
        }
      }
    },
    {
      title: "Customer & User Management",
      description: "Manage customer accounts and team members",
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            User management features:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><Person color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Customer Accounts" 
                secondary="View customer profiles and project history"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Assignment color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Role Management" 
                secondary="Assign roles and permissions to team members"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Dashboard color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Activity Monitoring" 
                secondary="Track user activity and system usage"
              />
            </ListItem>
          </List>
        </Box>
      ),
    }
  ];

  const steps = userType === 'customer' ? customerSteps : adminSteps;

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFinish = () => {
    // Mark onboarding as completed in user preferences
    localStorage.setItem('onboarding_completed', 'true');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          minHeight: 500,
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">
          Getting Started Guide
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.title}>
              <StepLabel>
                <Typography variant="h6">{step.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                <Fade in={activeStep === index}>
                  <Box sx={{ py: 2 }}>
                    {step.content}
                    
                    {step.action && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={step.action.onClick}
                          startIcon={<PlayArrow />}
                        >
                          {step.action.label}
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Fade>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<NavigateBefore />}
        >
          Back
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
          {activeStep + 1} of {steps.length}
        </Typography>
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleFinish}
            startIcon={<CheckCircle />}
          >
            Get Started
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<NavigateNext />}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingTour;
