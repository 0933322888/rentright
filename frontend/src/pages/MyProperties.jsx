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
import LeaseAgreement from '../components/lease/LeaseAgreement';
import Payments from '../components/lease/Payments';
import PropertyOverview from '../components/properties/PropertyOverview';
import ApplicationDetails from '../components/properties/ApplicationDetails';
import TicketManagement from '../components/properties/TicketManagement';
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
  const [failedImages, setFailedImages] = useState([]);

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

  const handleImageErrorWrapper = (imageUrl) => {
    setFailedImages([...failedImages, imageUrl]);
    handleImageError(imageUrl);
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
      <div className="bg-white p-6" style={{ minHeight: '100vh' }}>
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
                  '& .MuiTab-root': tabStyles.root,
                  '& .Mui-selected': tabStyles.selected,
                }}
              >
                {properties.map((property, index) => (
                  <Tab
                    key={property._id}
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                        <img
                          src={getImageUrl(property.images?.[0])}
                          alt={property.title}
                          className="w-24 h-24 object-cover rounded-lg mb-2"
                          onError={(e) => handleImageErrorWrapper(property.images?.[0])}
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
                        <PropertyOverview
                          property={selectedProperty}
                          onDelete={deleteProperty}
                          onSubmit={submitProperty}
                          clickedButton={clickedButton}
                          setClickedButton={setClickedButton}
                        />
                      </TabPanel>
                      <TabPanel value="applications">
                        <ApplicationDetails
                          applications={applications}
                          selectedTenantIndex={selectedTenantIndex}
                          onTenantTabChange={handleTenantTabChange}
                          onApplicationAction={handleApplicationAction}
                          failedImages={failedImages}
                          onImageError={handleImageErrorWrapper}
                        />
                      </TabPanel>
                      <TabPanel value="lease">
                        {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                          <Box sx={{ p: 2 }}>
                            <LeaseAgreement 
                              leaseDetails={applications.find(app => app.status === 'approved')} 
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
                      <TabPanel value="payments">
                        {applications.length > 0 && applications.some(app => app.status === 'approved') ? (
                          <Box sx={{ p: 2 }}>
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
                      <TabPanel value="tickets">
                        <TicketManagement
                          tickets={tickets}
                          isLoading={ticketsLoading}
                          error={ticketsError}
                          onTicketAction={handleTicketAction}
                        />
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