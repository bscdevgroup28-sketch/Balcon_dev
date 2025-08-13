import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  AttachFile,
  CheckCircle,
  Build,
  LocationOn,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

interface ProjectFormData {
  // Basic Information
  title: string;
  description: string;
  projectType: 'residential' | 'commercial' | 'industrial' | '';
  priority: 'low' | 'medium' | 'high' | 'urgent' | '';
  
  // Location & Specifications
  location: string;
  buildingSize: string;
  buildingType: string;
  foundationType: string;
  
  // Timeline & Budget
  startDate: string;
  targetCompletionDate: string;
  estimatedValue: string;
  timeline: string;
  
  // Requirements
  specialRequirements: string;
  accessRequirements: string;
  permitRequirements: string;
  
  // Files
  uploadedFiles: File[];
}

const steps = [
  'Basic Information',
  'Project Specifications',
  'Timeline & Budget',
  'Requirements & Files',
  'Review & Submit'
];

const ProjectWizard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    projectType: '',
    priority: '',
    location: '',
    buildingSize: '',
    buildingType: '',
    foundationType: '',
    startDate: '',
    targetCompletionDate: '',
    estimatedValue: '',
    timeline: '',
    specialRequirements: '',
    accessRequirements: '',
    permitRequirements: '',
    uploadedFiles: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    try {
      // Here we would submit to the API
      console.log('Submitting project:', formData);
      // dispatch(createProject(formData));
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.projectType) newErrors.projectType = 'Project type is required';
        if (!formData.priority) newErrors.priority = 'Priority is required';
        break;
      case 1: // Project Specifications
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.buildingSize.trim()) newErrors.buildingSize = 'Building size is required';
        break;
      case 2: // Timeline & Budget
        if (!formData.timeline) newErrors.timeline = 'Timeline is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                placeholder="e.g., Metal Warehouse Building"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Project Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide a detailed description of your project..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.projectType}>
                <InputLabel>Project Type</InputLabel>
                <Select
                  value={formData.projectType}
                  onChange={(e) => handleInputChange('projectType', e.target.value)}
                  label="Project Type"
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                  <MenuItem value="industrial">Industrial</MenuItem>
                </Select>
                {errors.projectType && <FormHelperText>{errors.projectType}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.priority}>
                <InputLabel>Priority Level</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  label="Priority Level"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
                {errors.priority && <FormHelperText>{errors.priority}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                error={!!errors.location}
                helperText={errors.location}
                placeholder="City, State or Full Address"
                InputProps={{
                  startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Building Size (sq ft)"
                value={formData.buildingSize}
                onChange={(e) => handleInputChange('buildingSize', e.target.value)}
                error={!!errors.buildingSize}
                helperText={errors.buildingSize}
                placeholder="e.g., 5000"
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Building Type"
                value={formData.buildingType}
                onChange={(e) => handleInputChange('buildingType', e.target.value)}
                placeholder="e.g., Warehouse, Garage, Workshop"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Foundation Type</InputLabel>
                <Select
                  value={formData.foundationType}
                  onChange={(e) => handleInputChange('foundationType', e.target.value)}
                  label="Foundation Type"
                >
                  <MenuItem value="concrete_slab">Concrete Slab</MenuItem>
                  <MenuItem value="pier_beam">Pier & Beam</MenuItem>
                  <MenuItem value="stem_wall">Stem Wall</MenuItem>
                  <MenuItem value="full_basement">Full Basement</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Preferred Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Completion Date"
                type="date"
                value={formData.targetCompletionDate}
                onChange={(e) => handleInputChange('targetCompletionDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.timeline}>
                <InputLabel>Project Timeline</InputLabel>
                <Select
                  value={formData.timeline}
                  onChange={(e) => handleInputChange('timeline', e.target.value)}
                  label="Project Timeline"
                >
                  <MenuItem value="asap">ASAP</MenuItem>
                  <MenuItem value="1_month">Within 1 Month</MenuItem>
                  <MenuItem value="3_months">Within 3 Months</MenuItem>
                  <MenuItem value="6_months">Within 6 Months</MenuItem>
                  <MenuItem value="1_year">Within 1 Year</MenuItem>
                  <MenuItem value="flexible">Flexible</MenuItem>
                </Select>
                {errors.timeline && <FormHelperText>{errors.timeline}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estimated Budget"
                value={formData.estimatedValue}
                onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                placeholder="Optional"
                type="number"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Special Requirements"
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                placeholder="Any special design requirements, equipment needs, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Site Access Requirements"
                value={formData.accessRequirements}
                onChange={(e) => handleInputChange('accessRequirements', e.target.value)}
                placeholder="Site access limitations, utility requirements, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Permit Requirements"
                value={formData.permitRequirements}
                onChange={(e) => handleInputChange('permitRequirements', e.target.value)}
                placeholder="Known permit requirements or restrictions"
              />
            </Grid>
            
            {/* File Upload Section */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, border: '2px dashed #ccc', borderColor: 'primary.light', bgcolor: 'grey.50' }}>
                <Box textAlign="center">
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom color="primary">
                    Upload Project Files
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Upload blueprints, photos, specifications, or other relevant documents
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Supported formats: PDF, JPG, PNG, DWG, DOC, DOCX (Max 10MB each)
                    </Typography>
                  </Box>
                  <input
                    accept=".pdf,.jpg,.jpeg,.png,.dwg,.doc,.docx"
                    style={{ display: 'none' }}
                    id="file-upload"
                    multiple
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload">
                    <Button 
                      variant="contained" 
                      component="span" 
                      startIcon={<AttachFile />}
                      sx={{ mb: 1 }}
                    >
                      Choose Files
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" color="text.secondary">
                    or drag and drop files here
                  </Typography>
                </Box>
                
                {formData.uploadedFiles.length > 0 && (
                  <List sx={{ mt: 2 }}>
                    {formData.uploadedFiles.map((file, index) => (
                      <ListItem key={index} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                        <ListItemIcon>
                          <AttachFile />
                        </ListItemIcon>
                        <ListItemText 
                          primary={file.name}
                          secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        />
                        <IconButton onClick={() => removeFile(index)} color="error">
                          <Delete />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your project information before submitting.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Typography><strong>Title:</strong> {formData.title}</Typography>
                    <Typography><strong>Type:</strong> {formData.projectType}</Typography>
                    <Typography><strong>Priority:</strong> {formData.priority}</Typography>
                    <Typography><strong>Description:</strong> {formData.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Specifications
                    </Typography>
                    <Typography><strong>Location:</strong> {formData.location}</Typography>
                    <Typography><strong>Size:</strong> {formData.buildingSize} sq ft</Typography>
                    <Typography><strong>Building Type:</strong> {formData.buildingType}</Typography>
                    <Typography><strong>Foundation:</strong> {formData.foundationType}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Timeline & Files
                    </Typography>
                    <Typography><strong>Timeline:</strong> {formData.timeline}</Typography>
                    <Typography><strong>Start Date:</strong> {formData.startDate}</Typography>
                    <Typography><strong>Budget:</strong> ${formData.estimatedValue}</Typography>
                    <Typography><strong>Files:</strong> {formData.uploadedFiles.length} uploaded</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create New Project
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            <Button
              onClick={() => navigate('/projects')}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                startIcon={<CheckCircle />}
              >
                Submit Project
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProjectWizard;
