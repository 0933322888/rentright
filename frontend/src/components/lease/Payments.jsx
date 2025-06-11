import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paper
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import GavelIcon from '@mui/icons-material/Gavel';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { format } from 'date-fns';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, 'PPp');
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'Invalid Date';
  }
};

const PaymentMethodBadge = ({ method }) => {
  const colors = {
    credit_card: 'bg-blue-100 text-blue-800',
    debit_card: 'bg-green-100 text-green-800',
    bank_transfer: 'bg-purple-100 text-purple-800',
    cash: 'bg-yellow-100 text-yellow-800'
  };

  const labels = {
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    bank_transfer: 'Bank Transfer',
    cash: 'Cash'
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[method]}`}>
      {labels[method]}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const StatusChip = ({ status }) => {
  const colors = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const EscalationModal = ({ open, onClose, onConfirm, property, tenant }) => {
  const [reason, setReason] = useState('missed_payment');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!description.trim()) {
      setError('Please provide a description of the issue');
      return;
    }
    onConfirm({
      reason,
      description: description.trim()
    });
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
        <WarningIcon /> Payment Escalation Process
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          RentRight provides comprehensive support for handling missed payments and will compensate losses as per our agreement.
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Property: {property?.title}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Tenant: {tenant?.name}
          </Typography>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Reason for Escalation</InputLabel>
          <Select
            value={reason}
            label="Reason for Escalation"
            onChange={(e) => setReason(e.target.value)}
          >
            <MenuItem value="missed_payment">Missed Payment</MenuItem>
            <MenuItem value="late_payment">Late Payment</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Description"
          multiline
          rows={4}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error || "Please provide details about the payment issue"}
          sx={{ mb: 2 }}
        />

        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mt: 3 }}>
          What happens next:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Initial Review"
              secondary="Our team will review the payment history and tenant communication records within 24 hours."
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem>
            <ListItemIcon>
              <PaymentIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Payment Resolution"
              secondary="We will attempt to resolve the payment issue through direct communication with the tenant."
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem>
            <ListItemIcon>
              <AssignmentIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Documentation"
              secondary="All communication and attempts at resolution will be documented for legal purposes."
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem>
            <ListItemIcon>
              <GavelIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Legal Process"
              secondary="If payment is not received, we will initiate the legal process for end of tenancy."
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Compensation"
              secondary="As per our agreement, RentRight will compensate for any financial losses incurred."
            />
          </ListItem>
        </List>

        <Alert severity="warning" sx={{ mt: 2 }}>
          Please note: This process cannot be reversed once initiated. Make sure you have attempted all reasonable means of communication with the tenant.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
          startIcon={<WarningIcon />}
        >
          Confirm Escalation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RecordPaymentModal = ({ open, onClose, onConfirm, propertyPrice }) => {
  const [amount, setAmount] = useState(propertyPrice?.toString() || '');
  const [description, setDescription] = useState('Monthly Rent');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    onConfirm({
      amount: parseFloat(amount),
      description,
      paymentMethod,
      status: 'completed'
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <AddIcon /> Record Manual Payment
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Use this form to record a payment that was made outside the system (e.g., cash payment).
        </Typography>

        <TextField
          fullWidth
          label="Payment Amount"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error}
          type="number"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AttachMoneyIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mt: 2 }}
        />

        <TextField
          fullWidth
          label="Payment Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mt: 2 }}
        />

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Payment Method</InputLabel>
          <Select
            value={paymentMethod}
            label="Payment Method"
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
            <MenuItem value="check">Check</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>

        {propertyPrice && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Suggested amount: ${propertyPrice}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
        >
          Record Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EscalationDetailsModal = ({ open, onClose, escalation, onStatusUpdate }) => {
  if (!escalation) return null;

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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Escalation Details</Typography>
          <Typography>Reason: {escalation.reason?.replace('_', ' ').toUpperCase() || 'Not specified'}</Typography>
          <Typography>Description: {escalation.description || 'No description provided'}</Typography>
          <Typography>Status: <StatusChip status={escalation.status} /></Typography>
          <Typography>Created: {formatDate(escalation.createdAt)}</Typography>
          {escalation.resolutionDate && (
            <Typography>Resolved: {formatDate(escalation.resolutionDate)}</Typography>
          )}
        </Box>

        {escalation.adminNotes?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Admin Notes</Typography>
            {escalation.adminNotes.map((note, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {formatDate(note.createdAt)} by {note.admin?.name || 'Admin'}
                </Typography>
                <Typography>{note.text}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {escalation.paymentHistory?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Payment History</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {escalation.paymentHistory.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status?.toUpperCase() || 'UNKNOWN'}
                          color={payment.status === 'completed' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{payment.description || 'No description'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {escalation.status !== 'closed' && (
          <Button
            onClick={async () => {
              try {
                await axios.patch(
                  `${API_ENDPOINTS.ESCALATIONS}/${escalation._id}/status`,
                  { status: 'closed' }
                );
                onClose();
                onStatusUpdate();
              } catch (err) {
                console.error('Error closing escalation:', err);
                toast.error('Failed to close escalation');
              }
            }}
            color="primary"
            variant="contained"
          >
            Close Escalation
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const Payments = ({ leaseDetails }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit_card');
  const [paymentDescription, setPaymentDescription] = useState('Monthly Rent');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [escalations, setEscalations] = useState([]);
  const [activeEscalation, setActiveEscalation] = useState(null);
  const [showEscalationDetailsModal, setShowEscalationDetailsModal] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);

  useEffect(() => {
    console.log('Payments component received leaseDetails:', leaseDetails);
    if (leaseDetails?.property?._id) {
      console.log('Property ID found:', leaseDetails.property._id);
      fetchPayments();
      fetchEscalations();
    } else {
      console.log('No valid property ID found in leaseDetails:', leaseDetails);
      setLoading(false);
      setError('No active lease found');
    }
  }, [user._id, leaseDetails]);

  useEffect(() => {
    // Set default payment amount when leaseDetails changes
    if (leaseDetails?.property?.price) {
      setPaymentAmount(leaseDetails.property.price.toString());
    }
  }, [leaseDetails]);

  const fetchPayments = async () => {
    try {
      if (!leaseDetails?.property?._id) {
        console.log('No property ID available for fetching payments');
        setError('No active lease found');
        setLoading(false);
        return;
      }

      console.log('Fetching payments for property:', leaseDetails.property._id);
      // For landlords, fetch all payments for the property
      // For tenants, fetch only their payments
      const endpoint = user.role === 'landlord' 
        ? `${API_ENDPOINTS.PAYMENTS}/property/${leaseDetails.property._id}`
        : `${API_ENDPOINTS.PAYMENTS}/tenant/${user._id}`;
      
      console.log('Using endpoint:', endpoint);
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Payments response:', response.data);
      setPayments(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to fetch payment history');
      setPayments([]);
      setLoading(false);
    }
  };

  const fetchEscalations = async () => {
    try {
      if (!leaseDetails?.property?._id) {
        console.log('No property ID available for fetching escalations');
        return;
      }

      console.log('Fetching escalations for property:', leaseDetails.property._id);
      const response = await axios.get(`${API_ENDPOINTS.ESCALATIONS}/property/${leaseDetails.property._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Escalations response:', response.data);
      setEscalations(response.data || []);
      // Set active escalation if there is one
      const active = response.data?.find(esc => ['pending', 'in_review'].includes(esc.status));
      setActiveEscalation(active || null);
    } catch (err) {
      console.error('Error fetching escalations:', err);
      setEscalations([]);
      setActiveEscalation(null);
    }
  };

  const handlePayment = async () => {
    try {
      if (!leaseDetails?.property?._id) {
        toast.error('No active lease found');
        return;
      }

      // Validate amount
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }

      const paymentData = {
        propertyId: leaseDetails.property._id,
        amount,
        paymentMethod: selectedPaymentMethod,
        description: paymentDescription.trim() || 'Monthly Rent'
      };

      await axios.post(API_ENDPOINTS.PAYMENTS, paymentData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success('Payment successful!');
      // Reset form
      setPaymentDescription('Monthly Rent');
      setPaymentAmount(leaseDetails.property.price.toString());
      fetchPayments();
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error(err.response?.data?.message || 'Failed to process payment');
    }
  };

  const handleEscalation = async (escalationData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.ESCALATIONS, {
        propertyId: leaseDetails.property._id,
        tenantId: leaseDetails.tenant._id,
        ...escalationData
      });

      setActiveEscalation(response.data);
      toast.success('Escalation process initiated. Our team will contact you within 24 hours.');
      setShowEscalationModal(false);
    } catch (err) {
      console.error('Error initiating escalation:', err);
      toast.error('Failed to initiate escalation process');
    }
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.PAYMENTS, {
        ...paymentData,
        property: leaseDetails.property._id,
        tenant: leaseDetails.tenant._id,
        date: new Date().toISOString(),
        dueDate: new Date().toISOString()
      });

      setPayments(prev => [response.data, ...prev]);
      toast.success('Payment recorded successfully');
      setShowRecordPaymentModal(false);
    } catch (err) {
      console.error('Error recording payment:', err);
      toast.error('Failed to record payment');
    }
  };

  const hasOverduePayments = () => {
    return payments.some(payment => 
      payment.status === 'overdue' && 
      new Date(payment.dueDate) < new Date()
    );
  };

  const getEscalationButtonTooltip = () => {
    if (activeEscalation) {
      return `Active escalation: ${activeEscalation.status.replace('_', ' ').toUpperCase()}`;
    }
    if (!hasOverduePayments()) {
      return 'No overdue payments to escalate';
    }
    return 'Escalate missed payments to initiate end of tenancy process';
  };

  const getEscalationStatusColor = (status) => {
    switch (status) {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => fetchPayments()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!leaseDetails?.property?._id ? (
        <div className="text-center py-8 text-gray-500">
          No active lease found. Please ensure you have an approved application.
        </div>
      ) : (
        <>
          {/* Escalations Section */}
          {user.role === 'landlord' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Payment Escalations</h3>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<WarningIcon />}
                  onClick={() => setShowEscalationModal(true)}
                  disabled={!!activeEscalation}
                  className="bg-orange-500 hover:bg-orange-600"
                  title={activeEscalation ? 
                    `Active escalation: ${activeEscalation.status?.replace('_', ' ').toUpperCase()}` : 
                    'Escalate missed payments to initiate end of tenancy process'
                  }
                >
                  Escalate Missed Payments
                </Button>
              </div>

              {/* Escalations Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Resolved</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {escalations.length > 0 ? (
                      escalations.map((escalation) => (
                        <TableRow key={escalation._id}>
                          <TableCell>
                            <Chip
                              label={escalation.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                              color={getEscalationStatusColor(escalation.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {escalation.reason?.replace('_', ' ').toUpperCase() || 'Not specified'}
                          </TableCell>
                          <TableCell>
                            {escalation.description || 'No description provided'}
                          </TableCell>
                          <TableCell>
                            {formatDate(escalation.createdAt)}
                          </TableCell>
                          <TableCell>
                            {escalation.resolutionDate ? formatDate(escalation.resolutionDate) : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setSelectedEscalation(escalation);
                                setShowEscalationDetailsModal(true);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="textSecondary">
                            No escalations found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {activeEscalation && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  An escalation is currently active for this property. You can view the details or close the escalation when resolved.
                </Alert>
              )}
            </div>
          )}

          {/* Payments Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {user.role === 'landlord' ? 'Property Payment History' : 'Your Payment History'}
              </h3>
              {user.role === 'landlord' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setShowRecordPaymentModal(true)}
                >
                  Record Payment
                </Button>
              )}
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payment history available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      {user.role === 'landlord' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        {user.role === 'landlord' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {payment.tenant?.name || 'Unknown Tenant'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          ${payment.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <PaymentMethodBadge method={payment.paymentMethod} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <EscalationModal
            open={showEscalationModal}
            onClose={() => setShowEscalationModal(false)}
            onConfirm={handleEscalation}
            property={leaseDetails.property}
            tenant={leaseDetails.tenant}
          />

          <RecordPaymentModal
            open={showRecordPaymentModal}
            onClose={() => setShowRecordPaymentModal(false)}
            onConfirm={handleRecordPayment}
            propertyPrice={leaseDetails?.property?.price}
          />

          <EscalationDetailsModal
            open={showEscalationDetailsModal}
            onClose={() => {
              setShowEscalationDetailsModal(false);
              setSelectedEscalation(null);
            }}
            escalation={selectedEscalation}
            onStatusUpdate={fetchEscalations}
          />
        </>
      )}
    </div>
  );
};

export default Payments; 