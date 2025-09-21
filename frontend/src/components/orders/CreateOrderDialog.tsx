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
  Chip,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import {
  Add,
  Delete,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
}

const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    projectId: '',
    quoteId: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    notes: '',
    estimatedDelivery: '',
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
  });

  const [projects] = useState([
    { id: 1, name: 'Metal Warehouse Structure', status: 'in_progress' },
    { id: 2, name: 'Residential Garage', status: 'design' },
  ]);

  const [quotes] = useState([
    { id: 1, quoteNumber: 'QT-2024-001', projectId: 1, totalAmount: 85000 },
    { id: 2, quoteNumber: 'QT-2024-002', projectId: 2, totalAmount: 35000 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = 0.0825; // 8.25% tax rate
    const taxAmount = subtotal * taxRate;
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

    const item: OrderItem = {
      id: Date.now().toString(),
      description: newItem.description,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      totalPrice: newItem.quantity * newItem.unitPrice,
    };

    setItems([...items, item]);
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
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

    if (!formData.estimatedDelivery) {
      validationErrors.estimatedDelivery = 'Estimated delivery date is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const orderData = {
      ...formData,
      items,
      ...totals,
      userId: user?.id,
    };

    onSubmit(orderData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      projectId: '',
      quoteId: '',
      priority: 'medium',
      notes: '',
      estimatedDelivery: '',
    });
    setItems([]);
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
    setErrors({});
    onClose();
  };

  const availableQuotes = quotes.filter(quote =>
    !formData.projectId || quote.projectId === parseInt(formData.projectId)
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create New Order</DialogTitle>
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
                    setFormData({ ...formData, projectId: e.target.value, quoteId: '' });
                    setErrors({ ...errors, projectId: '' });
                  }}
                  label="Project *"
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id.toString()}>
                      <Box>
                        <Typography variant="body2">{project.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Status: {project.status.replace('_', ' ')}
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

            {/* Quote Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Quote (Optional)</InputLabel>
                <Select
                  value={formData.quoteId}
                  onChange={(e) => setFormData({ ...formData, quoteId: e.target.value })}
                  label="Quote (Optional)"
                  disabled={!formData.projectId}
                >
                  <MenuItem value="">
                    <em>No quote selected</em>
                  </MenuItem>
                  {availableQuotes.map((quote) => (
                    <MenuItem key={quote.id} value={quote.id.toString()}>
                      <Box>
                        <Typography variant="body2">{quote.quoteNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ${quote.totalAmount.toLocaleString()}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Priority */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  label="Priority"
                >
                  <MenuItem value="low">
                    <Chip size="small" label="Low" color="success" variant="outlined" />
                  </MenuItem>
                  <MenuItem value="medium">
                    <Chip size="small" label="Medium" color="info" variant="outlined" />
                  </MenuItem>
                  <MenuItem value="high">
                    <Chip size="small" label="High" color="warning" variant="outlined" />
                  </MenuItem>
                  <MenuItem value="urgent">
                    <Chip size="small" label="Urgent" color="error" variant="outlined" />
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Estimated Delivery */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estimated Delivery Date *"
                type="date"
                value={formData.estimatedDelivery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, estimatedDelivery: e.target.value });
                  setErrors({ ...errors, estimatedDelivery: '' });
                }}
                error={!!errors.estimatedDelivery}
                helperText={errors.estimatedDelivery}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions or notes for this order..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Order Items */}
          <Typography variant="h6" gutterBottom>
            Order Items
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
              <Grid item xs={12} md={4}>
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
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Quantity"
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
                  value={`$${(newItem.quantity * newItem.unitPrice).toFixed(2)}`}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddItem}
                >
                  Add Item
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
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">${item.totalPrice.toFixed(2)}</TableCell>
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

          {/* Order Totals */}
          {items.length > 0 && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: 300 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>${totals.subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Tax (8.25%):</Typography>
                    <Typography>${totals.taxAmount.toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6">${totals.totalAmount.toFixed(2)}</Typography>
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
          Create Order
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrderDialog;