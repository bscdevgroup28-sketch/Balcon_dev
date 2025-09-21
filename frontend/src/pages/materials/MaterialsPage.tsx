import React, { useState, useEffect } from 'react';
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
  Paper,
  Divider,
  Alert,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Inventory,
  Warning,
  CheckCircle,
  Error,
  TrendingUp,
  Category,
  Business,
  LocationOn,
  Schedule,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Material, MaterialQueryParams } from '../../types/material';
import { integratedAPI } from '../../services/integratedAPI';
import MaterialDialog from '../../components/materials/MaterialDialog';
import StockAdjustmentDialog from '../../components/materials/StockAdjustmentDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`materials-tabpanel-${index}`}
      aria-labelledby={`materials-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MaterialsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Categories
  const [categories, setCategories] = useState<string[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalMaterials: 0,
    activeMaterials: 0,
    lowStockMaterials: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadMaterials();
    loadCategories();
    loadStats();
  }, [page, categoryFilter, statusFilter, stockStatusFilter]);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchTerm]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: MaterialQueryParams = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter as 'active' | 'inactive' | 'discontinued';
      if (stockStatusFilter !== 'all') params.stockStatus = stockStatusFilter as 'normal' | 'low' | 'critical';

      const response = await integratedAPI.getMaterials(params);

      if (response.success && response.data) {
        setMaterials(response.data.data || []);
        setTotal(response.data.meta?.total || 0);
        setTotalPages(response.data.meta?.totalPages || 0);
      } else {
        setError(response.error || 'Failed to load materials');
      }
    } catch (err) {
      setError('Failed to load materials');
      console.error('Error loading materials:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const loadStats = async () => {
    try {
      // Get low stock materials for stats
      const lowStockResponse = await integratedAPI.getLowStockMaterials();
      const lowStockCount = lowStockResponse.success ? lowStockResponse.data?.meta?.total || 0 : 0;

      // Calculate stats from current materials
      const activeMaterials = materials.filter(m => m.status === 'active').length;
      const totalValue = materials.reduce((sum, m) => sum + (m.currentStock * m.unitCost), 0);

      setStats({
        totalMaterials: materials.length,
        activeMaterials,
        lowStockMaterials: lowStockCount,
        totalValue,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const filterMaterials = () => {
    if (!searchTerm) {
      setFilteredMaterials(materials);
      return;
    }

    const filtered = materials.filter(material =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMaterials(filtered);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, material: Material) => {
    setAnchorEl(event.currentTarget);
    setSelectedMaterial(material);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMaterial(null);
  };

  const handleCreateMaterial = () => {
    setCreateDialogOpen(true);
  };

  const handleEditMaterial = () => {
    if (selectedMaterial) {
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleStockAdjustment = () => {
    if (selectedMaterial) {
      setStockDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteMaterial = () => {
    if (selectedMaterial) {
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!selectedMaterial) return;

    try {
      const response = await integratedAPI.deleteMaterial(selectedMaterial.id.toString());
      if (response.success) {
        await loadMaterials();
        await loadStats();
      } else {
        setError(response.error || 'Failed to delete material');
      }
    } catch (err) {
      setError('Failed to delete material');
      console.error('Error deleting material:', err);
    }
    setDeleteDialogOpen(false);
    setSelectedMaterial(null);
  };

  const getStockStatusColor = (material: Material) => {
    if (material.currentStock <= material.reorderPoint) return 'error';
    if (material.currentStock <= material.minimumStock) return 'warning';
    return 'success';
  };

  const getStockStatusText = (material: Material) => {
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

  const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Materials Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateMaterial}
          size="large"
        >
          Add Material
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Materials"
            value={stats.totalMaterials}
            icon={<Inventory />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Materials"
            value={stats.activeMaterials}
            icon={<CheckCircle />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockMaterials}
            icon={<Warning />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Value"
            value={formatCurrency(stats.totalValue)}
            icon={<TrendingUp />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search materials..."
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
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="discontinued">Discontinued</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Stock Status</InputLabel>
                <Select
                  value={stockStatusFilter}
                  label="Stock Status"
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Stock Levels</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setStockStatusFilter('all');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <LinearProgress />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="right">Unit Cost</TableCell>
                    <TableCell align="right">Selling Price</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMaterials.map((material) => (
                    <TableRow key={material.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {material.name}
                          </Typography>
                          {material.description && (
                            <Typography variant="body2" color="textSecondary">
                              {material.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={material.category}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {material.currentStock} {material.unitOfMeasure}
                          </Typography>
                          <Chip
                            label={getStockStatusText(material)}
                            size="small"
                            color={getStockStatusColor(material) as any}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(material.unitCost)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(material.sellingPrice)}
                      </TableCell>
                      <TableCell>
                        {material.supplierName ? (
                          <Box display="flex" alignItems="center">
                            <Business sx={{ mr: 1, fontSize: 16 }} />
                            <Typography variant="body2">
                              {material.supplierName}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No supplier
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={material.status}
                          size="small"
                          color={
                            material.status === 'active' ? 'success' :
                            material.status === 'inactive' ? 'warning' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleMenuOpen(e, material)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {filteredMaterials.length === 0 && !loading && (
            <Box textAlign="center" py={6}>
              <Inventory sx={{ fontSize: 64, color: 'textSecondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No materials found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || stockStatusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first material to get started'
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Pagination would go here - simplified for now */}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditMaterial}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleStockAdjustment}>
          <Inventory sx={{ mr: 1 }} />
          Adjust Stock
        </MenuItem>
        <MenuItem onClick={handleDeleteMaterial} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Material</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedMaterial?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Placeholder for dialogs - will be implemented next */}
      <MaterialDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={() => {
          loadMaterials();
          loadStats();
        }}
      />

      <MaterialDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={() => {
          loadMaterials();
          loadStats();
        }}
        material={selectedMaterial}
      />

      <StockAdjustmentDialog
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        onSubmit={() => {
          loadMaterials();
          loadStats();
        }}
        material={selectedMaterial}
      />
    </Box>
  );
};

export default MaterialsPage;
