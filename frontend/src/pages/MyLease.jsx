import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { 
  Box, 
  Typography, 
  Paper,
  Tab
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

const MyLease = () => {
  const { user } = useAuth();
  const [leaseDetails, setLeaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState('lease');
  const [hasNewTickets, setHasNewTickets] = useState(false);

  useEffect(() => {
    const fetchLeaseDetails = async () => {
      if (!user) return;

      try {
        const response = await axios.get(API_ENDPOINTS.APPLICATIONS, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const approvedApplication = response.data.find(app => app.status === 'approved');
        
        if (approvedApplication) {
          setLeaseDetails(approvedApplication);
        } else {
          setError('No approved application found');
        }
      } catch (err) {
        console.error('Error fetching lease details:', err);
        setError('Failed to fetch lease details. Please try again later.');
        toast.error('Failed to fetch lease details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaseDetails();
  }, [user]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TabContext value={tabValue}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ borderRight: 1, borderColor: 'divider', pr: 2 }}>
            <TabList 
              onChange={handleTabChange} 
              value={tabValue}
              orientation="vertical"
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'success.light' }} />
                    <Typography>Lease Agreement</Typography>
                  </Box>
                }
                value="lease"
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {hasNewTickets ? (
                      <InfoIcon sx={{ color: 'info.light' }} />
                    ) : (
                      <CheckCircleIcon sx={{ color: 'success.light' }} />
                    )}
                    <Typography>Repair Tickets</Typography>
                  </Box>
                }
                value="tickets"
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'success.light' }} />
                    <Typography>Payments</Typography>
                  </Box>
                }
                value="payments"
              />
            </TabList>
          </Box>

          <Box sx={{ flex: 1 }}>
            <TabPanel value="lease">
              <LeaseAgreement leaseDetails={leaseDetails} />
            </TabPanel>
            <TabPanel value="tickets">
              <MyTickets propertyId={leaseDetails.property._id} />
            </TabPanel>
            <TabPanel value="payments">
              <Payments leaseDetails={leaseDetails} />
            </TabPanel>
          </Box>
        </Box>
      </TabContext>
    </div>
  );
};

export default MyLease; 