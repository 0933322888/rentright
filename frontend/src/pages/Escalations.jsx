import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Divider
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Comment as CommentIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const StatusChip = ({ status }) => {
  // Handle undefined or null status
  if (!status) {
    return (
      <Chip
        label="UNKNOWN"
        color="default"
        size="small"
      />
    );
  }

  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'in_review':
        return 'info';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={status.toString().replace('_', ' ').toUpperCase()}
      color={getStatusColor()}
      size="small"
    />
  );
};

const EscalationDetailsModal = ({ 
  open, 
  onClose, 
  escalation, 
  onAddNote, 
  onUpdateStatus 
}) => {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState(escalation?.status || 'pending');

  const handleAddNote = () => {
    if (!note.trim()) return;
    onAddNote(note);
    setNote('');
  };

  const handleStatusUpdate = () => {
    onUpdateStatus(status);
  };

  // Helper function to safely get location string
  const getLocationString = (property) => {
    if (!property?.location) return 'Location not available';
    const { city, state } = property.location;
    return [city, state].filter(Boolean).join(', ') || 'Location not available';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <WarningIcon /> Escalation Details
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {escalation && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Property Information</Typography>
              <Typography>Title: {escalation.property?.title || 'Not available'}</Typography>
              <Typography>Location: {getLocationString(escalation.property)}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Tenant Information</Typography>
              <Typography>Name: {escalation.tenant?.name || 'Not available'}</Typography>
              <Typography>Email: {escalation.tenant?.email || 'Not available'}</Typography>
              <Typography>Phone: {escalation.tenant?.phone || 'Not available'}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Landlord Information</Typography>
              <Typography>Name: {escalation.landlord?.name || 'Not available'}</Typography>
              <Typography>Email: {escalation.landlord?.email || 'Not available'}</Typography>
              <Typography>Phone: {escalation.landlord?.phone || 'Not available'}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Escalation Details</Typography>
              <Typography>Reason: {escalation.reason?.replace('_', ' ').toUpperCase() || 'Not available'}</Typography>
              <Typography>Description: {escalation.description || 'Not available'}</Typography>
              <Typography>Created: {escalation.createdAt ? format(new Date(escalation.createdAt), 'PPpp') : 'Not available'}</Typography>
              <Typography>Status: <StatusChip status={escalation.status} /></Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Recent Payment History</Typography>
              {escalation.paymentHistory?.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Method</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {escalation.paymentHistory.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell>{payment.date ? format(new Date(payment.date), 'PP') : 'N/A'}</TableCell>
                          <TableCell>${payment.amount || '0.00'}</TableCell>
                          <TableCell>
                            <StatusChip status={payment.status} />
                          </TableCell>
                          <TableCell>{payment.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">No payment history available</Typography>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Admin Notes</Typography>
              {escalation.adminNotes?.length > 0 ? (
                escalation.adminNotes.map((note, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="primary">
                      {note.admin?.name || 'Admin'} - {note.createdAt ? format(new Date(note.createdAt), 'PPpp') : 'N/A'}
                    </Typography>
                    <Typography>{note.text || 'No note text'}</Typography>
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary">No admin notes yet</Typography>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Add Note</Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your note here..."
              />
              <Button
                variant="contained"
                startIcon={<CommentIcon />}
                onClick={handleAddNote}
                sx={{ mt: 1 }}
                disabled={!note.trim()}
              >
                Add Note
              </Button>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>Update Status</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_review">In Review</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                onClick={handleStatusUpdate}
                disabled={status === escalation.status}
              >
                Update Status
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Escalations = () => {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEscalations();
    }
  }, [user]);

  const fetchEscalations = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ESCALATIONS + '/admin');
      setEscalations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching escalations:', err);
      setError('Failed to fetch escalations');
      setLoading(false);
    }
  };

  const handleAddNote = async (escalationId, note) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.ESCALATIONS}/${escalationId}/notes`,
        { text: note }
      );
      
      // Update the escalation in the list while preserving all data
      setEscalations(prev => 
        prev.map(esc => 
          esc._id === escalationId ? { ...esc, ...response.data } : esc
        )
      );
      
      // Update the selected escalation while preserving all data
      setSelectedEscalation(prev => prev && prev._id === escalationId ? { ...prev, ...response.data } : prev);
      
      toast.success('Note added successfully');
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Failed to add note');
    }
  };

  const handleUpdateStatus = async (escalationId, status) => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.ESCALATIONS}/${escalationId}/status`,
        { status }
      );
      
      // Update the escalation in the list while preserving all data
      setEscalations(prev => 
        prev.map(esc => 
          esc._id === escalationId ? { ...esc, status: response.data.status } : esc
        )
      );
      
      // Update the selected escalation while preserving all data
      setSelectedEscalation(prev => 
        prev && prev._id === escalationId 
          ? { ...prev, status: response.data.status }
          : prev
      );
      
      toast.success('Status updated successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          You do not have permission to access this page.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading escalations...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Payment Escalations
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Property</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>Landlord</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {escalations.map((escalation) => (
              <TableRow key={escalation._id}>
                <TableCell>{escalation.property.title}</TableCell>
                <TableCell>{escalation.tenant.name}</TableCell>
                <TableCell>{escalation.landlord.name}</TableCell>
                <TableCell>{escalation.reason.replace('_', ' ').toUpperCase()}</TableCell>
                <TableCell>
                  <StatusChip status={escalation.status} />
                </TableCell>
                <TableCell>
                  {format(new Date(escalation.createdAt), 'PP')}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      onClick={() => {
                        setSelectedEscalation(escalation);
                        setShowDetailsModal(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EscalationDetailsModal
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEscalation(null);
        }}
        escalation={selectedEscalation}
        onAddNote={(note) => handleAddNote(selectedEscalation._id, note)}
        onUpdateStatus={(status) => handleUpdateStatus(selectedEscalation._id, status)}
      />
    </Container>
  );
};

export default Escalations; 