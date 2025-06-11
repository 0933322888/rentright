import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { 
  Tabs, 
  Tab, 
  Box, 
  Typography, 
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  ThemeProvider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  IconButton
} from '@mui/material';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import theme from '../theme';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BuildIcon from '@mui/icons-material/Build';
import { toast } from 'react-hot-toast';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScoreIcon from '@mui/icons-material/Score';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import ErrorIcon from '@mui/icons-material/Error';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import LeaseAgreement from '../components/lease/LeaseAgreement';
import Payments from '../components/lease/Payments';

export default function MyProperties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [applicationCounts, setApplicationCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [innerTabValue, setInnerTabValue] = useState('overview');
  const [selectedTenantIndex, setSelectedTenantIndex] = useState('0');
  const [applications, setApplications] = useState([]);
  const [hasNewTickets, setHasNewTickets] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [clickedButton, setClickedButton] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(new Set());

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (properties.length > 0) {
      fetchApplications();
      fetchTickets();
    }
  }, [properties, selectedPropertyIndex]);

  useEffect(() => {
    if (properties.length > 0) {
      fetchApplicationCounts();
    }
  }, [properties]);

  const fetchApplicationCounts = async () => {
    try {
      const counts = {};
      for (const property of properties) {
        const response = await axios.get(API_ENDPOINTS.APPLICATIONS, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: {
            propertyId: property._id
          }
        });
        counts[property._id] = response.data.length;
      }
      setApplicationCounts(counts);
    } catch (error) {
      console.error('Error fetching application counts:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      console.log('Fetching properties for user:', user._id);
      const response = await axios.get(API_ENDPOINTS.PROPERTIES, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          landlord: user._id
        }
      });
      console.log('Fetched properties:', response.data);
      setProperties(response.data);
    } catch (error) {
      setError('Error fetching properties');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!properties[selectedPropertyIndex]) return;
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.APPLICATIONS}/property/${properties[selectedPropertyIndex]._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Populate property data for each application
      const populatedApplications = await Promise.all(
        response.data.map(async (app) => {
          if (app.property) {
            const propertyResponse = await axios.get(`${API_ENDPOINTS.PROPERTIES}/${app.property}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            return {
              ...app,
              property: propertyResponse.data
            };
          }
          return app;
        })
      );
      
      setApplications(populatedApplications);
      if (populatedApplications.length === 0) {
        setSelectedTenantIndex('0');
      } else if (parseInt(selectedTenantIndex) >= populatedApplications.length) {
        setSelectedTenantIndex((populatedApplications.length - 1).toString());
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      toast.error('Failed to fetch applications');
    }
  };

  const handleApplicationAction = async (applicationId, action) => {
    try {
      const property = properties[selectedPropertyIndex];
      await axios.put(
        `${API_ENDPOINTS.PROPERTIES}/${property._id}/applications/${applicationId}/status`,
        { status: action === 'approve' ? 'approved' : 'declined' },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchApplications(); // Refresh the applications list
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application status');
    }
  };

  const handleSubmit = async (propertyId) => {
    try {
      const property = properties.find(p => p._id === propertyId);
      if (!property) return;

      const submitData = new FormData();
      submitData.append('title', property.title);
      submitData.append('description', property.description);
      submitData.append('type', property.type);
      submitData.append('price', property.price);
      submitData.append('status', 'submitted');

      // Add location fields
      submitData.append('location[street]', property.location.street);
      submitData.append('location[city]', property.location.city);
      submitData.append('location[state]', property.location.state);
      submitData.append('location[zipCode]', property.location.zipCode);

      // Add features fields
      submitData.append('features[bedrooms]', property.features.bedrooms);
      submitData.append('features[bathrooms]', property.features.bathrooms);
      submitData.append('features[squareFootage]', property.features.squareFootage);
      submitData.append('features[furnished]', property.features.furnished);
      submitData.append('features[parking]', property.features.parking);
      submitData.append('features[petsAllowed]', property.features.petsAllowed);

      // Add existing images
      if (property.images && property.images.length > 0) {
        submitData.append('existingImages', JSON.stringify(property.images));
      }

      await axios.put(`${API_ENDPOINTS.PROPERTIES}/${propertyId}`, submitData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchProperties();
    } catch (error) {
      console.error('Error submitting property:', error);
    }
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.PROPERTIES}/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setProperties(properties.filter(property => property._id !== propertyId));
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to delete property. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePropertyTabChange = (event, newValue) => {
    setSelectedPropertyIndex(newValue);
  };

  const handleInnerTabChange = (event, newValue) => {
    setInnerTabValue(newValue);
  };

  const handleTenantTabChange = (event, newValue) => {
    setSelectedTenantIndex(newValue);
  };

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const property = properties[selectedPropertyIndex];
      const response = await axios.get(API_ENDPOINTS.PROPERTY_TICKETS(property._id), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTickets(response.data);
      setHasNewTickets(response.data.some(ticket => ticket.status === 'new'));
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTicketsError('Failed to load tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleTicketAction = async (ticketId, status) => {
    try {
      await axios.patch(`${API_ENDPOINTS.TICKETS}/${ticketId}/status`, 
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Refresh tickets after status update
      await fetchTickets();
      
      toast.success(`Ticket ${status === 'approved' ? 'approved' : 'declined'} successfully`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const handleNextImage = () => {
    const property = properties[selectedPropertyIndex];
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePrevImage = () => {
    const property = properties[selectedPropertyIndex];
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
      );
    }
  };

  // Reset currentImageIndex when property changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedPropertyIndex]);

  const handleImageError = (docId, e) => {
    if (!failedImages.has(docId)) {
      setFailedImages(prev => new Set([...prev, docId]));
      e.target.src = 'https://via.placeholder.com/400x300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your properties...</p>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="bg-red-50 rounded-full p-3 w-16 h-16 mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Properties</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchProperties}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="bg-primary-50 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              No Properties Yet
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start managing your properties by adding your first listing. You can add details, photos, and set up rental terms.
            </p>
            <div className="mt-8">
              <Link
                to="/properties/create"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Add Your First Property
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 -mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div
        className="bg-white p-6"
        style={{
          minHeight: '100vh',
        }}
      >
        <Box sx={{ p: 4 }}>
          <div className="mb-6">
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'primary.main', letterSpacing: 1 }}>
              My Properties
            </Typography>
            <p className="mt-2 text-sm text-gray-700" style={{ marginBottom: 32 }}>
              A list of all your properties and their current status.
            </p>
          </div>

          <TabContext value={selectedPropertyIndex}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
              <TabList 
                onChange={handlePropertyTabChange} 
                variant="scrollable"
                scrollButtons="auto"
                aria-label="property tabs"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 120,
                    opacity: 0.7,
                    transition: 'all 0.3s',
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                  },
                  '& .Mui-selected': {
                    opacity: 1,
                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                    borderRadius: '8px',
                    '& img': {
                      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                    },
                  },
                }}
              >
                {properties.map((property, index) => (
                  <Tab
                    key={property._id}
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                        <img
                          src={property.images && 
                                property.images.length > 0 && 
                                property.images[currentImageIndex] ? 
                            (typeof property.images[currentImageIndex] === 'string' && 
                             property.images[currentImageIndex].startsWith('http') 
                              ? property.images[currentImageIndex] 
                              : `http://localhost:5000/uploads/${property.images[currentImageIndex]}`)
                            : 'https://via.placeholder.com/400x300'}
                          alt={property.title}
                          className="w-24 h-24 object-cover rounded-lg mb-2"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300';
                          }}
                        />
                        <Typography variant="subtitle2" noWrap>
                          {property.title}
                        </Typography>
                      </Box>
                    }
                    value={index}
                  />
                ))}
                <Tab
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                      <Box
                        sx={{
                          width: 96,
                          height: 96,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed',
                          borderColor: 'primary.main',
                          borderRadius: 1,
                          mb: 2,
                          transition: 'all 0.3s',
                        }}
                      >
                        <Typography variant="h4" color="primary">
                          +
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" color="primary">
                        Add Property
                      </Typography>
                    </Box>
                  }
                  value={properties.length}
                  component={Link}
                  to="/properties/create"
                />
              </TabList>
            </Box>

            {properties.map((property, index) => (
              <TabPanel key={property._id} value={index}>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ borderRight: 1, borderColor: 'divider', pr: 2 }}>
                    <TabList 
                      onChange={handleInnerTabChange} 
                      value={innerTabValue}
                      orientation="vertical"
                      sx={{
                        '& .MuiTab-root': {
                          minHeight: 64,
                          alignItems: 'flex-start',
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          marginBottom: 1,
                          transition: 'all 0.2s',
                          backgroundColor: '#f5f5f5',
                          color: '#666',
                          border: '1px solid #e0e0e0',
                          '&:hover': {
                            backgroundColor: '#eeeeee',
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            border: '2px solid #1976d2',
                            '& .MuiTypography-root': {
                              color: '#1976d2',
                              fontWeight: 600,
                            },
                            '& .MuiTypography-caption': {
                              color: '#1976d2',
                            },
                            '& .MuiSvgIcon-root': {
                              color: '#1976d2',
                            },
                            '&:hover': {
                              backgroundColor: '#e3f2fd',
                            },
                          },
                        },
                        '& .MuiTabs-indicator': {
                          display: 'none',
                        },
                      }}
                    >
                      <Tab
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <HomeIcon sx={{ fontSize: 28 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Typography>Details</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Property information and status
                              </Typography>
                            </Box>
                          </Box>
                        }
                        value="overview"
                      />
                      <Tab
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <AssignmentIcon sx={{ fontSize: 28 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Typography>Applications</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {applications.length} pending applications
                              </Typography>
                            </Box>
                          </Box>
                        }
                        value="applications"
                      />
                      <Tab
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <DescriptionIcon sx={{ fontSize: 28 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Typography>Lease Agreement</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Manage tenant agreements
                              </Typography>
                            </Box>
                          </Box>
                        }
                        value="lease"
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
                      <Tab
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <BuildIcon sx={{ fontSize: 28 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Typography>Tickets</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {tickets.length} maintenance requests
                              </Typography>
                            </Box>
                          </Box>
                        }
                        value="tickets"
                      />
                    </TabList>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <TabContext value={innerTabValue}>
                      <TabPanel value="overview">
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Card sx={{ 
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                              borderRadius: 3,
                              animation: 'fadeIn 0.7s',
                              '@keyframes fadeIn': {
                                from: { opacity: 0, transform: 'translateY(24px)' },
                                to: { opacity: 1, transform: 'none' }
                              },
                              '&:hover': {
                                transform: 'translateY(-4px) scale(1.01)',
                                boxShadow: '0 8px 24px rgba(25,118,210,0.18)'
                              }
                            }}>
                              <Box sx={{ position: 'relative' }}>
                                <CardMedia
                                  component="img"
                                  height="800"
                                  image={property.images && 
                                        property.images.length > 0 && 
                                        property.images[currentImageIndex] ? 
                                    (typeof property.images[currentImageIndex] === 'string' && 
                                     property.images[currentImageIndex].startsWith('http') 
                                      ? property.images[currentImageIndex] 
                                      : `http://localhost:5000/uploads/${property.images[currentImageIndex]}`)
                                    : 'https://via.placeholder.com/400x300'}
                                  alt={property.title}
                                  sx={{
                                    position: 'relative',
                                    borderRadius: 3,
                                    height: '800px !important',
                                    width: '100% !important',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                                    '&:hover': {
                                      transform: 'scale(1.04)'
                                    }
                                  }}
                                />
                                {property.images && property.images.length > 1 && (
                                  <>
                                    <IconButton
                                      onClick={handlePrevImage}
                                      sx={{
                                        position: 'absolute',
                                        left: 16,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                                        '&:hover': {
                                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                                        },
                                        zIndex: 1
                                      }}
                                    >
                                      <NavigateBeforeIcon />
                                    </IconButton>
                                    <IconButton
                                      onClick={handleNextImage}
                                      sx={{
                                        position: 'absolute',
                                        right: 16,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                                        '&:hover': {
                                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                                        },
                                        zIndex: 1
                                      }}
                                    >
                                      <NavigateNextIcon />
                                    </IconButton>
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        bottom: 16,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        display: 'flex',
                                        gap: 1,
                                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                                        padding: '4px 8px',
                                        borderRadius: '16px',
                                        zIndex: 1
                                      }}
                                    >
                                      {property.images.map((_, index) => (
                                        <Box
                                          key={index}
                                          sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            bgcolor: index === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                          }}
                                          onClick={() => setCurrentImageIndex(index)}
                                        />
                                      ))}
                                    </Box>
                                  </>
                                )}
                              </Box>
                              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                  <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold', fontSize: '2rem', color: 'text.primary' }}>
                                    {property.title}
                                  </Typography>
                                  <Chip 
                                    label={property.status} 
                                    color={
                                      property.status === 'active' ? 'success' :
                                      property.status === 'pending' ? 'warning' :
                                      property.status === 'rented' ? 'info' :
                                      'default'
                                    }
                                    size="small"
                                    sx={{ 
                                      fontWeight: 'medium',
                                      '& .MuiChip-label': { px: 1 }
                                    }}
                                  />
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1, fontSize: '1.1rem' }}>
                                  {property.description}
                                </Typography>

                                <Box sx={{ 
                                  display: 'flex', 
                                  flexWrap: 'wrap', 
                                  gap: 1, 
                                  mb: 2,
                                  '& > *': { flex: '1 1 auto' }
                                }}>
                                  <Chip
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>}
                                    label={`$${property.price}/month`}
                                    variant="outlined"
                                    size="small"
                                  />
                                  <Chip
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>}
                                    label={`${property.location.city}, ${property.location.state}`}
                                    variant="outlined"
                                    size="small"
                                  />
                                </Box>

                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: 1,
                                  mt: 'auto',
                                  pt: 2,
                                  borderTop: 1,
                                  borderColor: 'divider'
                                }}>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    component={Link}
                                    to={`/properties/edit/${property._id}`}
                                    startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>}
                                    fullWidth
                                    sx={{
                                      borderRadius: 999,
                                      boxShadow: '0 2px 8px rgba(25,118,210,0.10)',
                                      transition: 'all 0.2s',
                                      fontWeight: 600,
                                      '&:hover': {
                                        boxShadow: '0 4px 16px rgba(25,118,210,0.18)',
                                        transform: 'scale(1.03)'
                                      }
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  {property.status === 'new' && (
                                    <Button
                                      variant="contained"
                                      color="success"
                                      onClick={() => handleSubmit(property._id)}
                                      startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>}
                                      fullWidth
                                      sx={{
                                        borderRadius: 999,
                                        boxShadow: '0 2px 8px rgba(46,125,50,0.10)',
                                        transition: 'all 0.2s',
                                        fontWeight: 600,
                                        '&:hover': {
                                          boxShadow: '0 4px 16px rgba(46,125,50,0.18)',
                                          transform: 'scale(1.03)'
                                        }
                                      }}
                                    >
                                      Submit
                                    </Button>
                                  )}
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => {
                                      setClickedButton('delete');
                                      setTimeout(() => setClickedButton(null), 300);
                                      handleDelete(property._id);
                                    }}
                                    startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>}
                                    fullWidth
                                    sx={{
                                      borderRadius: 999,
                                      boxShadow: '0 2px 8px rgba(211,47,47,0.10)',
                                      transition: 'all 0.2s, background-color 0.2s',
                                      fontWeight: 600,
                                      backgroundColor: clickedButton === 'delete' ? 'rgba(211,47,47,0.15)' : undefined,
                                      '&:hover': {
                                        boxShadow: '0 4px 16px rgba(211,47,47,0.18)',
                                        transform: 'scale(1.03)'
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </TabPanel>
                      <TabPanel value="applications">
                        {applications.length === 0 ? (
                          <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <div className="bg-gray-50 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <Typography variant="h6" gutterBottom>
                              No Applications Yet
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              When tenants apply for this property, their applications will appear here.
                            </Typography>
                          </Paper>
                        ) : (
                          <TabContext value={applications.length > 0 ? selectedTenantIndex : '0'}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                              <TabList 
                                onChange={handleTenantTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                  '& .MuiTab-root': {
                                    minHeight: 72,
                                    padding: '12px 16px',
                                    textTransform: 'none',
                                    '&.Mui-selected': {
                                      backgroundColor: 'rgba(25, 118, 210, 0.12)',
                                      borderRadius: '8px',
                                    },
                                  },
                                }}
                              >
                                {applications.map((application, index) => (
                                  <Tab 
                                    key={application._id}
                                    label={
                                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                          {application.tenant.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Applied {new Date(application.createdAt).toLocaleDateString()}
                                        </Typography>
                                        <Chip
                                          label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                          color={
                                            application.status === 'approved' ? 'success' :
                                            application.status === 'rejected' ? 'error' :
                                            application.status === 'viewing' ? 'info' :
                                            'warning'
                                          }
                                          sx={{ mt: 0.5 }}
                                        />
                                      </Box>
                                    }
                                    value={index.toString()}
                                  />
                                ))}
                              </TabList>
                            </Box>
                            {applications.map((application, index) => (
                              <TabPanel key={application._id} value={index.toString()}>
                                <Paper sx={{ p: 3 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                    <Box>
                                      <Typography variant="h6" gutterBottom>
                                        {application.tenant.name}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Applied on {new Date(application.createdAt).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                      color={
                                        application.status === 'approved' ? 'success' :
                                        application.status === 'rejected' ? 'error' :
                                        application.status === 'viewing' ? 'info' :
                                        'warning'
                                      }
                                      sx={{ ml: 2 }}
                                    />
                                  </Box>

                                  {/* Application Actions */}
                                  {application.status === 'pending' && (
                                    <Box sx={{ 
                                      mt: 3, 
                                      p: 2, 
                                      bgcolor: 'background.paper',
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      display: 'flex',
                                      justifyContent: 'flex-end',
                                      gap: 2
                                    }}>
                                      <Button
                                        variant="contained"
                                        color="success"
                                        onClick={() => handleApplicationAction(application._id, 'approve')}
                                        startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>}
                                        sx={{
                                          minWidth: 120,
                                          borderRadius: 2,
                                          textTransform: 'none',
                                          fontWeight: 600,
                                          boxShadow: '0 2px 4px rgba(46,125,50,0.2)',
                                          '&:hover': {
                                            boxShadow: '0 4px 8px rgba(46,125,50,0.3)',
                                          }
                                        }}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        variant="contained"
                                        color="error"
                                        onClick={() => handleApplicationAction(application._id, 'reject')}
                                        startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>}
                                        sx={{
                                          minWidth: 120,
                                          borderRadius: 2,
                                          textTransform: 'none',
                                          fontWeight: 600,
                                          boxShadow: '0 2px 4px rgba(211,47,47,0.2)',
                                          '&:hover': {
                                            boxShadow: '0 4px 8px rgba(211,47,47,0.3)',
                                          }
                                        }}
                                      >
                                        Reject
                                      </Button>
                                    </Box>
                                  )}

                                  {application.status === 'viewing' && (
                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                                      <Typography variant="body2" color="info.contrastText">
                                        This application is pending a property viewing. You can review the application after the viewing is completed.
                                      </Typography>
                                      {application.viewingDate && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="body2" color="info.contrastText">
                                            Scheduled viewing: {new Date(application.viewingDate).toLocaleDateString()} at {application.viewingTime}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  )}

                                  {/* Application Details */}
                                  <Grid container spacing={3}>
                                    {/* Tenant Score Section */}
                                    <Grid item xs={12} md={4}>
                                      <Paper 
                                        variant="outlined" 
                                        sx={{ 
                                          p: 2,
                                          height: '100%',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 2,
                                          transition: 'all 0.2s',
                                          '&:hover': {
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                          }
                                        }}
                                      >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <ScoreIcon color="primary" />
                                          <Typography variant="subtitle1" fontWeight="bold">
                                            Tenant Score
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography 
                                              variant="h3" 
                                              color={
                                                application.tenantScoring >= 80 ? 'success.main' :
                                                application.tenantScoring >= 60 ? 'warning.main' :
                                                'error.main'
                                              }
                                              fontWeight="bold"
                                            >
                                              {application.tenantScoring}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                              out of 100
                                            </Typography>
                                          </Box>
                                          <Box sx={{ mt: 2 }}>
                                            <LinearProgress 
                                              variant="determinate" 
                                              value={application.tenantScoring} 
                                              sx={{
                                                height: 10,
                                                borderRadius: 5,
                                                backgroundColor: 'grey.200',
                                                '& .MuiLinearProgress-bar': {
                                                  backgroundColor: 
                                                    application.tenantScoring >= 80 ? 'success.main' :
                                                    application.tenantScoring >= 60 ? 'warning.main' :
                                                    'error.main'
                                                }
                                              }}
                                            />
                                          </Box>
                                          <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2" color="text.secondary" align="center">
                                              {application.tenantScoring >= 80 ? 'Excellent' :
                                               application.tenantScoring >= 60 ? 'Good' :
                                               'Needs Review'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Paper>
                                    </Grid>

                                    {/* Viewing Schedule Section */}
                                    <Grid item xs={12} md={4}>
                                      <Paper 
                                        variant="outlined" 
                                        sx={{ 
                                          p: 2,
                                          height: '100%',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 2,
                                          transition: 'all 0.2s',
                                          '&:hover': {
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                          }
                                        }}
                                      >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <CalendarTodayIcon color="primary" />
                                          <Typography variant="subtitle1" fontWeight="bold">
                                            Viewing Schedule
                                          </Typography>
                                        </Box>
                                        {application.viewingDate ? (
                                          <Box sx={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            gap: 2,
                                            flex: 1,
                                            justifyContent: 'center'
                                          }}>
                                            <Box sx={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: 2,
                                              p: 2,
                                              bgcolor: 'primary.light',
                                              borderRadius: 2,
                                              color: 'primary.contrastText'
                                            }}>
                                              <CalendarTodayIcon />
                                              <Box>
                                                <Typography variant="subtitle2">
                                                  {new Date(application.viewingDate).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="body2">
                                                  {application.viewingTime}
                                                </Typography>
                                              </Box>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" align="center">
                                              Please be available at the scheduled time
                                            </Typography>
                                          </Box>
                                        ) : (
                                          <Box sx={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flex: 1,
                                            gap: 1
                                          }}>
                                            <AccessTimeIcon color="action" sx={{ fontSize: 40 }} />
                                            <Typography variant="body2" color="text.secondary">
                                              No viewing scheduled yet
                                            </Typography>
                                          </Box>
                                        )}
                                      </Paper>
                                    </Grid>

                                    {/* Contact Information Section */}
                                    <Grid item xs={12} md={4}>
                                      <Paper 
                                        variant="outlined" 
                                        sx={{ 
                                          p: 2,
                                          height: '100%',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 2,
                                          transition: 'all 0.2s',
                                          '&:hover': {
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                          }
                                        }}
                                      >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <ContactMailIcon color="primary" />
                                          <Typography variant="subtitle1" fontWeight="bold">
                                            Contact Information
                                          </Typography>
                                        </Box>
                                        <Box sx={{ 
                                          display: 'flex', 
                                          flexDirection: 'column', 
                                          gap: 2,
                                          flex: 1,
                                          justifyContent: 'center'
                                        }}>
                                          <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 2,
                                            p: 2,
                                            bgcolor: 'grey.100',
                                            borderRadius: 2
                                          }}>
                                            <EmailIcon color="action" />
                                            <Typography variant="body2">
                                              {application.tenant.email}
                                            </Typography>
                                          </Box>
                                          <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 2,
                                            p: 2,
                                            bgcolor: 'grey.100',
                                            borderRadius: 2
                                          }}>
                                            <PhoneIcon color="action" />
                                            <Typography variant="body2">
                                              {application.tenant.phone || 'Not provided'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Paper>
                                    </Grid>
                                  </Grid>

                                  {/* Tenant Profile Questions Section */}
                                  {application.tenantDocument && (
                                    <Paper 
                                      variant="outlined" 
                                      sx={{ mt: 3, p: 3, transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                        <PersonIcon color="primary" />
                                        <Typography variant="h6" fontWeight="bold">Tenant Profile</Typography>
                                      </Box>

                                      {/* --- Tenant Profile Summary --- */}
                                      {(() => {
                                        // Extract and parse values safely
                                        const netIncome = Number(application.tenantDocument.monthlyNetIncome) || 0;
                                        const additionalIncome = application.tenantDocument.hasAdditionalIncome === 'yes' ? (Number(application.tenantDocument.additionalIncomeAmount) || 0) : 0;
                                        const debt = Number(application.tenantDocument.monthlyDebtRepayment) || 0;
                                        const currentRent = application.tenantDocument.currentlyPaysRent === 'yes' ? (Number(application.tenantDocument.currentRentAmount) || 0) : 0;
                                        const totalIncome = netIncome + additionalIncome;
                                        const totalExpenses = debt + currentRent;
                                        const netDisposable = totalIncome - totalExpenses;
                                        const incomeExpenseRatio = totalExpenses > 0 ? totalIncome / totalExpenses : null;
                                        let riskLevel = 'Low Risk';
                                        let riskColor = 'success';
                                        if (incomeExpenseRatio !== null) {
                                          if (incomeExpenseRatio < 1) { riskLevel = 'High Risk'; riskColor = 'error'; }
                                          else if (incomeExpenseRatio < 2) { riskLevel = 'Medium Risk'; riskColor = 'warning'; }
                                        }
                                        return (
                                          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                                            <Box sx={{ minWidth: 180 }}>
                                              <Typography variant="subtitle2" color="text.secondary">Net Disposable Income</Typography>
                                              <Typography variant="h6" fontWeight="bold" title="Net Disposable = Income + Additional - Debts - Rent">
                                                ${netDisposable.toLocaleString()}
                                              </Typography>
                                            </Box>
                                            <Box sx={{ minWidth: 220 }}>
                                              <Typography variant="subtitle2" color="text.secondary">Income vs. Expenses Ratio</Typography>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 100, mr: 1 }}>
                                                  <LinearProgress 
                                                    variant="determinate" 
                                                    value={incomeExpenseRatio !== null ? Math.min(incomeExpenseRatio * 50, 100) : 0} 
                                                    color={riskColor}
                                                    sx={{ height: 10, borderRadius: 5 }}
                                                  />
                                                </Box>
                                                <Typography variant="body1" fontWeight="bold">
                                                  {incomeExpenseRatio !== null ? incomeExpenseRatio.toFixed(2) : 'N/A'}
                                                </Typography>
                                              </Box>
                                            </Box>
                                            <Box>
                                              <Typography variant="subtitle2" color="text.secondary">Risk Level</Typography>
                                              <Chip label={riskLevel} color={riskColor} sx={{ fontWeight: 'bold', fontSize: 16 }} />
                                            </Box>
                                          </Box>
                                        );
                                      })()}
                                      {/* --- End Tenant Profile Summary --- */}

                                      <Grid container spacing={3}>
                                        {/* Employment & Income Section */}
                                        <Grid item xs={12}>
                                          <Box sx={{ 
                                            p: 2, 
                                            bgcolor: 'grey.50', 
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                          }}>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                              Employment & Income
                                            </Typography>
                                            <Grid container spacing={2}>
                                              <Grid item xs={12} md={6}>
                                                <Box sx={{ 
                                                  p: 1.5,
                                                  bgcolor: 'white',
                                                  borderRadius: 1
                                                }}>
                                                  <Typography variant="body2" color="text.secondary">
                                                    Employment Status
                                                  </Typography>
                                                  <Typography variant="body1">
                                                    {application.tenantDocument.isCurrentlyEmployed === 'yes' ? 'Currently Employed' : 'Not Currently Employed'}
                                                  </Typography>
                                                </Box>
                                              </Grid>
                                              {application.tenantDocument.isCurrentlyEmployed === 'yes' && (
                                                <>
                                                  <Grid item xs={12} md={6}>
                                                    <Box sx={{ 
                                                      p: 1.5,
                                                      bgcolor: 'white',
                                                      borderRadius: 1
                                                    }}>
                                                      <Typography variant="body2" color="text.secondary">
                                                        Employment Type
                                                      </Typography>
                                                      <Typography variant="body1">
                                                        {application.tenantDocument.employmentType}
                                                      </Typography>
                                                    </Box>
                                                  </Grid>
                                                  <Grid item xs={12} md={6}>
                                                    <Box sx={{ 
                                                      p: 1.5,
                                                      bgcolor: 'white',
                                                      borderRadius: 1
                                                    }}>
                                                      <Typography variant="body2" color="text.secondary">
                                                        Monthly Net Income
                                                      </Typography>
                                                      <Typography variant="body1">
                                                        ${application.tenantDocument.monthlyNetIncome?.toLocaleString()}
                                                      </Typography>
                                                    </Box>
                                                  </Grid>
                                                </>
                                              )}
                                              <Grid item xs={12}>
                                                <Box sx={{ 
                                                  p: 1.5,
                                                  bgcolor: 'white',
                                                  borderRadius: 1
                                                }}>
                                                  <Typography variant="body2" color="text.secondary">
                                                    Additional Income
                                                  </Typography>
                                                  <Typography variant="body1">
                                                    {application.tenantDocument.hasAdditionalIncome === 'yes' 
                                                      ? `Yes - ${application.tenantDocument.additionalIncomeDescription}`
                                                      : 'No additional income'}
                                                  </Typography>
                                                </Box>
                                              </Grid>
                                            </Grid>
                                          </Box>
                                        </Grid>

                                        {/* Expenses & Debts Section */}
                                        <Grid item xs={12}>
                                          <Box sx={{ 
                                            p: 2, 
                                            bgcolor: 'grey.50', 
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                          }}>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                              Expenses & Debts
                                            </Typography>
                                            <Grid container spacing={2}>
                                              <Grid item xs={12} md={6}>
                                                <Box sx={{ 
                                                  p: 1.5,
                                                  bgcolor: 'white',
                                                  borderRadius: 1
                                                }}>
                                                  <Typography variant="body2" color="text.secondary">
                                                    Monthly Debt Repayment
                                                  </Typography>
                                                  <Typography variant="body1">
                                                    ${application.tenantDocument.monthlyDebtRepayment?.toLocaleString()}
                                                  </Typography>
                                                </Box>
                                              </Grid>
                                              <Grid item xs={12} md={6}>
                                                <Box sx={{ 
                                                  p: 1.5,
                                                  bgcolor: 'white',
                                                  borderRadius: 1
                                                }}>
                                                  <Typography variant="body2" color="text.secondary">
                                                    Child/Spousal Support
                                                  </Typography>
                                                  <Typography variant="body1">
                                                    {application.tenantDocument.paysChildSupport === 'yes'
                                                      ? `Yes - $${application.tenantDocument.childSupportAmount?.toLocaleString()}`
                                                      : 'No'}
                                                  </Typography>
                                                </Box>
                                              </Grid>
                                            </Grid>
                                          </Box>
                                        </Grid>

                                        {/* Rental History Section */}
                                        <Grid item xs={12}>
                                          <Box sx={{ 
                                            p: 2, 
                                            bgcolor: 'grey.50', 
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                          }}>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                              Rental History
                                            </Typography>
                                            <Grid container spacing={2}>
                                              <Grid item xs={12} md={6}>
                                                <Box sx={{ 
                                                  p: 1.5,
                                                  bgcolor: 'white',
                                                  borderRadius: 1
                                                }}>
                                                  <Typography variant="body2" color="text.secondary">
                                                    Eviction History
                                                  </Typography>
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {application.tenantDocument.hasBeenEvicted === 'yes' ? (
                                                      <ErrorIcon color="error" />
                                                    ) : (
                                                      <CheckCircleIcon color="success" />
                                                    )}
                                                    <Typography variant="body1">
                                                      {application.tenantDocument.hasBeenEvicted === 'yes' 
                                                        ? 'Has been evicted previously' 
                                                        : 'No previous evictions'}
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                              </Grid>
                                              <Grid item xs={12} md={6}>
                                                <Box sx={{ 
                                                  p: 1.5,
                                                  bgcolor: 'white',
                                                  borderRadius: 1
                                                }}>
                                                  <Typography variant="body2" color="text.secondary">
                                                    Current Rent
                                                  </Typography>
                                                  <Typography variant="body1">
                                                    {application.tenantDocument.currentlyPaysRent === 'yes'
                                                      ? `$${application.tenantDocument.currentRentAmount?.toLocaleString()}`
                                                      : 'Not currently renting'}
                                                  </Typography>
                                                </Box>
                                              </Grid>
                                            </Grid>
                                          </Box>
                                        </Grid>

                                        {/* Financial Preparedness Section */}
                                        <Grid item xs={12}>
                                          <Box sx={{ 
                                            p: 2, 
                                            bgcolor: 'grey.50', 
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                          }}>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                              Financial Preparedness
                                            </Typography>
                                            <Grid container spacing={2}>
                                              <Grid item xs={12} md={6}>
                                                <Box sx={{ 
                                                  p: 1.5,
                                                  bgcolor: 'white',
                                                  borderRadius: 1
                                                }}>
                                                  <Typography variant="body2" color="text.secondary">
                                                    Two Months Rent Savings
                                                  </Typography>
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {application.tenantDocument.hasTwoMonthsRentSavings === 'yes' ? (
                                                      <CheckCircleIcon color="success" />
                                                    ) : (
                                                      <InfoIcon color="info" />
                                                    )}
                                                    <Typography variant="body1">
                                                      {application.tenantDocument.hasTwoMonthsRentSavings === 'yes'
                                                        ? 'Has savings equivalent to two months rent'
                                                        : 'Does not have two months rent in savings'}
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                              </Grid>
                                              <Grid item xs={12} md={6}>
                                                <Box sx={{ 
                                                  p: 1.5,
                                                  bgcolor: 'white',
                                                  borderRadius: 1
                                                }}>
                                                  <Typography variant="body2" color="text.secondary">
                                                    Financial Documents
                                                  </Typography>
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {application.tenantDocument.canShareFinancialDocuments === 'yes' ? (
                                                      <CheckCircleIcon color="success" />
                                                    ) : (
                                                      <InfoIcon color="info" />
                                                    )}
                                                    <Typography variant="body1">
                                                      {application.tenantDocument.canShareFinancialDocuments === 'yes'
                                                        ? 'Willing to share financial documents'
                                                        : 'Not willing to share financial documents'}
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                              </Grid>
                                            </Grid>
                                          </Box>
                                        </Grid>

                                        {/* Payment Capability Section */}
                                        <Grid item xs={12}>
                                          <Box sx={{ 
                                            p: 2, 
                                            bgcolor: 'grey.50', 
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                          }}>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                              Payment Capability
                                            </Typography>
                                            <Grid container spacing={2}>
                                              <Grid item xs={12}>
                                                <Box sx={{ 
                                                  p: 1.5,
                                                  bgcolor: 'white',
                                                  borderRadius: 1
                                                }}>
                                                  <Typography variant="body2" color="text.secondary">
                                                    Advance Payment
                                                  </Typography>
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {application.tenantDocument.canPayMoreThanOneMonth === 'yes' ? (
                                                      <CheckCircleIcon color="success" />
                                                    ) : (
                                                      <InfoIcon color="info" />
                                                    )}
                                                    <Typography variant="body1">
                                                      {application.tenantDocument.canPayMoreThanOneMonth === 'yes'
                                                        ? `Can pay up to ${application.tenantDocument.monthsAheadCanPay} months in advance`
                                                        : 'Can pay one month at a time'}
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                              </Grid>
                                            </Grid>
                                          </Box>
                                        </Grid>
                                      </Grid>
                                    </Paper>
                                  )}

                                  {application.tenantDocument && (
                                    <Accordion 
                                      defaultExpanded={false}
                                      sx={{
                                        mt: 3,
                                        '&:before': { display: 'none' },
                                        boxShadow: 'none',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: '8px !important',
                                      }}
                                    >
                                      <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls="tenant-documents-content"
                                        id="tenant-documents-header"
                                        sx={{
                                          '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                          },
                                        }}
                                      >
                                        <Typography variant="h6">Tenant Documents</Typography>
                                      </AccordionSummary>
                                      <AccordionDetails>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                          {['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'].map((field) => (
                                            <Box key={field} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                                {field.replace(/([A-Z])/g, ' $1').trim()}
                                              </Typography>
                                              {application.tenantDocument[field]?.length > 0 ? (
                                                <Grid container spacing={2}>
                                                  {application.tenantDocument[field].map((doc, docIndex) => (
                                                    <Grid item xs={12} sm={6} md={4} key={docIndex}>
                                                      <Box sx={{ 
                                                        p: 2, 
                                                        border: '1px solid', 
                                                        borderColor: 'divider', 
                                                        borderRadius: 1,
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                                        }
                                                      }}>
                                                        {doc.thumbnailUrl ? (
                                                          <img
                                                            src={failedImages.has(doc._id) 
                                                              ? 'https://via.placeholder.com/400x300'
                                                              : doc.thumbnailUrl.startsWith('http') 
                                                                ? doc.thumbnailUrl 
                                                                : `${import.meta.env.VITE_API_URL}${doc.thumbnailUrl}`}
                                                            alt={`${field} ${docIndex + 1}`}
                                                            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                                            onError={(e) => handleImageError(doc._id, e)}
                                                          />
                                                        ) : (
                                                          <Box sx={{ 
                                                            height: '200px', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            bgcolor: 'grey.100',
                                                            borderRadius: 1
                                                          }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                              Document Preview
                                                            </Typography>
                                                          </Box>
                                                        )}
                                                        <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                                                          {doc.filename}
                                                        </Typography>
                                                        <Button
                                                          variant="outlined"
                                                          size="small"
                                                          startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                          </svg>}
                                                          onClick={() => {
                                                            const url = doc.url.startsWith('http') 
                                                              ? doc.url 
                                                              : `${import.meta.env.VITE_API_URL}${doc.url}`;
                                                            window.open(url, '_blank');
                                                          }}
                                                          fullWidth
                                                        >
                                                          Download
                                                        </Button>
                                                      </Box>
                                                    </Grid>
                                                  ))}
                                                </Grid>
                                              ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                  No documents uploaded
                                                </Typography>
                                              )}
                                            </Box>
                                          ))}
                                        </Box>
                                      </AccordionDetails>
                                    </Accordion>
                                  )}
                                </Paper>
                              </TabPanel>
                            ))}
                          </TabContext>
                        )}
                      </TabPanel>
                      <TabPanel value="lease">
                        {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                          <Box sx={{ p: 2 }}>
                            <LeaseAgreement 
                              leaseDetails={applications.find(app => app.status === 'approved')} 
                            />
                          </Box>
                        ) : (
                          <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                              Lease Agreement
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              No approved applications yet. Lease agreements will be available once an application is approved.
                            </Typography>
                          </Paper>
                        )}
                      </TabPanel>
                      <TabPanel value="payments">
                        {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                          <Box sx={{ p: 2 }}>
                            {(() => {
                              const approvedApp = applications.find(app => app.status === 'approved');
                              // Ensure property data is populated
                              if (!approvedApp.property || typeof approvedApp.property === 'string') {
                                return (
                                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="h6" gutterBottom>
                                      Loading Payment History
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                      Please wait while we load the property details...
                                    </Typography>
                                  </Paper>
                                );
                              }
                              return (
                                <Payments 
                                  leaseDetails={{
                                    ...approvedApp,
                                    property: {
                                      ...approvedApp.property,
                                      _id: approvedApp.property._id || approvedApp.property
                                    }
                                  }} 
                                />
                              );
                            })()}
                          </Box>
                        ) : (
                          <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                              Payment History
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              No approved applications yet. Payment history will be available once an application is approved.
                            </Typography>
                          </Paper>
                        )}
                      </TabPanel>
                      <TabPanel value="tickets">
                        {ticketsLoading ? (
                          <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography>Loading tickets...</Typography>
                          </Paper>
                        ) : ticketsError ? (
                          <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="error">{ticketsError}</Typography>
                          </Paper>
                        ) : tickets.length === 0 ? (
                          <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                              No Tickets Yet
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              There are no maintenance tickets for this property at the moment.
                            </Typography>
                          </Paper>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {tickets.map((ticket) => (
                              <Paper key={ticket._id} sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                  <Box>
                                    <Typography variant="h6">
                                      {ticket.tenant.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {new Date(ticket.createdAt).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                    color={
                                      ticket.status === 'approved' ? 'success' :
                                      ticket.status === 'declined' ? 'error' :
                                      ticket.status === 'new' ? 'info' :
                                      'warning'
                                    }
                                  />
                                </Box>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                  {ticket.description}
                                </Typography>
                                {ticket.status === 'new' && (
                                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                    <Button
                                      variant="contained"
                                      color="error"
                                      onClick={() => handleTicketAction(ticket._id, 'declined')}
                                    >
                                      Decline
                                    </Button>
                                    <Button
                                      variant="contained"
                                      color="success"
                                      onClick={() => handleTicketAction(ticket._id, 'approved')}
                                    >
                                      Approve
                                    </Button>
                                  </Box>
                                )}
                              </Paper>
                            ))}
                          </Box>
                        )}
                      </TabPanel>
                    </TabContext>
                  </Box>
                </Box>
              </TabPanel>
            ))}
          </TabContext>
        </Box>
      </div>
    </ThemeProvider>
  );
} 