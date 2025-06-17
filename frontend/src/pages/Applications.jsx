import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

export default function Applications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.APPLICATIONS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error.response?.data || error);
      setError('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        navigate('/login');
        return;
      }

      await axios.delete(
        `${API_ENDPOINTS.APPLICATIONS}/${applicationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Application deleted successfully');
      setApplications(applications.filter(app => app._id !== applicationId));
      setDeleteDialogOpen(false);
      setApplicationToDelete(null);
    } catch (error) {
      console.error('Error deleting application:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete application. Please try again.';
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'viewing':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon />;
      case 'rejected':
        return <CancelIcon />;
      case 'viewing':
        return <VisibilityIcon />;
      case 'pending':
        return <HourglassEmptyIcon />;
      default:
        return null;
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const filteredApplications = applications.filter(app => {
    if (!app || !app.property || !app.tenant || !app.tenant._id || !user || !user._id) return false;
    return app.tenant._id === user._id;
  });

  if (filteredApplications.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            My Applications
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/properties')}
          >
            Find Properties
          </Button>
        </Box>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Applications Yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Start your journey by applying for a property.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          My Applications
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/properties')}
        >
          Find More Properties
        </Button>
      </Box>

      <Grid container spacing={2}>
        {filteredApplications.map((application) => (
          <Grid item xs={12} key={application._id}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {application.property?.title || 'Property not found'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationOnIcon color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {application.property?.location?.street}, {application.property?.location?.city}, {application.property?.location?.state}
                    </Typography>
                  </Box>
                  {application.viewingDate && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarTodayIcon color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          Viewing Date: {new Date(application.viewingDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AccessTimeIcon color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          Viewing Time: {application.viewingTime}
                        </Typography>
                      </Box>
                    </>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Applied: {new Date(application.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <Chip
                    icon={getStatusIcon(application.status)}
                    label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    color={getStatusColor(application.status)}
                  />
                  {application.status === 'new' && (
                    <Tooltip title="Delete Application">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setApplicationToDelete(application._id);
                          setDeleteDialogOpen(true);
                        }}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setApplicationToDelete(null);
        }}
      >
        <DialogTitle>Delete Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this application? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setApplicationToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(applicationToDelete)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}