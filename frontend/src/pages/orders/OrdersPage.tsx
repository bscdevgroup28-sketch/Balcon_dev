import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Avatar,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Assignment,
  LocalShipping,
  CheckCircle,
  Pending,
  TrendingUp,
  Build,
  Error
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import FeatureDiscovery from '../../components/help/FeatureDiscovery';
import CreateOrderDialog from '../../components/orders/CreateOrderDialog';

interface Order {
  id: number;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  amountPaid: number;
  estimatedDelivery?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: number;
    name: string;
    status: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
  };
  quote?: {
    id: number;
    quoteNumber: string;
    totalAmount: number;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Mock data for demonstration - will be replaced with API calls
  const projects = [
    { id: 1, name: 'Metal Warehouse Structure', status: 'in_progress' },
    { id: 2, name: 'Residential Garage', status: 'design' },
  ];

  const quotes = [
    { id: 1, quoteNumber: 'QT-2024-001', projectId: 1, totalAmount: 85000 },
    { id: 2, quoteNumber: 'QT-2024-002', projectId: 2, totalAmount: 35000 },
  ];

  const mockOrders: Order[] = useMemo(() => [
    {
      id: 1,
      orderNumber: 'ORD-1703123456789-ABC12',
      status: 'in_production',
      priority: 'high',
      totalAmount: 85000,
      subtotal: 78703.70,
      taxAmount: 6296.30,
      amountPaid: 42500,
      estimatedDelivery: '2025-01-15',
      confirmedAt: '2024-12-20T10:00:00Z',
      notes: 'Rush order - client needs by end of month',
      createdAt: '2024-12-20T09:00:00Z',
      updatedAt: '2024-12-22T14:30:00Z',
      project: {
        id: 1,
        name: 'Metal Warehouse Structure',
        status: 'in_progress',
      },
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@smithindustries.com',
        company: 'Smith Industries',
      },
      quote: {
        id: 1,
        quoteNumber: 'QT-2024-001',
        totalAmount: 85000,
      },
      items: [
        {
          id: '1',
          description: 'Steel I-Beams (W12x26)',
          quantity: 50,
          unitPrice: 1250.00,
          totalPrice: 62500.00,
        },
        {
          id: '2',
          description: 'Steel Columns (W10x33)',
          quantity: 20,
          unitPrice: 810.00,
          totalPrice: 16200.00,
        },
      ],
    },
    {
      id: 2,
      orderNumber: 'ORD-1703123456790-DEF34',
      status: 'pending',
      priority: 'medium',
      totalAmount: 35000,
      subtotal: 32407.41,
      taxAmount: 2592.59,
      amountPaid: 0,
      estimatedDelivery: '2025-02-01',
      notes: 'Standard residential garage order',
      createdAt: '2024-12-21T11:00:00Z',
      updatedAt: '2024-12-21T11:00:00Z',
      project: {
        id: 2,
        name: 'Residential Garage',
        status: 'design',
      },
      user: {
        id: 2,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@techinc.com',
        company: 'Tech Industries Inc.',
      },
      items: [
        {
          id: '3',
          description: 'Garage Frame Kit',
          quantity: 1,
          unitPrice: 25000.00,
          totalPrice: 25000.00,
        },
        {
          id: '4',
          description: 'Insulation Package',
          quantity: 1,
          unitPrice: 7410.00,
          totalPrice: 7410.00,
        },
      ],
    },
  ], []);

  useEffect(() => {
    // Simulate API call
    const loadOrders = async () => {
      setLoading(true);
      // In real app: const response = await integratedAPI.getOrders();
      setTimeout(() => {
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
        setLoading(false);
      }, 1000);
    };

    loadOrders();
  }, [mockOrders]);

  useEffect(() => {
    let filtered = orders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((order: Order) =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order: Order) => order.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((order: Order) => order.priority === priorityFilter);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, priorityFilter, orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'confirmed': return 'info';
      case 'in_production': return 'primary';
      case 'shipped': return 'warning';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Pending />;
      case 'confirmed': return <CheckCircle />;
      case 'in_production': return <Build />;
      case 'shipped': return <LocalShipping />;
      case 'delivered': return <CheckCircle color="success" />;
      case 'cancelled': return <Error color="error" />;
      default: return <Pending />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleViewOrder = () => {
    if (selectedOrder) {
      navigate(`/orders/${selectedOrder.id}`);
    }
    handleMenuClose();
  };

  const handleEditOrder = () => {
    if (selectedOrder) {
      navigate(`/orders/${selectedOrder.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteOrder = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (selectedOrder) {
      setOrders((prev: Order[]) => prev.filter((o: Order) => o.id !== selectedOrder.id));
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter((o: Order) => o.status === 'pending').length,
    inProduction: orders.filter((o: Order) => o.status === 'in_production').length,
    shipped: orders.filter((o: Order) => o.status === 'shipped').length,
    delivered: orders.filter((o: Order) => o.status === 'delivered').length,
    totalValue: orders.reduce((sum: number, o: Order) => sum + o.totalAmount, 0),
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Orders Management
        </Typography>
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Orders Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage customer orders from creation to delivery
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
          data-testid="new-order-button"
        >
          New Order
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} data-testid="order-stats">
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assignment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {orderStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Pending color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {orderStats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Build color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary.main">
                    {orderStats.inProduction}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Production
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalShipping color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {orderStats.shipped}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Shipped
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="success.main">
                    {orderStats.delivered}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Delivered
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {formatCurrency(orderStats.totalValue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }} data-testid="order-filters">
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="in_production">In Production</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e: any) => setPriorityFilter(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card data-testid="orders-table">
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Delivery Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order: Order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.orderNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.project.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.quote ? `Quote: ${order.quote.quoteNumber}` : 'No Quote'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                          {order.user.firstName[0]}{order.user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {order.user.firstName} {order.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.user.company || order.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={order.status.replace('_', ' ')}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.priority}
                        color={getPriorityColor(order.priority) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(order.totalAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Paid: {formatCurrency(order.amountPaid)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(order.estimatedDelivery)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Actions">
                        <IconButton
                          onClick={(e: React.MouseEvent<HTMLElement>) => handleMenuClick(e, order)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredOrders.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add order"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewOrder}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleEditOrder}>
          <Edit sx={{ mr: 1 }} /> Edit Order
        </MenuItem>
        <MenuItem onClick={handleDeleteOrder} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Delete Order
        </MenuItem>
      </Menu>

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={(orderData: any) => {
          // In real app: await integratedAPI.createOrder(orderData);
          console.log('Creating order:', orderData);
          // Mock adding to orders list
          const newOrder: Order = {
            id: Date.now(),
            orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            status: 'pending',
            priority: orderData.priority,
            totalAmount: orderData.totalAmount,
            subtotal: orderData.subtotal,
            taxAmount: orderData.taxAmount,
            amountPaid: 0,
            estimatedDelivery: orderData.estimatedDelivery,
            notes: orderData.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            project: projects.find(p => p.id === parseInt(orderData.projectId)) || projects[0],
            user: {
              id: user?.id || 1,
              firstName: user?.firstName || 'Current',
              lastName: user?.lastName || 'User',
              email: user?.email || 'user@example.com',
              company: user?.company,
            },
            quote: orderData.quoteId ? quotes.find(q => q.id === parseInt(orderData.quoteId)) : undefined,
            items: orderData.items,
          };
          setOrders((prev: Order[]) => [newOrder, ...prev]);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete order "{selectedOrder?.orderNumber}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feature Discovery */}
      <FeatureDiscovery
        tips={[]}
        autoStart={false}
        showButton={true}
      />
    </Box>
  );
};

export default OrdersPage;
