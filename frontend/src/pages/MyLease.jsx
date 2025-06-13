import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { 
  Box, 
  Typography, 
  Paper,
  Tab,
  ThemeProvider,
  CircularProgress,
  Alert
} from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import MyTickets from './MyTickets';
import LeaseAgreement from '../components/lease/LeaseAgreement';
import Payments from '../components/lease/Payments';
import { toast } from 'react-hot-toast';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';
import BuildIcon from '@mui/icons-material/Build';
import ReceiptIcon from '@mui/icons-material/Receipt';
import theme from '../theme';
import { verticalTabStyles } from '../utils/uiUtils';
import EmptyState from '../components/EmptyState';

const MyLease = () => {
  const { user } = useAuth();
  const [leaseDetails, setLeaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState('lease');
  const [hasNewTickets, setHasNewTickets] = useState(false);

  const fetchLeaseDetails = async () => {
    if (!user) return;

    try {
      const response = await axios.get(`${API_ENDPOINTS.APPLICATIONS}/my-lease`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLeaseDetails(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching lease details:', error);
      setError('Failed to load lease details');
      toast.error('Failed to load lease details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaseDetails();
  }, []);

  const handleLeaseUpdate = (updatedLease) => {
    setLeaseDetails(updatedLease);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!leaseDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-gray-600 text-lg mb-4">No active lease found</div>
        <p className="text-gray-500">You need to have an approved application to view lease details.</p>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="bg-white" style={{ minHeight: '100vh' }}>
        <Box sx={{ p: 4 }}>
          <TabContext value={tabValue}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ borderRight: 1, borderColor: 'divider', pr: 2 }}>
                <TabList 
                  onChange={handleTabChange} 
                  value={tabValue}
                  orientation="vertical"
                  sx={{
                    '& .MuiTab-root': verticalTabStyles.root,
                    '& .Mui-selected': verticalTabStyles.selected,
                    '& .MuiTabs-indicator': {
                      display: 'none',
                    },
                  }}
                >
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <DescriptionIcon sx={{ fontSize: 28 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Typography>Lease Agreement</Typography>
                          <Typography variant="caption" color="text.secondary">
                            View and manage your lease
                          </Typography>
                        </Box>
                      </Box>
                    }
                    value="lease"
                  />
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <BuildIcon sx={{ fontSize: 28 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Typography>Repair Tickets</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {hasNewTickets ? 'New maintenance requests' : 'Manage maintenance requests'}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    value="tickets"
                  />
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <ReceiptIcon sx={{ fontSize: 28 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Typography>Payments</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Track rent and expenses
                          </Typography>
                        </Box>
                      </Box>
                    }
                    value="payments"
                  />
                </TabList>
              </Box>

              <Box sx={{ flex: 1 }}>
                <TabPanel value="lease" sx={{ p: 0 }}>
                  {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                      <CircularProgress />
                    </Box>
                  ) : error ? (
                    <Alert severity="error">{error}</Alert>
                  ) : leaseDetails ? (
                    <LeaseAgreement 
                      leaseDetails={leaseDetails} 
                      onLeaseUpdate={handleLeaseUpdate}
                    />
                  ) : (
                    <EmptyState
                      title="No Active Lease"
                      message="You don't have any active lease agreements."
                      icon={DescriptionIcon}
                    />
                  )}
                </TabPanel>
                <TabPanel value="tickets" sx={{ p: 0 }}>
                  <MyTickets 
                    propertyId={leaseDetails?.property?._id} 
                    onTicketUpdate={(hasNew) => setHasNewTickets(hasNew)}
                  />
                </TabPanel>
                <TabPanel value="payments" sx={{ p: 0 }}>
                  <Payments 
                    leaseDetails={leaseDetails}
                    onPaymentUpdate={() => {
                      // Refresh lease details to update payment status
                      fetchLeaseDetails();
                    }}
                  />
                </TabPanel>
              </Box>
            </Box>
          </TabContext>
        </Box>
      </div>
    </ThemeProvider>
  );
};

export default MyLease; 