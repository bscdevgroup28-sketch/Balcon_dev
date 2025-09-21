import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Grid,
  Divider,
} from '@mui/material';
import { Material } from '../../types/material';
import { integratedAPI } from '../../services/integratedAPI';

interface StockAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  material: Material | null;
}

const StockAdjustmentDialog: React.FC<StockAdjustmentDialogProps> = ({
  open,
  onClose,
  onSubmit,
  material,
}) => {
  const [adjustment, setAdjustment] = useState<number>(0);
  const [newStock, setNewStock] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && material) {
      setAdjustment(0);
      setNewStock(material.currentStock);
      setNotes('');
      setErrors({});
    }
  }, [open, material]);

  const handleAdjustmentChange = (value: number) => {
    if (!material) return;

    const adjustedStock = material.currentStock + value;
    setAdjustment(value);
    setNewStock(adjustedStock);

    // Clear errors
    if (errors.adjustment) {
      setErrors(prev => ({ ...prev, adjustment: '' }));
    }
  };

  const handleNewStockChange = (value: number) => {
    if (!material) return;

    const adjustment = value - material.currentStock;
    setNewStock(value);
    setAdjustment(adjustment);

    // Clear errors
    if (errors.newStock) {
      setErrors(prev => ({ ...prev, newStock: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (newStock < 0) {
      newErrors.newStock = 'Stock level cannot be negative';
    }

    if (!notes.trim() && Math.abs(adjustment) > 0) {
      newErrors.notes = 'Please provide a reason for this stock adjustment';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!material || !validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const stockData = {
        currentStock: newStock,
        adjustment,
        notes: notes.trim(),
      };

      const response = await integratedAPI.updateMaterialStock(material.id.toString(), stockData);

      if (response.success) {
        onSubmit();
        onClose();
      } else {
        setErrors({ submit: response.error || 'Failed to update stock' });
      }
    } catch (err) {
      setErrors({ submit: 'Failed to update stock' });
      console.error('Error updating stock:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAdjustmentType = () => {
    if (adjustment > 0) return 'increase';
    if (adjustment < 0) return 'decrease';
    return 'no change';
  };

  const getAdjustmentColor = () => {
    if (adjustment > 0) return 'success.main';
    if (adjustment < 0) return 'error.main';
    return 'text.secondary';
  };

  if (!material) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Adjust Stock - {material.name}
      </DialogTitle>
      <DialogContent>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Current Stock Level
          </Typography>
          <Typography variant="h6">
            {material.currentStock} {material.unitOfMeasure}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Adjustment Amount"
              type="number"
              value={adjustment}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAdjustmentChange(parseFloat(e.target.value) || 0)}
              error={Boolean(errors.adjustment)}
              helperText={errors.adjustment}
              inputProps={{ step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="New Stock Level"
              type="number"
              value={newStock}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNewStockChange(parseFloat(e.target.value) || 0)}
              error={Boolean(errors.newStock)}
              helperText={errors.newStock}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Adjustment Summary
          </Typography>
          <Typography variant="body1">
            This will <strong style={{ color: getAdjustmentColor() }}>
              {getAdjustmentType()}
            </strong> the stock by{' '}
            <strong style={{ color: getAdjustmentColor() }}>
              {Math.abs(adjustment)} {material.unitOfMeasure}
            </strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            New stock level: <strong>{newStock} {material.unitOfMeasure}</strong>
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Notes/Reason"
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
          error={Boolean(errors.notes)}
          helperText={errors.notes}
          multiline
          rows={3}
          sx={{ mt: 2 }}
          placeholder="Enter reason for stock adjustment (required for changes)"
        />

        {/* Stock Status Warnings */}
        {newStock <= material.reorderPoint && newStock > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Warning: New stock level is at or below reorder point ({material.reorderPoint} {material.unitOfMeasure})
          </Alert>
        )}

        {newStock <= material.minimumStock && newStock > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Critical: New stock level is at or below minimum stock ({material.minimumStock} {material.unitOfMeasure})
          </Alert>
        )}

        {newStock === 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Warning: This will set stock to zero. Material will be out of stock.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || adjustment === 0}
        >
          {loading ? 'Updating...' : 'Update Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockAdjustmentDialog;