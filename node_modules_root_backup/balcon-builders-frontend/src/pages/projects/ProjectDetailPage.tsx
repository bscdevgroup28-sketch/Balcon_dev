import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Avatar,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  AttachFile,
  Download,
  Person,
  LocationOn,
  Schedule,
  MonetizationOn,
  Assignment,
  Comment,
  Notifications,
  CheckCircle,
  RadioButtonUnchecked,
  Warning,
  Error,
  Info,
  LocalShipping,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

interface ProjectDetail {
  id: number;
  title: string;
  description: string;
  projectType: 'residential' | 'commercial' | 'industrial';
  status: 'inquiry' | 'in_progress' | 'design' | 'review' | 'approved' | 'in_production' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  buildingSize: number;
  estimatedValue: number;
  progress: number;
  startDate: string;
  targetCompletionDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  createdAt: string;
  updatedAt: string;
  specifications: {
    foundationType: string;
    roofType: string;
    wallMaterial: string;
    insulationType: string;
    specialRequirements: string;
  };
  timeline: Array<{
    id: number;
    title: string;
    description: string;
    date: string;
    status: 'completed' | 'in_progress' | 'pending' | 'delayed';
    type: 'milestone' | 'task' | 'review' | 'delivery';
  }>;
  files: Array<{
    id: number;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  comments: Array<{
    id: number;
    author: string;
    content: string;
    createdAt: string;
    type: 'general' | 'issue' | 'update';
  }>;
}

// Mock data
const mockProject: ProjectDetail = {
  id: 1,
  title: "Metal Warehouse Structure",
  description: "40x60 steel building for industrial storage with office space and loading dock",
  projectType: "industrial",
  status: "in_progress",
  priority: "high",
  location: "Austin, TX",
  buildingSize: 2400,
  estimatedValue: 85000,
  progress: 65,
  startDate: "2024-07-15",
  targetCompletionDate: "2024-09-30",
  customerName: "John Smith",
  customerEmail: "john.smith@smithindustries.com",
  customerPhone: "(555) 123-4567",
  customerCompany: "Smith Industries",
  createdAt: "2024-07-01",
  updatedAt: "2024-08-15",
  specifications: {
    foundationType: "Concrete Slab",
    roofType: "Standing Seam Metal",
    wallMaterial: "Insulated Metal Panels",
    insulationType: "R-19 Fiberglass",
    specialRequirements: "Overhead crane mounting points, 220V electrical, LED lighting system",
  },
  timeline: [
    {
      id: 1,
      title: "Initial Consultation",
      description: "Met with client to discuss requirements",
      date: "2024-07-01",
      status: "completed",
      type: "milestone",
    },
    {
      id: 2,
      title: "Site Survey",
      description: "Engineering team completed site measurements",
      date: "2024-07-10",
      status: "completed",
      type: "task",
    },
    {
      id: 3,
      title: "Design Phase",
      description: "Architectural drawings and engineering plans",
      date: "2024-07-20",
      status: "completed",
      type: "milestone",
    },
    {
      id: 4,
      title: "Permit Application",
      description: "Submitted building permits to city",
      date: "2024-08-01",
      status: "completed",
      type: "review",
    },
    {
      id: 5,
      title: "Foundation Work",
      description: "Concrete foundation and slab preparation",
      date: "2024-08-15",
      status: "in_progress",
      type: "task",
    },
    {
      id: 6,
      title: "Steel Delivery",
      description: "Primary steel structure delivery",
      date: "2024-09-01",
      status: "pending",
      type: "delivery",
    },
    {
      id: 7,
      title: "Roof Installation",
      description: "Standing seam metal roof system",
      date: "2024-09-15",
      status: "pending",
      type: "task",
    },
    {
      id: 8,
      title: "Final Inspection",
      description: "City inspection and project completion",
      date: "2024-09-30",
      status: "pending",
      type: "milestone",
    },
  ],
  files: [
    { id: 1, name: "Site_Survey.pdf", type: "pdf", size: 2048000, uploadedAt: "2024-07-10", uploadedBy: "Engineering Team" },
    { id: 2, name: "Building_Plans.dwg", type: "dwg", size: 5120000, uploadedAt: "2024-07-20", uploadedBy: "Design Team" },
    { id: 3, name: "Permit_Application.pdf", type: "pdf", size: 1024000, uploadedAt: "2024-08-01", uploadedBy: "Admin" },
    { id: 4, name: "Foundation_Photos.zip", type: "zip", size: 15360000, uploadedAt: "2024-08-15", uploadedBy: "Site Manager" },
  ],
  comments: [
    {
      id: 1,
      author: "John Smith",
      content: "Looking forward to getting started on this project. The timeline looks good.",
      createdAt: "2024-07-02",
      type: "general",
    },
    {
      id: 2,
      author: "Project Manager",
      content: "Permits have been approved. Foundation work can begin as scheduled.",
      createdAt: "2024-08-05",
      type: "update",
    },
    {
      id: 3,
      author: "Site Supervisor",
      content: "Foundation work is progressing well. Weather has been cooperative.",
      createdAt: "2024-08-18",
      type: "update",
    },
  ],
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // In a real app, fetch project by ID
    setProject(mockProject);
  }, [id]);

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading project...</Typography>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'pending': return 'default';
      case 'delayed': return 'error';
      default: return 'default';
    }
  };

  const getTimelineIcon = (type: string, status: string) => {
    if (status === 'completed') return <CheckCircle />;
    if (status === 'in_progress') return <RadioButtonUnchecked color="primary" />;
    if (status === 'delayed') return <Error color="error" />;
    
    switch (type) {
      case 'milestone': return <Assignment />;
      case 'review': return <Info />;
      case 'delivery': return <LocalShipping />;
      default: return <RadioButtonUnchecked />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleStatusUpdate = () => {
    // Update project status
    setProject(prev => prev ? { ...prev, status: newStatus as any } : null);
    setStatusUpdateOpen(false);
    setNewStatus('');
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        author: "Current User",
        content: newComment,
        createdAt: new Date().toISOString(),
        type: "general" as const,
      };
      setProject(prev => prev ? {
        ...prev,
        comments: [...prev.comments, comment]
      } : null);
      setNewComment('');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" onClick={() => navigate('/projects')} sx={{ cursor: 'pointer' }}>
          Projects
        </Link>
        <Typography color="text.primary">{project.title}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/projects')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              {project.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={project.status.replace('_', ' ')} color="primary" />
              <Chip label={project.priority} color="warning" variant="outlined" />
              <Chip label={project.projectType} variant="outlined" />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/projects/${project.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            onClick={() => setStatusUpdateOpen(true)}
          >
            Update Status
          </Button>
        </Box>
      </Box>

      {/* Project Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Person sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Customer</Typography>
              </Box>
              <Typography variant="body1">{project.customerName}</Typography>
              {project.customerCompany && (
                <Typography variant="body2" color="text.secondary">
                  {project.customerCompany}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                {project.customerEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {project.customerPhone}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Location</Typography>
              </Box>
              <Typography variant="body1">{project.location}</Typography>
              <Typography variant="body2" color="text.secondary">
                {project.buildingSize.toLocaleString()} sq ft
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Timeline</Typography>
              </Box>
              <Typography variant="body1">
                {new Date(project.startDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                to {new Date(project.targetCompletionDate).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MonetizationOn sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Value</Typography>
              </Box>
              <Typography variant="body1">
                ${project.estimatedValue.toLocaleString()}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress: {project.progress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={project.progress}
                  sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Timeline" />
          <Tab label="Files" />
          <Tab label="Comments" />
        </Tabs>

        <CardContent>
          {/* Overview Tab */}
          {currentTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Project Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {project.description}
                </Typography>

                <Typography variant="h6" gutterBottom>
                  Specifications
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Foundation Type"
                      secondary={project.specifications.foundationType}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Roof Type"
                      secondary={project.specifications.roofType}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Wall Material"
                      secondary={project.specifications.wallMaterial}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Insulation"
                      secondary={project.specifications.insulationType}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Special Requirements
                </Typography>
                <Typography variant="body1" paragraph>
                  {project.specifications.specialRequirements}
                </Typography>

                <Typography variant="h6" gutterBottom>
                  Project Dates
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Created"
                      secondary={new Date(project.createdAt).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Start Date"
                      secondary={new Date(project.startDate).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Target Completion"
                      secondary={new Date(project.targetCompletionDate).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Updated"
                      secondary={new Date(project.updatedAt).toLocaleDateString()}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}

          {/* Timeline Tab */}
          {currentTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Project Timeline
              </Typography>
              <Stack spacing={3}>
                {project.timeline.map((item, index) => (
                  <Paper key={item.id} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ mr: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: item.status === 'completed' ? 'success.main' :
                                    item.status === 'in_progress' ? 'primary.main' :
                                    item.status === 'delayed' ? 'error.main' : 'grey.300',
                            color: 'white',
                          }}
                        >
                          {item.status === 'completed' ? <CheckCircle /> :
                           item.status === 'in_progress' ? <RadioButtonUnchecked /> :
                           item.status === 'delayed' ? <Error /> :
                           item.type === 'milestone' ? <Assignment /> :
                           item.type === 'review' ? <Info /> :
                           item.type === 'delivery' ? <LocalShipping /> :
                           <RadioButtonUnchecked />}
                        </Box>
                        {index < project.timeline.length - 1 && (
                          <Box
                            sx={{
                              width: 2,
                              height: 40,
                              bgcolor: 'grey.300',
                              mt: 1,
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6">
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="body1" paragraph>
                          {item.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            label={item.status.replace('_', ' ')}
                            color={getStatusColor(item.status) as any}
                            size="small"
                          />
                          <Chip
                            label={item.type}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* Files Tab */}
          {currentTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Project Files
              </Typography>
              <List>
                {project.files.map((file) => (
                  <ListItem key={file.id}>
                    <ListItemIcon>
                      <AttachFile />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${formatFileSize(file.size)} • Uploaded ${new Date(file.uploadedAt).toLocaleDateString()} by ${file.uploadedBy}`}
                    />
                    <Tooltip title="Download">
                      <IconButton edge="end">
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Comments Tab */}
          {currentTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Project Comments
              </Typography>
              
              {/* Add Comment */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </Button>
              </Paper>

              {/* Comments List */}
              {project.comments.map((comment, index) => (
                <Box key={comment.id}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {comment.author.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ mr: 2 }}>
                          {comment.author}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </Typography>
                        <Chip
                          label={comment.type}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      <Typography variant="body1">
                        {comment.content}
                      </Typography>
                    </Box>
                  </Box>
                  {index < project.comments.length - 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onClose={() => setStatusUpdateOpen(false)}>
        <DialogTitle>Update Project Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="New Status"
            >
              <MenuItem value="inquiry">Inquiry</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="design">Design</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="in_production">In Production</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetailPage;
