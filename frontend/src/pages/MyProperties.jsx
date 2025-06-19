import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Tabs, 
  Tab, 
  Box, 
  Typography, 
  Paper,
  ThemeProvider
} from '@mui/material';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import theme from '../theme';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BuildIcon from '@mui/icons-material/Build';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LeaseAgreement from '../components/lease/LeaseAgreement';
import Payments from '../components/lease/Payments';
import PropertyOverview from '../components/properties/PropertyOverview';
import ApplicationDetails from '../components/properties/ApplicationDetails';
import TicketManagement from '../components/properties/TicketManagement';
import PropertyStatistics from '../components/properties/PropertyStatistics';
import { useProperties } from '../hooks/useProperties';
import { useApplications } from '../hooks/useApplications';
import { useTickets } from '../hooks/useTickets';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../utils/uiUtils';
import { getImageUrl, handleImageError } from '../utils/imageUtils';
import { tabStyles, verticalTabStyles } from '../utils/uiUtils';

export default function MyProperties() {
  const navigate = useNavigate();
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [innerTabValue, setInnerTabValue] = useState('overview');
  const [clickedButton, setClickedButton] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());

  const {
    properties,
    isLoading: propertiesLoading,
    error: propertiesError,
    submitProperty,
    deleteProperty
  } = useProperties();

  const selectedProperty = properties[selectedPropertyIndex];
  const {
    applications,
    applicationCounts,
    selectedTenantIndex,
    fetchApplications,
    fetchApplicationCounts,
    handleApplicationAction,
    handleTenantTabChange
  } = useApplications(selectedProperty?._id);

  const {
    tickets,
    isLoading: ticketsLoading,
    error: ticketsError,
    hasNewTickets,
    handleTicketAction
  } = useTickets(selectedProperty?._id);

  useEffect(() => {
    if (properties.length > 0) {
      fetchApplicationCounts(properties);
    }
  }, [properties]);

  const handlePropertyTabChange = (event, newValue) => {
    setSelectedPropertyIndex(newValue);
  };

  const handleInnerTabChange = (event, newValue) => {
    setInnerTabValue(newValue);
  };

  const handleNavigateToLease = () => {
    setInnerTabValue('lease');
  };

  const handleImageErrorWrapper = (imageUrl) => {
    setFailedImages([...failedImages, imageUrl]);
    handleImageError(imageUrl);
  };

  const handleLeaseUpdate = async (updatedLease) => {
    // Refresh the applications list to get the updated lease data
    await fetchApplications();
  };

  if (propertiesLoading) {
    return <LoadingSpinner message="Loading your properties..." />;
  }

  if (propertiesError) {
    return <ErrorDisplay error={propertiesError} onRetry={() => window.location.reload()} />;
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        title="No Properties Yet"
        message="Start managing your properties by adding your first listing. You can add details, photos, and set up rental terms."
        actionLabel="Add Your First Property"
        onAction={() => navigate('/properties/create')}
        icon={HomeIcon}
      />
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="bg-white" style={{ minHeight: '100vh' }}>
        <Box>
          <TabContext value={selectedPropertyIndex}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <TabList 
                onChange={handlePropertyTabChange} 
                variant="scrollable"
                scrollButtons="auto"
                aria-label="property tabs"
                sx={{
                  '& .MuiTab-root': tabStyles.root,
                  '& .Mui-selected': tabStyles.selected,
                }}
              >
                {properties.map((property, index) => (
                  <Tab
                    key={property._id}
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 0.5 }}>
                        <img
                          src={getImageUrl(property.images?.[0])}
                          alt={property.title}
                          className="w-20 h-20 object-cover rounded-lg mb-1"
                          onError={(e) => handleImageErrorWrapper(property.images?.[0])}
                        />
                        <Typography variant="subtitle2" noWrap>
                          {property.title}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: property.status === 'active' ? 'success.main' : 
                                   property.status === 'pending' ? 'warning.main' : 'text.secondary',
                            fontWeight: 'medium'
                          }}
                        >
                          {property.status === 'active' ? 'Approved' : 
                           property.status === 'pending' ? 'Pending Approval' : 
                           property.status}
                        </Typography>
                      </Box>
                    }
                    value={index}
                  />
                ))}
                <Tab
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 0.5 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed',
                          borderColor: 'primary.main',
                          borderRadius: 1,
                          mb: 1,
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
              <TabPanel key={property._id} value={index} sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TabContext value={innerTabValue}>
                    <Box sx={{ borderRight: 1, borderColor: 'divider', pr: 1 }}>
                      <TabList 
                        onChange={handleInnerTabChange} 
                        value={innerTabValue}
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
                              <HomeIcon sx={{ fontSize: 24 }} />
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
                              <AssignmentIcon sx={{ fontSize: 24 }} />
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
                              <DescriptionIcon sx={{ fontSize: 24 }} />
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
                              <ReceiptIcon sx={{ fontSize: 24 }} />
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
                              <BuildIcon sx={{ fontSize: 24 }} />
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
                        <Tab
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                              <AnalyticsIcon sx={{ fontSize: 24 }} />
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Typography>Statistics</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Property statistics
                                </Typography>
                              </Box>
                            </Box>
                          }
                          value="statistics"
                        />
                      </TabList>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <TabPanel value="overview" sx={{ p: 0 }}>
                        <PropertyOverview
                          property={selectedProperty}
                          onDelete={deleteProperty}
                          onSubmit={submitProperty}
                          clickedButton={clickedButton}
                          setClickedButton={setClickedButton}
                        />
                      </TabPanel>
                      <TabPanel value="applications" sx={{ p: 0 }}>
                        <ApplicationDetails
                          applications={applications}
                          selectedTenantIndex={selectedTenantIndex}
                          onTenantTabChange={handleTenantTabChange}
                          onApplicationAction={handleApplicationAction}
                          failedImages={failedImages}
                          onImageError={handleImageErrorWrapper}
                          onNavigateToLease={handleNavigateToLease}
                        />
                      </TabPanel>
                      <TabPanel value="lease" sx={{ p: 0 }}>
                        {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                          <Box sx={{ p: 1 }}>
                            <LeaseAgreement 
                              leaseDetails={applications.find(app => app.status === 'approved')} 
                              onLeaseUpdate={handleLeaseUpdate}
                            />
                          </Box>
                        ) : (
                          <EmptyState
                            title="No Approved Applications"
                            message="Lease agreements will be available once an application is approved."
                            icon={DescriptionIcon}
                          />
                        )}
                      </TabPanel>
                      <TabPanel value="payments" sx={{ p: 0 }}>
                        {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                          <Box sx={{ p: 1 }}>
                            {(() => {
                              const approvedApp = applications.find(app => app.status === 'approved');
                              if (!approvedApp.property || typeof approvedApp.property === 'string') {
                                return <LoadingSpinner message="Loading payment history..." />;
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
                          <EmptyState
                            title="No Payment History"
                            message="Payment history will be available once an application is approved."
                            icon={ReceiptIcon}
                          />
                        )}
                      </TabPanel>
                      <TabPanel value="tickets" sx={{ p: 0 }}>
                        <TicketManagement
                          tickets={tickets}
                          isLoading={ticketsLoading}
                          error={ticketsError}
                          onTicketAction={handleTicketAction}
                        />
                      </TabPanel>
                      <TabPanel value="statistics" sx={{ p: 0 }}>
                        <PropertyStatistics propertyId={selectedProperty._id} />
                      </TabPanel>
                    </Box>
                  </TabContext>
                </Box>
              </TabPanel>
            ))}
          </TabContext>
        </Box>
      </div>
    </ThemeProvider>
  );
} 