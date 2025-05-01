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
  AccordionDetails
} from '@mui/material';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import theme from '../theme';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoIcon from '@mui/icons-material/Info';
import { toast } from 'react-hot-toast';

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
      const response = await axios.get(API_ENDPOINTS.PROPERTIES, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          landlord: user._id
        }
      });
      setProperties(response.data);
    } catch (error) {
      setError('Error fetching properties');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const property = properties[selectedPropertyIndex];
      const response = await axios.get(API_ENDPOINTS.PROPERTY_APPLICATIONS(property._id), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setApplications(response.data);
      if (response.data.length === 0) {
        setSelectedTenantIndex('0');
      } else if (parseInt(selectedTenantIndex) >= response.data.length) {
        setSelectedTenantIndex((response.data.length - 1).toString());
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
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
      submitData.append('status', 'Submitted');

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
        property.images.forEach(image => {
          submitData.append('existingImages', image);
        });
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

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-red-600">
        <p>{error}</p>
        <button 
          onClick={fetchProperties}
          className="mt-4 text-primary-600 hover:text-primary-500"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (properties.length === 0) {
    return (
      <div className="bg-white p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Properties</h1>
            <p className="mt-2 text-sm text-gray-700">
              You don't have any properties yet.
            </p>
          </div>
          <Link
            to="/properties/create"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Add Property
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="bg-white p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Properties</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all your properties and their current status.
          </p>
        </div>

        <TabContext value={selectedPropertyIndex}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
                        src={property.images && property.images.length > 0 
                          ? property.images[0].startsWith('http') 
                            ? property.images[0] 
                            : `http://localhost:5000/uploads/${property.images[0]}`
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
                  >
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {properties[selectedPropertyIndex]?.status === 'active' ? (
                            <CheckCircleIcon sx={{ color: 'success.light' }} />
                          ) : (
                            <HourglassEmptyIcon sx={{ color: 'warning.light' }} />
                          )}
                          <Typography>Details</Typography>
                        </Box>
                      }
                      value="overview"
                    />
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                            <CheckCircleIcon sx={{ color: 'success.light' }} />
                          ) : (
                            <HourglassEmptyIcon sx={{ color: 'warning.light' }} />
                          )}
                          <Typography>Applications</Typography>
                        </Box>
                      }
                      value="applications"
                    />
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                            <CheckCircleIcon sx={{ color: 'success.light' }} />
                          ) : (
                            <HourglassEmptyIcon sx={{ color: 'warning.light' }} />
                          )}
                          <Typography>Lease Agreement</Typography>
                        </Box>
                      }
                      value="lease"
                    />
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                            <CheckCircleIcon sx={{ color: 'success.light' }} />
                          ) : (
                            <HourglassEmptyIcon sx={{ color: 'warning.light' }} />
                          )}
                          <Typography>Payments</Typography>
                        </Box>
                      }
                      value="payments"
                    />
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {hasNewTickets ? (
                            <InfoIcon sx={{ color: 'info.light' }} />
                          ) : (
                            <CheckCircleIcon sx={{ color: 'success.light' }} />
                          )}
                          <Typography>Tickets</Typography>
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
                          <Card>
                            <CardMedia
                              component="img"
                              height="300"
                              image={property.images && property.images.length > 0 
                                ? property.images[0].startsWith('http') 
                                  ? property.images[0] 
                                  : `http://localhost:5000/uploads/${property.images[0]}`
                                : 'https://via.placeholder.com/400x300'}
                              alt={property.title}
                            />
                            <CardContent>
                              <Typography gutterBottom variant="h5" component="div">
                                {property.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {property.description}
                              </Typography>
                              <Box sx={{ mt: 2 }}>
                                <Chip 
                                  label={property.status} 
                                  color={getStatusColor(property.status)}
                                  sx={{ mr: 1 }}
                                />
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                  Price: ${property.price}/month
                                </Typography>
                                <Typography variant="body1">
                                  Location: {property.location.city}, {property.location.state}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              component={Link}
                              to={`/properties/edit/${property._id}`}
                              startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>}
                            >
                              Edit Property
                            </Button>
                            {property.status === 'New' && (
                              <Button
                                variant="contained"
                                color="success"
                                onClick={() => handleSubmit(property._id)}
                                startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>}
                              >
                                Submit Property
                              </Button>
                            )}
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() => handleDelete(property._id)}
                              startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>}
                            >
                              Delete Property
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value="applications">
                      {applications.length === 0 ? (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="h6" gutterBottom>
                            No Applications Yet
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            There are no applications for this property at the moment.
                          </Typography>
                        </Paper>
                      ) : (
                        <TabContext value={applications.length > 0 ? selectedTenantIndex : '0'}>
                          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList 
                              onChange={handleTenantTabChange}
                              variant="scrollable"
                              scrollButtons="auto"
                            >
                              {applications.map((application, index) => (
                                <Tab 
                                  key={application._id}
                                  label={
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {application.tenant.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(application.createdAt).toLocaleDateString()}
                                      </Typography>
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
                                  <Typography variant="h6">
                                    Tenant Information
                                  </Typography>
                                  <Chip
                                    label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                    color={
                                      application.status === 'approved' ? 'success' :
                                      application.status === 'declined' ? 'error' :
                                      'warning'
                                    }
                                    sx={{ ml: 2 }}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {application.tenantDocument && (
                                    <>
                                      <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                          Has Been Evicted
                                        </Typography>
                                        <Typography variant="body1">
                                          {application.tenantDocument.hasBeenEvicted}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                          Can Pay More Than One Month
                                        </Typography>
                                        <Typography variant="body1">
                                          {application.tenantDocument.canPayMoreThanOneMonth}
                                        </Typography>
                                      </Box>
                                      {application.tenantDocument.canPayMoreThanOneMonth === 'yes' && (
                                        <Box>
                                          <Typography variant="subtitle2" color="text.secondary">
                                            Months Ahead Can Pay
                                          </Typography>
                                          <Typography variant="body1">
                                            {application.tenantDocument.monthsAheadCanPay}
                                          </Typography>
                                        </Box>
                                      )}
                                    </>
                                  )}
                                </Box>

                                {application.tenantDocument && (
                                  <Accordion defaultExpanded={false}>
                                    <AccordionSummary
                                      expandIcon={<ExpandMoreIcon />}
                                      aria-controls="tenant-documents-content"
                                      id="tenant-documents-header"
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
                                                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                                      {doc.thumbnailUrl ? (
                                                        <img
                                                          src={doc.thumbnailUrl.startsWith('http') 
                                                            ? doc.thumbnailUrl 
                                                            : `${import.meta.env.VITE_API_URL}${doc.thumbnailUrl}`}
                                                          alt={`${field} ${docIndex + 1}`}
                                                          style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                                          onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/400x300';
                                                          }}
                                                        />
                                                      ) : (
                                                        <Box sx={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                                                          <Typography variant="body2" color="text.secondary">
                                                            Document Preview
                                                          </Typography>
                                                        </Box>
                                                      )}
                                                      <Typography variant="body2" sx={{ mt: 1 }}>
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
                                                        sx={{ mt: 1, width: '100%' }}
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

                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                                  <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => handleApplicationAction(application._id, 'decline')}
                                    disabled={application.status !== 'pending'}
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleApplicationAction(application._id, 'approve')}
                                    disabled={application.status !== 'pending'}
                                  >
                                    Approve
                                  </Button>
                                </Box>
                              </Paper>
                            </TabPanel>
                          ))}
                        </TabContext>
                      )}
                    </TabPanel>
                    <TabPanel value="lease">
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                          Lease Agreement
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                            "View and manage lease agreements for approved applications."
                          ) : (
                            "No approved applications yet. Lease agreements will be available once an application is approved."
                          )}
                        </Typography>
                      </Paper>
                    </TabPanel>
                    <TabPanel value="payments">
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                          Payment History
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                            "View and manage payment history for this property."
                          ) : (
                            "No approved applications yet. Payment history will be available once an application is approved."
                          )}
                        </Typography>
                      </Paper>
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
      </div>
    </ThemeProvider>
  );
} 