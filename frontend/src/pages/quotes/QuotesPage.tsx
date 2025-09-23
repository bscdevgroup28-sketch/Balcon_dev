import { Avatar, Tooltip, Fab } from '@mui/material';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Send,
  CheckCircle,
  Cancel,
  TrendingUp,
  Assignment,
  Pending,
  Warning
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import FeatureDiscovery from '../../components/help/FeatureDiscovery';
import CreateQuoteDialog from '../../components/quotes/CreateQuoteDialog';

interface Quote {
  id: number;
  quoteNumber: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  terms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isExpired?: boolean;
  daysUntilExpiry?: number;
  responseTime?: number;
  project: {
    id: number;
    title: string;
    projectType: string;
    status: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit?: string;
    notes?: string;
  }>;
}

const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  // Mock data for demonstration - will be replaced with API calls
  const projects = [
    { id: 1, title: 'Metal Warehouse Structure', projectType: 'industrial', status: 'quoted' },
    { id: 2, title: 'Residential Garage', projectType: 'residential', status: 'design' },
    { id: 3, title: 'Commercial Office Building', projectType: 'commercial', status: 'in_progress' },
  ];

  const mockQuotes: Quote[] = useMemo(() => [
    {
      id: 1,
      quoteNumber: 'Q24090001',
      status: 'sent',
      subtotal: 78703.70,
      taxAmount: 6296.30,
      totalAmount: 85000.00,
      validUntil: '2025-01-15',
      sentAt: '2024-12-20T10:00:00Z',
      viewedAt: '2024-12-21T14:30:00Z',
      terms: 'Payment due within 30 days of acceptance. 50% deposit required.',
      notes: 'Includes premium materials and expedited timeline.',
      createdAt: '2024-12-20T09:00:00Z',
      updatedAt: '2024-12-21T14:30:00Z',
      isExpired: false,
      daysUntilExpiry: 25,
      responseTime: 1,
      project: {
        id: 1,
        title: 'Metal Warehouse Structure',
        projectType: 'industrial',
        status: 'quoted',
      },
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@smithindustries.com',
        company: 'Smith Industries',
      },
      items: [
        {
          id: '1',
          description: 'Steel I-Beams (W12x26)',
          quantity: 50,
          unitPrice: 1250.00,
          totalPrice: 62500.00,
          unit: 'each',
        },
        {
          id: '2',
          description: 'Steel Columns (W10x33)',
          quantity: 20,
          unitPrice: 810.00,
          totalPrice: 16200.00,
          unit: 'each',
        },
        {
          id: '3',
          description: 'Installation and Engineering',
          quantity: 1,
          unitPrice: 10000.00,
          totalPrice: 10000.00,
          unit: 'lot',
        },
      ],
    },
    {
      id: 2,
      quoteNumber: 'Q24090002',
      status: 'accepted',
      subtotal: 32407.41,
      taxAmount: 2592.59,
      totalAmount: 35000.00,
      validUntil: '2025-02-01',
      sentAt: '2024-12-21T11:00:00Z',
      viewedAt: '2024-12-21T11:30:00Z',
      respondedAt: '2024-12-22T09:15:00Z',
      terms: 'Standard payment terms apply.',
      notes: 'Approved by customer - proceed with order creation.',
      createdAt: '2024-12-21T11:00:00Z',
      updatedAt: '2024-12-22T09:15:00Z',
      isExpired: false,
      daysUntilExpiry: 42,
      responseTime: 1,
      project: {
        id: 2,
        title: 'Residential Garage',
        projectType: 'residential',
        status: 'approved',
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
          id: '4',
          description: 'Garage Frame Kit',
          quantity: 1,
          unitPrice: 25000.00,
          totalPrice: 25000.00,
          unit: 'kit',
        },
        {
          id: '5',
          description: 'Insulation Package',
          quantity: 1,
          unitPrice: 7410.00,
          totalPrice: 7410.00,
          unit: 'package',
        },
        {
          id: '6',
          description: 'Foundation Preparation',
          quantity: 1,
          unitPrice: 2597.41,
          totalPrice: 2597.41,
          unit: 'lot',
        },
      ],
    },
    {
      id: 3,
      quoteNumber: 'Q24090003',
      status: 'draft',
      subtotal: 156000.00,
      taxAmount: 12480.00,
      totalAmount: 168480.00,
      validUntil: '2025-01-30',
      terms: 'Custom terms for large commercial project.',
      notes: 'Awaiting final engineering review before sending.',
      createdAt: '2024-12-22T15:00:00Z',
      updatedAt: '2024-12-22T15:00:00Z',
      isExpired: false,
      daysUntilExpiry: 40,
      project: {
        id: 3,
        title: 'Commercial Office Building',
        projectType: 'commercial',
        status: 'in_progress',
      },
      user: {
        id: 3,
        firstName: 'Mike',
        lastName: 'Davis',
        email: 'mike.davis@commercialdev.com',
        company: 'Commercial Development Corp',
      },
      items: [
        {
          id: '7',
          description: 'Structural Steel Package',
          quantity: 1,
          unitPrice: 120000.00,
          totalPrice: 120000.00,
          unit: 'package',
        },
        {
          id: '8',
          description: 'Concrete Foundation',
          quantity: 1,
          unitPrice: 36000.00,
          totalPrice: 36000.00,
          unit: 'lot',
        },
      ],
    },
  ], []);

  useEffect(() => {
    // Simulate API call
    const loadQuotes = async () => {
      setLoading(true);
      // In real app: const response = await integratedAPI.getQuotes();
      setTimeout(() => {
        setQuotes(mockQuotes);
        setFilteredQuotes(mockQuotes);
        setLoading(false);
      }, 1000);
    };

    loadQuotes();
  }, [mockQuotes]);

  useEffect(() => {
    let filtered = quotes;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((quote: Quote) =>
        quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.user.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((quote: Quote) => quote.status === statusFilter);
    }

    // Apply project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter((quote: Quote) => quote.project.id.toString() === projectFilter);
    }

    setFilteredQuotes(filtered);
  }, [searchTerm, statusFilter, projectFilter, quotes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'info';
      case 'viewed': return 'primary';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit />;
      case 'sent': return <Send />;
      case 'viewed': return <Visibility />;
      case 'accepted': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'expired': return <Warning />;
      default: return <Pending />;
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

  const getExpiryStatus = (quote: Quote) => {
    if (quote.isExpired) return { text: 'Expired', color: 'error' as const };
    if (quote.daysUntilExpiry && quote.daysUntilExpiry <= 7) return { text: 'Expiring Soon', color: 'warning' as const };
    return { text: 'Valid', color: 'success' as const };
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, quote: Quote) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuote(quote);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuote(null);
  };

  const handleViewQuote = () => {
    if (selectedQuote) {
      navigate(`/quotes/${selectedQuote.id}`);
    }
    handleMenuClose();
  };

  const handleEditQuote = () => {
    if (selectedQuote) {
      navigate(`/quotes/${selectedQuote.id}/edit`);
    }
    handleMenuClose();
  };

  const handleSendQuote = () => {
    setSendDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteQuote = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmSend = async () => {
    if (selectedQuote) {
      // In real app: await integratedAPI.sendQuote(selectedQuote.id);
      console.log('Sending quote:', selectedQuote.id);
      // Mock update
      setQuotes((prev: Quote[]) => prev.map((q: Quote) =>
        q.id === selectedQuote.id
          ? { ...q, status: 'sent' as const, sentAt: new Date().toISOString() }
          : q
      ));
      setSendDialogOpen(false);
      setSelectedQuote(null);
    }
  };

  const confirmDelete = () => {
    if (selectedQuote) {
      setQuotes((prev: Quote[]) => prev.filter((q: Quote) => q.id !== selectedQuote.id));
      setDeleteDialogOpen(false);
      setSelectedQuote(null);
    }
  };

  const quoteStats = {
    total: quotes.length,
    draft: quotes.filter((q: Quote) => q.status === 'draft').length,
    sent: quotes.filter((q: Quote) => q.status === 'sent').length,
    viewed: quotes.filter((q: Quote) => q.status === 'viewed').length,
    accepted: quotes.filter((q: Quote) => q.status === 'accepted').length,
    rejected: quotes.filter((q: Quote) => q.status === 'rejected').length,
    expired: quotes.filter((q: Quote) => q.isExpired).length,
    totalValue: quotes.reduce((sum: number, q: Quote) => sum + q.totalAmount, 0),
    acceptedValue: quotes.filter((q: Quote) => q.status === 'accepted').reduce((sum: number, q: Quote) => sum + q.totalAmount, 0),
  };

  const uniqueProjects = Array.from(new Set(quotes.map((q: Quote) => q.project.id)))
    .map((projectId) => quotes.find((q: Quote) => q.project.id === projectId)?.project)
    .filter(Boolean);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Quotes Management
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
            Quotes Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create, send, and track quote approvals from customers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
          data-testid="new-quote-button"
        >
          New Quote
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} data-testid="quote-stats">
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assignment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {quoteStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Quotes
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
                <Edit sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="text.primary">
                    {quoteStats.draft}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Draft
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
                <Send color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {quoteStats.sent}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sent
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
                    {quoteStats.accepted}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accepted
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
                <Cancel color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="error.main">
                    {quoteStats.rejected}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
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
                    {formatCurrency(quoteStats.totalValue)}
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
      <Card sx={{ mb: 3 }} data-testid="quote-filters">
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search quotes..."
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
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="viewed">Viewed</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={projectFilter}
                  onChange={(e: any) => setProjectFilter(e.target.value)}
                  label="Project"
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {uniqueProjects.map((project) => (
                    <MenuItem key={project!.id} value={project!.id.toString()}>
                      {project!.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setProjectFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card data-testid="quotes-table">
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Quote #</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Response Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuotes.map((quote: Quote) => {
                  const expiryStatus = getExpiryStatus(quote);
                  return (
                    <TableRow key={quote.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {quote.quoteNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {quote.project.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {quote.project.projectType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                            {quote.user.firstName[0]}{quote.user.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {quote.user.firstName} {quote.user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {quote.user.company || quote.user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={getStatusIcon(quote.status)}
                            label={quote.status}
                            color={getStatusColor(quote.status) as any}
                            size="small"
                          />
                          {quote.isExpired && (
                            <Chip
                              label="Expired"
                              color="error"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(quote.validUntil)}
                        </Typography>
                        <Chip
                          label={expiryStatus.text}
                          color={expiryStatus.color}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(quote.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {quote.responseTime ? (
                          <Typography variant="body2">
                            {quote.responseTime} day{quote.responseTime !== 1 ? 's' : ''}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Pending
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Actions">
                          <IconButton
                            onClick={(e: React.MouseEvent<HTMLElement>) => handleMenuClick(e, quote)}
                            size="small"
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredQuotes.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No quotes found
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
        aria-label="add quote"
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
        <MenuItem onClick={handleViewQuote}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleEditQuote}>
          <Edit sx={{ mr: 1 }} /> Edit Quote
        </MenuItem>
        {selectedQuote?.status === 'draft' && (
          <MenuItem onClick={handleSendQuote}>
            <Send sx={{ mr: 1 }} /> Send to Customer
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteQuote} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Delete Quote
        </MenuItem>
      </Menu>

      {/* Create Quote Dialog */}
      <CreateQuoteDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={(quoteData: any) => {
          // In real app: await integratedAPI.createQuote(quoteData);
          console.log('Creating quote:', quoteData);
          // Mock adding to quotes list
          const now = new Date();
          const year = now.getFullYear().toString().slice(-2);
          const month = (now.getMonth() + 1).toString();
          const paddedMonth = month.length === 1 ? '0' + month : month;
          const random = Math.floor(Math.random() * 10000).toString();
          const paddedRandom = '0000'.substring(0, 4 - random.length) + random;

          const newQuote: Quote = {
            id: Date.now(),
            quoteNumber: `Q${year}${paddedMonth}${paddedRandom}`,
            status: 'draft',
            subtotal: quoteData.subtotal,
            taxAmount: quoteData.taxAmount,
            totalAmount: quoteData.totalAmount,
            validUntil: quoteData.validUntil,
            terms: quoteData.terms,
            notes: quoteData.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isExpired: false,
            daysUntilExpiry: Math.ceil((new Date(quoteData.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
            project: projects.find((p: any) => p.id === parseInt(quoteData.projectId)) || projects[0],
            user: {
              id: user?.id || 1,
              firstName: user?.firstName || 'Current',
              lastName: user?.lastName || 'User',
              email: user?.email || 'user@example.com',
              company: user?.company,
            },
            items: quoteData.items,
          };
          setQuotes((prev: Quote[]) => [newQuote, ...prev]);
        }}
      />

      {/* Send Quote Confirmation Dialog */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)}>
        <DialogTitle>Send Quote to Customer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to send quote "{selectedQuote?.quoteNumber}" to {selectedQuote?.user.firstName} {selectedQuote?.user.lastName}?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Once sent, the customer will be able to view and respond to this quote.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmSend} variant="contained" startIcon={<Send />}>
            Send Quote
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Quote</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete quote "{selectedQuote?.quoteNumber}"? This action cannot be undone.
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

export default QuotesPage;
