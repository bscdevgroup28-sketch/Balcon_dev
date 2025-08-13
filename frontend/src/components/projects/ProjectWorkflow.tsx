import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Assignment,
  RequestQuote,
  Build,
  LocalShipping,
  CheckCircle,
  Schedule,
  Phone,
  Email,
  Person,
  PhotoCamera,
  Description,
  Payment,
  Engineering,
} from '@mui/icons-material';

interface ProjectWorkflowProps {
  projectId: string;
  currentStage: number;
  projectData: {
    title: string;
    type: string;
    status: string;
    startDate: string;
    estimatedCompletion: string;
    salesRep: {
      name: string;
      email: string;
      phone: string;
      avatar?: string;
    };
  };
}

const ProjectWorkflow: React.FC<ProjectWorkflowProps> = ({ 
  projectId, 
  currentStage, 
  projectData 
}) => {
  const [activeStep, setActiveStep] = useState(currentStage);

  const workflowSteps = [
    {
      label: 'Project Inquiry',
      description: 'Initial project submission and requirements gathering',
      icon: <Assignment />,
      status: 'completed',
      date: '2025-01-15',
      details: [
        'Project requirements submitted',
        'Site information provided',
        'Initial documentation uploaded',
        'Sales representative assigned'
      ],
      actions: [
        { label: 'View Submission', action: 'view-submission' },
        { label: 'Upload Documents', action: 'upload-docs' }
      ]
    },
    {
      label: 'Site Assessment',
      description: 'Professional site evaluation and measurements',
      icon: <Engineering />,
      status: 'completed',
      date: '2025-01-18',
      details: [
        'Site visit scheduled and completed',
        'Soil and foundation assessment',
        'Utility and access evaluation',
        'Final measurements confirmed'
      ],
      actions: [
        { label: 'View Report', action: 'view-report' },
        { label: 'Schedule Follow-up', action: 'schedule-followup' }
      ]
    },
    {
      label: 'Design & Quote',
      description: 'Custom design development and detailed pricing',
      icon: <RequestQuote />,
      status: 'completed',
      date: '2025-01-22',
      details: [
        'Custom building design created',
        'Material specifications finalized',
        'Detailed quote prepared',
        'Quote sent for review'
      ],
      actions: [
        { label: 'View Quote', action: 'view-quote' },
        { label: 'Download Plans', action: 'download-plans' }
      ]
    },
    {
      label: 'Quote Approval',
      description: 'Customer review and project approval',
      icon: <CheckCircle />,
      status: 'in-progress',
      date: 'Pending',
      details: [
        'Quote under customer review',
        'Clarifications provided as needed',
        'Contract preparation ready',
        'Awaiting customer approval'
      ],
      actions: [
        { label: 'Review Quote', action: 'review-quote' },
        { label: 'Request Changes', action: 'request-changes' },
        { label: 'Approve Quote', action: 'approve-quote' }
      ]
    },
    {
      label: 'Production',
      description: 'Manufacturing and fabrication of building components',
      icon: <Build />,
      status: 'pending',
      date: 'TBD',
      details: [
        'Materials ordered and received',
        'Fabrication begins',
        'Quality control checkpoints',
        'Components prepared for delivery'
      ],
      actions: [
        { label: 'Production Schedule', action: 'production-schedule' },
        { label: 'Progress Photos', action: 'progress-photos' }
      ]
    },
    {
      label: 'Delivery & Installation',
      description: 'On-site delivery and professional installation',
      icon: <LocalShipping />,
      status: 'pending',
      date: 'TBD',
      details: [
        'Delivery scheduled',
        'Site preparation completed',
        'Professional installation',
        'Final inspection and approval'
      ],
      actions: [
        { label: 'Track Delivery', action: 'track-delivery' },
        { label: 'Installation Schedule', action: 'installation-schedule' }
      ]
    },
    {
      label: 'Project Completion',
      description: 'Final walkthrough and project handover',
      icon: <CheckCircle />,
      status: 'pending',
      date: 'TBD',
      details: [
        'Final walkthrough conducted',
        'All documentation provided',
        'Warranty information supplied',
        'Customer satisfaction confirmed'
      ],
      actions: [
        { label: 'Schedule Walkthrough', action: 'schedule-walkthrough' },
        { label: 'Warranty Info', action: 'warranty-info' }
      ]
    }
  ];

  const getStepStatus = (status: string) => {
    switch (status) {
      case 'completed': return { color: 'success' as const, variant: 'filled' as const };
      case 'in-progress': return { color: 'primary' as const, variant: 'filled' as const };
      case 'pending': return { color: 'grey' as const, variant: 'outlined' as const };
      default: return { color: 'grey' as const, variant: 'outlined' as const };
    }
  };

  const getStepIcon = (step: any, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle color="success" />;
    } else if (step.status === 'in-progress') {
      return step.icon;
    } else {
      return <Schedule color="disabled" />;
    }
  };

  const handleStepAction = (action: string, stepIndex: number) => {
    // Handle different actions based on the action type
    console.log(`Action: ${action} for step ${stepIndex}`);
    
    switch (action) {
      case 'view-quote':
        window.location.href = '/quotes';
        break;
      case 'approve-quote':
        // Open approval dialog
        break;
      case 'track-delivery':
        window.location.href = '/orders';
        break;
      default:
        console.log(`Unhandled action: ${action}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Project Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {projectData.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={projectData.type} color="primary" />
              <Chip label={projectData.status} color="info" />
            </Box>
            <Typography variant="body1" color="text.secondary">
              Started: {new Date(projectData.startDate).toLocaleDateString()} • 
              Est. Completion: {new Date(projectData.estimatedCompletion).toLocaleDateString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Sales Representative
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar src={projectData.salesRep.avatar} sx={{ mr: 2 }}>
                    {projectData.salesRep.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {projectData.salesRep.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sales Representative
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<Phone />}
                    href={`tel:${projectData.salesRep.phone}`}
                  >
                    Call
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Email />}
                    href={`mailto:${projectData.salesRep.email}`}
                  >
                    Email
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Current Status Alert */}
      {currentStage < workflowSteps.length && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            workflowSteps[currentStage].actions.length > 0 && (
              <Button 
                color="inherit" 
                size="small"
                onClick={() => handleStepAction(workflowSteps[currentStage].actions[0].action, currentStage)}
              >
                {workflowSteps[currentStage].actions[0].label}
              </Button>
            )
          }
        >
          <strong>Current Status:</strong> {workflowSteps[currentStage].description}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Workflow Timeline */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Timeline
            </Typography>
            
            <Timeline>
              {workflowSteps.map((step, index) => (
                <TimelineItem key={index}>
                  <TimelineOppositeContent
                    sx={{ m: 'auto 0' }}
                    align="right"
                    variant="body2"
                    color="text.secondary"
                  >
                    {step.date}
                  </TimelineOppositeContent>
                  
                  <TimelineSeparator>
                    <TimelineDot {...getStepStatus(step.status)}>
                      {getStepIcon(step, index)}
                    </TimelineDot>
                    {index < workflowSteps.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  
                  <TimelineContent sx={{ py: '12px', px: 2 }}>
                    <Card variant={step.status === 'in-progress' ? 'elevation' : 'outlined'}>
                      <CardContent>
                        <Typography variant="h6" component="span">
                          {step.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {step.description}
                        </Typography>
                        
                        <List dense>
                          {step.details.map((detail, detailIndex) => (
                            <ListItem key={detailIndex} sx={{ pl: 0 }}>
                              <ListItemIcon sx={{ minWidth: 24 }}>
                                {step.status === 'completed' ? (
                                  <CheckCircle color="success" fontSize="small" />
                                ) : (
                                  <Schedule color="disabled" fontSize="small" />
                                )}
                              </ListItemIcon>
                              <ListItemText 
                                primary={detail}
                                primaryTypographyProps={{ 
                                  variant: 'body2',
                                  color: step.status === 'completed' ? 'text.primary' : 'text.secondary'
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                        
                        {step.actions.length > 0 && (
                          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {step.actions.map((action, actionIndex) => (
                              <Button
                                key={actionIndex}
                                size="small"
                                variant={actionIndex === 0 ? 'contained' : 'outlined'}
                                onClick={() => handleStepAction(action.action, index)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Paper>
        </Grid>

        {/* Sidebar - Project Details and Actions */}
        <Grid item xs={12} lg={4}>
          {/* Quick Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Description />}
                onClick={() => window.location.href = `/projects/${projectId}/documents`}
              >
                View Documents
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PhotoCamera />}
                onClick={() => window.location.href = `/projects/${projectId}/photos`}
              >
                Project Photos
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Payment />}
                onClick={() => window.location.href = `/projects/${projectId}/payments`}
              >
                Payment Information
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Phone />}
                href={`tel:${projectData.salesRep.phone}`}
              >
                Call Sales Rep
              </Button>
            </Box>
          </Paper>

          {/* Project Milestones */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Milestones
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Schedule color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Quote Review Deadline"
                  secondary="February 1, 2025"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Build color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="Production Start"
                  secondary="February 15, 2025 (estimated)"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <LocalShipping color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="Delivery Window"
                  secondary="March 10-15, 2025 (estimated)"
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Need to discuss timeline changes? Contact your sales representative anytime.
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectWorkflow;
