import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Alert,
  Rating,
  Badge,
} from '@mui/material';
import {
  Info,
  Favorite,
  FavoriteBorder,
  Compare,
  Download,
  CheckCircle,
  Build,
  Security,
  Speed,
  Nature,
  AttachMoney,
  Star,
  Visibility,
} from '@mui/icons-material';

interface MaterialSpecification {
  property: string;
  value: string;
  description?: string;
}

interface Material {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  image: string;
  pricePerUnit: number;
  unit: string;
  availability: 'in-stock' | 'limited' | 'out-of-stock' | 'custom-order';
  leadTime: string;
  specifications: MaterialSpecification[];
  features: string[];
  applications: string[];
  advantages: string[];
  certifications: string[];
  sustainability: {
    rating: number;
    description: string;
  };
  performance: {
    durability: number;
    maintenance: number;
    weatherResistance: number;
    fireResistance: number;
  };
  documents: {
    name: string;
    type: 'datasheet' | 'specification' | 'installation' | 'warranty';
    url: string;
  }[];
  relatedProducts: string[];
  customerRating: number;
  reviewCount: number;
}

interface MaterialCardProps {
  material: Material;
  onViewDetails: (materialId: string) => void;
  onAddToFavorites: (materialId: string) => void;
  onCompare: (materialId: string) => void;
  onRequestQuote: (materialId: string) => void;
  isFavorite?: boolean;
  isInComparison?: boolean;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onViewDetails,
  onAddToFavorites,
  onCompare,
  onRequestQuote,
  isFavorite = false,
  isInComparison = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in-stock': return 'success';
      case 'limited': return 'warning';
      case 'out-of-stock': return 'error';
      case 'custom-order': return 'info';
      default: return 'default';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'in-stock': return 'In Stock';
      case 'limited': return 'Limited Stock';
      case 'out-of-stock': return 'Out of Stock';
      case 'custom-order': return 'Custom Order';
      default: return 'Unknown';
    }
  };

  const PerformanceBar: React.FC<{ label: string; value: number; color?: string }> = ({ 
    label, 
    value, 
    color = 'primary' 
  }) => (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="caption">{value}/5</Typography>
      </Box>
      <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 5, height: 8 }}>
        <Box
          sx={{
            width: `${(value / 5) * 100}%`,
            bgcolor: `${color}.main`,
            borderRadius: 5,
            height: 8,
          }}
        />
      </Box>
    </Box>
  );

  return (
    <>
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        '&:hover': { boxShadow: 3 }
      }}>
        {/* Favorite and Compare Badges */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {isFavorite && (
              <Chip
                icon={<Favorite />}
                label="Favorite"
                size="small"
                color="error"
                variant="filled"
              />
            )}
            {isInComparison && (
              <Badge badgeContent="✓" color="primary">
                <Chip
                  icon={<Compare />}
                  label="Compare"
                  size="small"
                  color="info"
                  variant="filled"
                />
              </Badge>
            )}
          </Box>
        </Box>

        <CardMedia
          component="img"
          height="200"
          image={material.image || '/placeholder-material.jpg'}
          alt={material.name}
          sx={{ objectFit: 'cover' }}
        />
        
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" component="div" noWrap>
              {material.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {material.category} • {material.subcategory}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip 
                label={getAvailabilityText(material.availability)}
                size="small"
                color={getAvailabilityColor(material.availability) as any}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Rating value={material.customerRating} size="small" readOnly />
                <Typography variant="caption" color="text.secondary">
                  ({material.reviewCount})
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Description */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
            {material.description}
          </Typography>

          {/* Key Features */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Key Features:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {material.features.slice(0, 3).map((feature, index) => (
                <Chip key={index} label={feature} size="small" variant="outlined" />
              ))}
              {material.features.length > 3 && (
                <Chip label={`+${material.features.length - 3} more`} size="small" variant="outlined" />
              )}
            </Box>
          </Box>

          {/* Performance Indicators */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Performance:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Security fontSize="small" color="primary" />
                  <Typography variant="caption">Durability</Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {material.performance.durability}/5
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Nature fontSize="small" color="success" />
                  <Typography variant="caption">Eco-Rating</Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {material.sustainability.rating}/5
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Pricing */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" color="primary" fontWeight="bold">
              ${material.pricePerUnit.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>per {material.unit}</span>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lead time: {material.leadTime}
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Visibility />}
              onClick={() => setShowDetails(true)}
              sx={{ flex: 1 }}
            >
              Details
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={isFavorite ? <Favorite /> : <FavoriteBorder />}
              onClick={() => onAddToFavorites(material.id)}
              color={isFavorite ? 'error' : 'inherit'}
            >
              {isFavorite ? 'Saved' : 'Save'}
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<Compare />}
              onClick={() => onCompare(material.id)}
              color={isInComparison ? 'primary' : 'inherit'}
            >
              Compare
            </Button>
          </Box>

          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={<AttachMoney />}
            onClick={() => onRequestQuote(material.id)}
            sx={{ mt: 1 }}
          >
            Request Quote
          </Button>
        </CardContent>
      </Card>

      {/* Material Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {material.name}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={getAvailabilityText(material.availability)}
                size="small"
                color={getAvailabilityColor(material.availability) as any}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Rating value={material.customerRating} size="small" readOnly />
                <Typography variant="body2">({material.reviewCount} reviews)</Typography>
              </Box>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            {/* Image and Basic Info */}
            <Grid item xs={12} md={4}>
              <CardMedia
                component="img"
                height="300"
                image={material.image || '/placeholder-material.jpg'}
                alt={material.name}
                sx={{ borderRadius: 1, mb: 2 }}
              />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  ${material.pricePerUnit.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  per {material.unit} • Lead time: {material.leadTime}
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                Contact our sales team for volume pricing and custom specifications.
              </Alert>

              <Button
                variant="contained"
                fullWidth
                startIcon={<AttachMoney />}
                onClick={() => onRequestQuote(material.id)}
                sx={{ mb: 1 }}
              >
                Request Quote
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={isFavorite ? <Favorite /> : <FavoriteBorder />}
                onClick={() => onAddToFavorites(material.id)}
                color={isFavorite ? 'error' : 'inherit'}
              >
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Button>
            </Grid>

            {/* Detailed Information */}
            <Grid item xs={12} md={8}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                  <Tab label="Overview" />
                  <Tab label="Specifications" />
                  <Tab label="Performance" />
                  <Tab label="Documents" />
                </Tabs>
              </Box>

              {/* Overview Tab */}
              {activeTab === 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Description</Typography>
                  <Typography paragraph>{material.description}</Typography>

                  <Typography variant="h6" gutterBottom>Key Features</Typography>
                  <List dense>
                    {material.features.map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6" gutterBottom>Applications</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {material.applications.map((app, index) => (
                      <Chip key={index} label={app} variant="outlined" />
                    ))}
                  </Box>

                  <Typography variant="h6" gutterBottom>Advantages</Typography>
                  <List dense>
                    {material.advantages.map((advantage, index) => (
                      <ListItem key={index}>
                        <ListItemIcon><Star color="primary" /></ListItemIcon>
                        <ListItemText primary={advantage} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Specifications Tab */}
              {activeTab === 1 && (
                <Box sx={{ mt: 3 }}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Property</strong></TableCell>
                          <TableCell><strong>Value</strong></TableCell>
                          <TableCell><strong>Description</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {material.specifications.map((spec, index) => (
                          <TableRow key={index}>
                            <TableCell>{spec.property}</TableCell>
                            <TableCell>{spec.value}</TableCell>
                            <TableCell>{spec.description || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {material.certifications.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>Certifications</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {material.certifications.map((cert, index) => (
                          <Chip key={index} label={cert} color="success" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Performance Tab */}
              {activeTab === 2 && (
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                      <PerformanceBar label="Durability" value={material.performance.durability} />
                      <PerformanceBar label="Low Maintenance" value={material.performance.maintenance} color="success" />
                      <PerformanceBar label="Weather Resistance" value={material.performance.weatherResistance} color="info" />
                      <PerformanceBar label="Fire Resistance" value={material.performance.fireResistance} color="warning" />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Sustainability</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Nature color="success" />
                        <Typography variant="h5" color="success.main">
                          {material.sustainability.rating}/5
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Eco Rating
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {material.sustainability.description}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Documents Tab */}
              {activeTab === 3 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Available Documents</Typography>
                  <List>
                    {material.documents.map((doc, index) => (
                      <ListItem key={index}>
                        <ListItemIcon><Download /></ListItemIcon>
                        <ListItemText 
                          primary={doc.name}
                          secondary={doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Download />}
                          href={doc.url}
                          target="_blank"
                        >
                          Download
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Compare />} onClick={() => onCompare(material.id)}>
            Add to Compare
          </Button>
          <Button variant="contained" startIcon={<AttachMoney />} onClick={() => onRequestQuote(material.id)}>
            Request Quote
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MaterialCard;
