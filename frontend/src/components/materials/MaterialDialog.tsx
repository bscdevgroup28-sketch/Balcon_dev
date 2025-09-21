import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Material, CreateMaterialData, UpdateMaterialData } from '../../types/material';
import { integratedAPI } from '../../services/integratedAPI';

interface MaterialDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  material?: Material | null; // If provided, it's edit mode
}

const UNIT_OF_MEASURE_OPTIONS = [
  'sqft',
  'linear_ft',
  'pieces',
  'gallons',
  'lbs',
  'tons',
  'cubic_ft',
  'cubic_yd',
  'boxes',
  'rolls',
  'sheets',
  'bars',
  'tubes',
  'each',
  'pack',
  'case',
  'pallet',
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'discontinued', label: 'Discontinued' },
];

const MaterialDialog: React.FC<MaterialDialogProps> = ({
  open,
  onClose,
  onSubmit,
  material = null,
}) => {
  const isEdit = Boolean(material);

  const [formData, setFormData] = useState<CreateMaterialData>({
    name: '',
    description: '',
    category: '',
    unitOfMeasure: 'each',
    currentStock: 0,
    minimumStock: 0,
    reorderPoint: 0,
    unitCost: 0,
    markupPercentage: 0,
    sellingPrice: 0,
    supplierName: '',
    supplierContact: '',
    supplierEmail: '',
    leadTimeDays: 7,
    location: '',
    status: 'active',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadCategories();

      if (isEdit && material) {
        // Populate form with existing material data
        setFormData({
          name: material.name,
          description: material.description || '',
          category: material.category,
          unitOfMeasure: material.unitOfMeasure,
          currentStock: material.currentStock,
          minimumStock: material.minimumStock,
          reorderPoint: material.reorderPoint,
          unitCost: material.unitCost,
          markupPercentage: material.markupPercentage,
          sellingPrice: material.sellingPrice,
          supplierName: material.supplierName || '',
          supplierContact: material.supplierContact || '',
          supplierEmail: material.supplierEmail || '',
          leadTimeDays: material.leadTimeDays,
          location: material.location || '',
          status: material.status,
          notes: material.notes || '',
        });
      } else {
        // Reset form for new material
        setFormData({
          name: '',
          description: '',
          category: '',
          unitOfMeasure: 'each',
          currentStock: 0,
          minimumStock: 0,
          reorderPoint: 0,
          unitCost: 0,
          markupPercentage: 0,
          sellingPrice: 0,
          supplierName: '',
          supplierContact: '',
          supplierEmail: '',
          leadTimeDays: 7,
          location: '',
          status: 'active',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [open, material, isEdit]);

  const loadCategories = async () => {
    try {
      const response = await integratedAPI.getMaterialCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleInputChange = (field: keyof CreateMaterialData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-calculate selling price when unit cost or markup changes
    if (field === 'unitCost' || field === 'markupPercentage') {
      const unitCost = field === 'unitCost' ? value : formData.unitCost;
      const markupPercentage = field === 'markupPercentage' ? value : formData.markupPercentage;

      if (unitCost && markupPercentage) {
        const sellingPrice = unitCost * (1 + markupPercentage / 100);
        setFormData(prev => ({ ...prev, sellingPrice: Math.round(sellingPrice * 100) / 100 }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Material name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.unitOfMeasure.trim()) {
      newErrors.unitOfMeasure = 'Unit of measure is required';
    }

    if (formData.unitCost < 0) {
      newErrors.unitCost = 'Unit cost cannot be negative';
    }

    if (formData.sellingPrice !== undefined && formData.sellingPrice < 0) {
      newErrors.sellingPrice = 'Selling price cannot be negative';
    }

    if (formData.currentStock !== undefined && formData.currentStock < 0) {
      newErrors.currentStock = 'Current stock cannot be negative';
    }

    if (formData.minimumStock !== undefined && formData.minimumStock < 0) {
      newErrors.minimumStock = 'Minimum stock cannot be negative';
    }

    if (formData.reorderPoint !== undefined && formData.reorderPoint < 0) {
      newErrors.reorderPoint = 'Reorder point cannot be negative';
    }

    if (formData.leadTimeDays !== undefined && formData.leadTimeDays < 0) {
      newErrors.leadTimeDays = 'Lead time cannot be negative';
    }

    if (formData.supplierEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supplierEmail)) {
      newErrors.supplierEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let response;
      if (isEdit && material) {
        const updateData: UpdateMaterialData = { ...formData, id: material.id };
        response = await integratedAPI.updateMaterial(material.id.toString(), updateData);
      } else {
        response = await integratedAPI.createMaterial(formData);
      }

      if (response.success) {
        onSubmit();
        onClose();
      } else {
        setErrors({ submit: response.error || 'Failed to save material' });
      }
    } catch (err) {
      setErrors({ submit: 'Failed to save material' });
      console.error('Error saving material:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Material' : 'Add New Material'}
      </DialogTitle>
      <DialogContent>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Box component="form" sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Material Name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                error={Boolean(errors.name)}
                helperText={errors.name}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required error={Boolean(errors.category)}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e: React.ChangeEvent<{ value: unknown }>) => handleInputChange('category', e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                  <MenuItem value="new">+ Add New Category</MenuItem>
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {errors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('description', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={Boolean(errors.unitOfMeasure)}>
                <InputLabel>Unit of Measure</InputLabel>
                <Select
                  value={formData.unitOfMeasure}
                  label="Unit of Measure"
                  onChange={(e: React.ChangeEvent<{ value: unknown }>) => handleInputChange('unitOfMeasure', e.target.value)}
                >
                  {UNIT_OF_MEASURE_OPTIONS.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
                {errors.unitOfMeasure && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {errors.unitOfMeasure}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={Boolean(errors.status)}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e: React.ChangeEvent<{ value: unknown }>) => handleInputChange('status', e.target.value)}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.status && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {errors.status}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Inventory Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Inventory Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Current Stock"
                type="number"
                value={formData.currentStock}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('currentStock', parseFloat(e.target.value) || 0)}
                error={Boolean(errors.currentStock)}
                helperText={errors.currentStock}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Minimum Stock"
                type="number"
                value={formData.minimumStock}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('minimumStock', parseFloat(e.target.value) || 0)}
                error={Boolean(errors.minimumStock)}
                helperText={errors.minimumStock}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Reorder Point"
                type="number"
                value={formData.reorderPoint}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('reorderPoint', parseFloat(e.target.value) || 0)}
                error={Boolean(errors.reorderPoint)}
                helperText={errors.reorderPoint}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Pricing Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Pricing Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unit Cost"
                type="number"
                value={formData.unitCost}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('unitCost', parseFloat(e.target.value) || 0)}
                error={Boolean(errors.unitCost)}
                helperText={errors.unitCost}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Markup %"
                type="number"
                value={formData.markupPercentage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('markupPercentage', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Selling Price"
                type="number"
                value={formData.sellingPrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                error={Boolean(errors.sellingPrice)}
                helperText={errors.sellingPrice}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>

            {/* Supplier Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Supplier Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={formData.supplierName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('supplierName', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Contact"
                value={formData.supplierContact}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('supplierContact', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Email"
                type="email"
                value={formData.supplierEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('supplierEmail', e.target.value)}
                error={Boolean(errors.supplierEmail)}
                helperText={errors.supplierEmail}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lead Time (Days)"
                type="number"
                value={formData.leadTimeDays}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('leadTimeDays', parseInt(e.target.value) || 7)}
                error={Boolean(errors.leadTimeDays)}
                helperText={errors.leadTimeDays}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Additional Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Additional Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('location', e.target.value)}
                placeholder="Warehouse location or storage area"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('notes', e.target.value)}
                multiline
                rows={3}
                placeholder="Additional notes or specifications"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : (isEdit ? 'Update Material' : 'Create Material')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialDialog;