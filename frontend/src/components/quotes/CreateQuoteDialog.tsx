import React, { useState } from 'react';
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
  IconButton,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add,
  Delete,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  totalPrice: number;
  notes?: string;
}

interface CreateQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (quoteData: any) => void;
}

const CreateQuoteDialog: React.FC<CreateQuoteDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    projectId: '',
    validUntil: '',
    terms: 'Payment due within 30 days of acceptance. 50% deposit required.',
    notes: '',
    taxRate: 0.0825,
  });

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
    unit: 'each',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock projects data - in real app this would come from API
  const [projects] = useState([
    { id: 1, title: 'Metal Warehouse Structure', projectType: 'industrial', status: 'quoted' },
    { id: 2, title: 'Residential Garage', projectType: 'residential', status: 'design' },
    { id: 3, title: 'Commercial Office Building', projectType: 'commercial', status: 'in_progress' },
  ]);

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * formData.taxRate;
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  };

  const totals = calculateTotals();

  const handleAddItem = () => {
    if (!newItem.description.trim()) {
      setErrors({ ...errors, itemDescription: 'Description is required' });
      return;
    }
    if (newItem.quantity <= 0) {
      setErrors({ ...errors, itemQuantity: 'Quantity must be greater than 0' });
      return;
    }
    if (newItem.unitPrice < 0) {
      setErrors({ ...errors, itemUnitPrice: 'Unit price cannot be negative' });
      return;
    }

    const item: QuoteItem = {
      id: Date.now().toString(),
      description: newItem.description,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      unit: newItem.unit,
      totalPrice: newItem.quantity * newItem.unitPrice,
      notes: newItem.notes,
    };

    setItems([...items, item]);
    setNewItem({ description: '', quantity: 1, unitPrice: 0, unit: 'each', notes: '' });
    setErrors({});
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSubmit = () => {
    const validationErrors: Record<string, string> = {};

    if (!formData.projectId) {
      validationErrors.projectId = 'Project is required';
    }

    if (items.length === 0) {
      validationErrors.items = 'At least one item is required';
    }

    if (!formData.validUntil) {
      validationErrors.validUntil = 'Valid until date is required';
    }

    const validUntilDate = new Date(formData.validUntil);
    if (validUntilDate <= new Date()) {
      validationErrors.validUntil = 'Valid until date must be in the future';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const quoteData = {
      ...formData,
      items,
      ...totals,
      userId: user?.id,
    };

    onSubmit(quoteData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      projectId: '',
      validUntil: '',
      terms: 'Payment due within 30 days of acceptance. 50% deposit required.',
      notes: '',
      taxRate: 0.0825,
    });
    setItems([]);
    setNewItem({ description: '', quantity: 1, unitPrice: 0, unit: 'each', notes: '' });
    setErrors({});
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create New Quote</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Project Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.projectId}>
                <InputLabel>Project *</InputLabel>
                <Select
                  value={formData.projectId}
                  onChange={(e) => {
                    setFormData({ ...formData, projectId: e.target.value });
                    setErrors({ ...errors, projectId: '' });
                  }}
                  label="Project *"
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id.toString()}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {project.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {project.projectType} • {project.status.replace('_', ' ')}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.projectId && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {errors.projectId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Valid Until */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valid Until *"
                type="date"
                value={formData.validUntil}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, validUntil: e.target.value });
                  setErrors({ ...errors, validUntil: '' });
                }}
                error={!!errors.validUntil}
                helperText={errors.validUntil}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />
            </Grid>

            {/* Terms */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Terms & Conditions"
                multiline
                rows={3}
                value={formData.terms}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Enter payment terms and conditions..."
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Internal Notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes (not visible to customer)..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Quote Items */}
          <Typography variant="h6" gutterBottom>
            Quote Items
          </Typography>

          {errors.items && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.items}
            </Alert>
          )}

          {/* Add Item Form */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Add New Item
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Description"
                  value={newItem.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setNewItem({ ...newItem, description: e.target.value });
                    setErrors({ ...errors, itemDescription: '' });
                  }}
                  error={!!errors.itemDescription}
                  helperText={errors.itemDescription}
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <TextField
                  fullWidth
                  label="Qty"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const quantity = parseFloat(e.target.value) || 0;
                    setNewItem({ ...newItem, quantity });
                    setErrors({ ...errors, itemQuantity: '' });
                  }}
                  error={!!errors.itemQuantity}
                  helperText={errors.itemQuantity}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    label="Unit"
                  >
                    <MenuItem value="each">Each</MenuItem>
                    <MenuItem value="lot">Lot</MenuItem>
                    <MenuItem value="package">Package</MenuItem>
                    <MenuItem value="kit">Kit</MenuItem>
                    <MenuItem value="sqft">Sq Ft</MenuItem>
                    <MenuItem value="linearft">Linear Ft</MenuItem>
                    <MenuItem value="ton">Ton</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={newItem.unitPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const unitPrice = parseFloat(e.target.value) || 0;
                    setNewItem({ ...newItem, unitPrice });
                    setErrors({ ...errors, itemUnitPrice: '' });
                  }}
                  error={!!errors.itemUnitPrice}
                  helperText={errors.itemUnitPrice}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Total"
                  value={formatCurrency(newItem.quantity * newItem.unitPrice)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={newItem.notes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddItem}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Items Table */}
          {items.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                      <TableCell>{item.notes || '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Quote Totals */}
          {items.length > 0 && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: 300 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>{formatCurrency(totals.subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Tax ({(formData.taxRate * 100).toFixed(1)}%):</Typography>
                    <Typography>{formatCurrency(totals.taxAmount)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6">{formatCurrency(totals.totalAmount)}</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={items.length === 0}
        >
          Create Quote
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateQuoteDialog;