import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Visibility,
  Download,
  CheckCircle,
  Cancel,
  Schedule,
  AttachMoney,
  Description,
  Build,
  CalendarToday,
  Phone,
  Email,
  Info,
  Warning,
} from '@mui/icons-material';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
  specifications?: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  projectTitle: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: string;
  createdDate: string;
  items: QuoteItem[];
  terms?: string;
  notes?: string;
  salesRep: {
    name: string;
    email: string;
    phone: string;
  };
  projectDetails: {
    type: string;
    location: string;
    size: string;
    timeline: string;
  };
}

interface QuoteCardProps {
  quote: Quote;
  onView: (quoteId: string) => void;
  onAccept: (quoteId: string) => void;
  onReject: (quoteId: string) => void;
  onDownload: (quoteId: string) => void;
}

const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  onView,
  onAccept,
  onReject,
  onDownload,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'info';
      case 'viewed': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'expired': return <Schedule />;
      default: return <Description />;
    }
  };

  const isExpired = new Date(quote.validUntil) < new Date();
  const canRespond = ['sent', 'viewed'].includes(quote.status) && !isExpired;

  const handleAccept = () => {
    onAccept(quote.id);
    setShowAcceptDialog(false);
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(quote.id);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  return (
    <>
      <Card sx={{ 
        border: 1, 
        borderColor: isExpired ? 'error.main' : 'divider',
        '&:hover': { boxShadow: 3 }
      }}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" component="div">
                Quote #{quote.quoteNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {quote.projectTitle}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={quote.status} 
                  size="small" 
                  color={getStatusColor(quote.status) as any}
                  icon={getStatusIcon(quote.status)}
                />
                {isExpired && (
                  <Chip 
                    label="Expired" 
                    size="small" 
                    color="error"
                    icon={<Warning />}
                  />
                )}
              </Box>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" color="primary" fontWeight="bold">
                ${quote.totalAmount.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Amount
              </Typography>
            </Box>
          </Box>

          {/* Project Details */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Type</Typography>
              <Typography variant="body2">{quote.projectDetails.type}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Location</Typography>
              <Typography variant="body2">{quote.projectDetails.location}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Size</Typography>
              <Typography variant="body2">{quote.projectDetails.size}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Valid Until</Typography>
              <Typography variant="body2" color={isExpired ? 'error.main' : 'text.primary'}>
                {new Date(quote.validUntil).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>

          {/* Quote Breakdown */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Subtotal: ${quote.subtotal.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tax: ${quote.taxAmount.toLocaleString()}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1" fontWeight="bold">
              Total: ${quote.totalAmount.toLocaleString()}
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Visibility />}
              onClick={() => setShowDetails(true)}
            >
              View Details
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              onClick={() => onDownload(quote.id)}
            >
              Download PDF
            </Button>

            {canRespond && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => setShowAcceptDialog(true)}
                >
                  Accept
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => setShowRejectDialog(true)}
                >
                  Decline
                </Button>
              </>
            )}

            {quote.status === 'accepted' && (
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<Build />}
                onClick={() => window.location.href = '/orders/create'}
              >
                Create Order
              </Button>
            )}
          </Box>

          {/* Sales Rep Contact */}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Questions? Contact your sales representative:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {quote.salesRep.name}
              </Typography>
              <Tooltip title="Call">
                <IconButton size="small" href={`tel:${quote.salesRep.phone}`}>
                  <Phone fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Email">
                <IconButton size="small" href={`mailto:${quote.salesRep.email}`}>
                  <Email fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quote Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Quote Details - #{quote.quoteNumber}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Project Information</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Build /></ListItemIcon>
                  <ListItemText primary="Project" secondary={quote.projectTitle} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Info /></ListItemIcon>
                  <ListItemText primary="Type" secondary={quote.projectDetails.type} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CalendarToday /></ListItemIcon>
                  <ListItemText primary="Timeline" secondary={quote.projectDetails.timeline} />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Quote Summary</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Description /></ListItemIcon>
                  <ListItemText primary="Quote Number" secondary={quote.quoteNumber} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AttachMoney /></ListItemIcon>
                  <ListItemText primary="Total Amount" secondary={`$${quote.totalAmount.toLocaleString()}`} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Schedule /></ListItemIcon>
                  <ListItemText primary="Valid Until" secondary={new Date(quote.validUntil).toLocaleDateString()} />
                </ListItem>
              </List>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Quote Items</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quote.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2">{item.description}</Typography>
                      {item.specifications && (
                        <Typography variant="caption" color="text.secondary">
                          {item.specifications}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="right">${item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell align="right">${item.totalPrice.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right"><strong>Subtotal:</strong></TableCell>
                  <TableCell align="right"><strong>${quote.subtotal.toLocaleString()}</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} align="right"><strong>Tax:</strong></TableCell>
                  <TableCell align="right"><strong>${quote.taxAmount.toLocaleString()}</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} align="right"><strong>Total:</strong></TableCell>
                  <TableCell align="right"><strong>${quote.totalAmount.toLocaleString()}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {quote.terms && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Terms & Conditions</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {quote.terms}
              </Typography>
            </Box>
          )}

          {quote.notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Additional Notes</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {quote.notes}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={() => onDownload(quote.id)}>
            Download PDF
          </Button>
          {canRespond && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => {
                  setShowDetails(false);
                  setShowAcceptDialog(true);
                }}
              >
                Accept Quote
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onClose={() => setShowAcceptDialog(false)}>
        <DialogTitle>Accept Quote</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            By accepting this quote, you agree to proceed with the project under the specified terms and pricing.
          </Alert>
          <Typography>
            Are you sure you want to accept quote #{quote.quoteNumber} for ${quote.totalAmount.toLocaleString()}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAcceptDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleAccept}>
            Accept Quote
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)}>
        <DialogTitle>Decline Quote</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Please let us know why you're declining this quote so we can better serve you in the future.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for declining"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Budget constraints, timeline doesn't work, need modifications..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)}>Cancel</Button>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleReject}
            disabled={!rejectReason.trim()}
          >
            Decline Quote
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuoteCard;
