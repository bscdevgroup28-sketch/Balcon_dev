import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Edit,
  Delete,
  ShoppingCart,
  Compare,
  AttachMoney,
  Inventory,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';

import { Material } from '../../types/material';

interface MaterialCardProps {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  onStockAdjust: (material: Material) => void;
  onCompare?: (materialId: string) => void;
  onRequestQuote?: (materialId: string) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onEdit,
  onDelete,
  onStockAdjust,
  onCompare,
  onRequestQuote,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const getStockStatusColor = () => {
    if (material.currentStock <= material.reorderPoint) return 'error';
    if (material.currentStock <= material.minimumStock) return 'warning';
    return 'success';
  };

  const getStockStatusIcon = () => {
    if (material.currentStock <= material.reorderPoint) return <Error />;
    if (material.currentStock <= material.minimumStock) return <Warning />;
    return <CheckCircle />;
  };

  const getStockStatusText = () => {
    if (material.currentStock <= material.reorderPoint) return 'Critical';
    if (material.currentStock <= material.minimumStock) return 'Low';
    return 'Normal';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              <Inventory />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {material.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {material.category}
              </Typography>
            </Box>
            <Chip
              label={material.status}
              color={material.status === 'active' ? 'success' : 'default'}
              size="small"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Stock
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStockStatusIcon()}
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {material.currentStock} {material.unitOfMeasure}
              </Typography>
              <Chip
                label={getStockStatusText()}
                color={getStockStatusColor() as any}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Min Stock:
            </Typography>
            <Typography variant="body2">
              {material.minimumStock} {material.unitOfMeasure}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Reorder Point:
            </Typography>
            <Typography variant="body2">
              {material.reorderPoint} {material.unitOfMeasure}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Unit Cost:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(material.unitCost)}
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Tooltip title="Edit Material">
              <IconButton size="small" onClick={() => onEdit(material)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Material">
              <IconButton size="small" onClick={() => onDelete(material)}>
                <Delete />
              </IconButton>
            </Tooltip>
            <Tooltip title="Adjust Stock">
              <IconButton size="small" onClick={() => onStockAdjust(material)}>
                <Inventory />
              </IconButton>
            </Tooltip>
          </Box>
          <Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ShoppingCart />}
              onClick={() => setShowDetails(true)}
            >
              Details
            </Button>
          </Box>
        </CardActions>
      </Card>

      {/* Material Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Inventory />
            </Avatar>
            <Box>
              <Typography variant="h6">{material.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {material.category}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" paragraph>
            {material.description || 'No description available.'}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Stock Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Current Stock:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {material.currentStock} {material.unitOfMeasure}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Minimum Stock:</Typography>
                  <Typography variant="body2">
                    {material.minimumStock} {material.unitOfMeasure}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Reorder Point:</Typography>
                  <Typography variant="body2">
                    {material.reorderPoint} {material.unitOfMeasure}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Pricing Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Unit Cost:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(material.unitCost)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Selling Price:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(material.sellingPrice)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Markup:</Typography>
                  <Typography variant="body2">
                    {material.markupPercentage}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
          {onCompare && (
            <Button variant="outlined" startIcon={<Compare />} onClick={() => onCompare(material.id.toString())}>
              Add to Compare
            </Button>
          )}
          {onRequestQuote && (
            <Button variant="contained" startIcon={<AttachMoney />} onClick={() => onRequestQuote(material.id.toString())}>
              Request Quote
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MaterialCard;