import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Alert,
  AlertTitle,
  Stack
} from '@mui/material';
import { TabList, TabPanel, TabContext } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScoreIcon from '@mui/icons-material/Score';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ApplicationApprovalModal from '../ApplicationApprovalModal';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';

export default function ApplicationDetails({ 
  applications, 
  selectedTenantIndex, 
  onTenantTabChange,
  onApplicationAction,
  failedImages,
  onImageError,
  onNavigateToLease
}) {
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const handleApproveClick = (application) => {
    setSelectedApplication(application);
    setApprovalModalOpen(true);
  };

  const handleApprovalConfirm = () => {
    if (selectedApplication) {
      onApplicationAction(selectedApplication._id, 'approve');
      setApprovalModalOpen(false);
      setSelectedApplication(null);
    }
  };

  const handleApprovalCancel = () => {
    setApprovalModalOpen(false);
    setSelectedApplication(null);
  };

  const handleNavigateToLease = () => {
    if (onNavigateToLease) {
      onNavigateToLease();
    }
  };

  // Calculate other applications count (excluding the selected one)
  const getOtherApplicationsCount = (currentApplication) => {
    return applications.filter(app => 
      app._id !== currentApplication._id && 
      ['pending', 'viewing'].includes(app.status)
    ).length;
  };

  if (applications.length === 0) {
    return (
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
    );
  }

  return (
    <TabContext value={applications.length > 0 ? selectedTenantIndex : '0'}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <TabList 
          onChange={onTenantTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              padding: '12px 16px',
              textTransform: 'none',
              '&.Mui-selected': {
                backgroundColor: 'rgba(88, 105, 172, 0.12)',
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
            {/* Tenant Header Section */}
            <Box sx={{ 
              mb: 4,
              p: 3,
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200',
              position: 'relative'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 1
                }}>
                  <PersonIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
                    {application.tenant.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      color={
                        application.status === 'approved' ? 'success' :
                        application.status === 'rejected' ? 'error' :
                        application.status === 'viewing' ? 'info' :
                        'warning'
                      }
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Applied {new Date(application.createdAt).toLocaleDateString()}
                    </Typography>
                    {getOtherApplicationsCount(application) > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        • {getOtherApplicationsCount(application)} other applications
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Application Actions */}
            {application.status === 'pending' && (
              <Box sx={{ 
                mb: 4,
                p: 3, 
                bgcolor: 'success.50',
                borderRadius: 3,
                border: '2px solid',
                borderColor: 'success.200',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="success.800" gutterBottom>
                    Application Review Required
                  </Typography>
                  <Typography variant="body2" color="success.700">
                    Review the tenant's profile and documents to make a decision
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleApproveClick(application)}
                    startIcon={<CheckCircleIcon />}
                    sx={{
                      minWidth: 140,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      py: 1.5,
                      px: 3,
                      boxShadow: '0 4px 12px rgba(46,125,50,0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 20px rgba(46,125,50,0.4)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Approve Application
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => onApplicationAction(application._id, 'reject')}
                    startIcon={<ErrorIcon />}
                    sx={{
                      minWidth: 140,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      py: 1.5,
                      px: 3,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(211,47,47,0.2)'
                      }
                    }}
                  >
                    Reject Application
                  </Button>
                </Box>
              </Box>
            )}

            {application.status === 'approved' && (
              <Box sx={{ 
                mb: 4,
                p: 3, 
                bgcolor: 'info.50',
                borderRadius: 3,
                border: '2px solid',
                borderColor: 'info.200',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="info.800" gutterBottom>
                    Application Approved
                  </Typography>
                  <Typography variant="body2" color="info.700">
                    This application has been approved. You can now proceed with lease creation.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNavigateToLease}
                  startIcon={<AssignmentIcon />}
                  sx={{
                    minWidth: 140,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    py: 1.5,
                    px: 3,
                    boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(25,118,210,0.4)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Create Lease Agreement
                </Button>
              </Box>
            )}

            {application.status === 'rejected' && (
              <Box sx={{ 
                mb: 4,
                p: 3, 
                bgcolor: 'error.50',
                borderRadius: 3,
                border: '2px solid',
                borderColor: 'error.200'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <ErrorIcon color="error" />
                  <Typography variant="h6" fontWeight="bold" color="error.800">
                    Application Rejected
                  </Typography>
                </Box>
                <Typography variant="body2" color="error.700">
                  This application has been rejected and is no longer active.
                </Typography>
              </Box>
            )}

            {/* Application Details */}
            <Grid container spacing={3}>
              {/* Tenant Score Section */}
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    height: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'primary.300',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <ScoreIcon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Tenant Score
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Overall assessment rating
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography 
                      variant="h2" 
                      sx={{
                        fontWeight: 800,
                        fontSize: '3.5rem',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        mb: 1
                      }}
                    >
                      {application.tenantScoring}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                      out of 100
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={application.tenantScoring} 
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        mb: 2,
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)'
                        }
                      }}
                    />
                    <Chip 
                      label={
                        application.tenantScoring >= 80 ? 'Excellent' :
                        application.tenantScoring >= 60 ? 'Good' :
                        'Needs Review'
                      }
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </Box>

                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, textAlign: 'center' }}>
                      {application.tenantScoring >= 80 ? 'Highly recommended tenant with excellent credentials' :
                       application.tenantScoring >= 60 ? 'Good candidate with solid background' :
                       'Requires additional review and consideration'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Viewing Schedule Section */}
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    height: '100%',
                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    border: '2px solid',
                    borderColor: 'orange.200',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'orange.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 2
                    }}>
                      <CalendarTodayIcon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="orange.800">
                        Viewing Schedule
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Property viewing details
                      </Typography>
                    </Box>
                  </Box>

                  {application.viewingDate ? (
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'orange.200',
                      textAlign: 'center'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 2,
                        mb: 2
                      }}>
                        <CalendarTodayIcon color="orange" sx={{ fontSize: 32 }} />
                        <Box>
                          <Typography variant="h5" fontWeight="bold" color="orange.800">
                            {new Date(application.viewingDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="h6" color="orange.600" fontWeight="medium">
                            {application.viewingTime}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label="Scheduled" 
                        color="success" 
                        icon={<CheckCircleIcon />}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ 
                      p: 4, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'orange.200',
                      textAlign: 'center'
                    }}>
                      <AccessTimeIcon color="action" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No viewing scheduled yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Schedule a property viewing to proceed with the application
                      </Typography>
                    </Box>
                  )}

                  {application.viewingDate && (
                    <Box sx={{ 
                      mt: 2, 
                      p: 2, 
                      bgcolor: 'orange.50', 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'orange.200'
                    }}>
                      <Typography variant="body2" color="orange.800" sx={{ fontWeight: 500 }}>
                        📅 Please be available at the scheduled time for the property viewing
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Contact Information Section */}
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    height: '100%',
                    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    border: '2px solid',
                    borderColor: 'teal.200',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'teal.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 2
                    }}>
                      <ContactMailIcon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="teal.800">
                        Contact Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tenant contact details
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={2}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'teal.200',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transform: 'translateY(-1px)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <EmailIcon color="teal" />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Email Address
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: 'break-word' }}>
                            {application.tenant.email}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'teal.200',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transform: 'translateY(-1px)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PhoneIcon color="teal" />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Phone Number
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {application.tenant.phone || 'Not provided'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'teal.50', 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'teal.200'
                    }}>
                      <Typography variant="body2" color="teal.800" sx={{ fontWeight: 500 }}>
                        💬 Ready to communicate with the tenant about their application
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* Tenant Profile Section */}
            {application.tenantDocument && (
              <Paper 
                elevation={0}
                sx={{ 
                  mt: 4, 
                  p: 4, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                  border: '2px solid',
                  borderColor: 'primary.200',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {/* Header */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 4,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'primary.50',
                  border: '1px solid',
                  borderColor: 'primary.200'
                }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 2
                  }}>
                    <PersonIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                      Tenant Profile
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Comprehensive tenant information for decision making
                    </Typography>
                  </Box>
                </Box>

                {/* Financial Summary Dashboard */}
                {(() => {
                  const netIncome = Number(application.tenantDocument.monthlyNetIncome) || 0;
                  const additionalIncome = application.tenantDocument.additionalIncomeAmount || 0;
                  const debt = Number(application.tenantDocument.monthlyDebtRepayment) || 0;
                  const currentRent = application.tenantDocument.currentRentAmount || 0;
                  const totalIncome = netIncome + additionalIncome;
                  const totalExpenses = debt + currentRent;
                  const netDisposable = totalIncome - totalExpenses;
                  const incomeExpenseRatio = totalExpenses > 0 ? totalIncome / totalExpenses : null;
                  let riskLevel = 'Low Risk';
                  let riskColor = 'success';
                  let riskIcon = <CheckCircleIcon />;
                  
                  if (incomeExpenseRatio !== null) {
                    if (incomeExpenseRatio < 1) { 
                      riskLevel = 'High Risk'; 
                      riskColor = 'error'; 
                      riskIcon = <ErrorIcon />;
                    }
                    else if (incomeExpenseRatio < 2) { 
                      riskLevel = 'Medium Risk'; 
                      riskColor = 'warning'; 
                      riskIcon = <InfoIcon />;
                    }
                  }
                  
                  return (
                    <Paper 
                      elevation={0}
                      sx={{ 
                        mb: 4, 
                        p: 3, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'primary.300'
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                        Financial Summary Dashboard
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                              ${netDisposable.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              Net Disposable Income
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                              ${totalIncome.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              Total Monthly Income
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                              {incomeExpenseRatio !== null ? incomeExpenseRatio.toFixed(2) : 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              Income/Expense Ratio
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 2, 
                            bgcolor: 'rgba(255,255,255,0.1)', 
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {riskIcon}
                              <Typography variant="h6" fontWeight="bold">
                                {riskLevel}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              Risk Assessment
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })()}

                {/* Tenant Profile Details */}
                <Grid container spacing={3}>
                  {/* Employment & Income Section */}
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        background: 'linear-gradient(135deg, #fff8f0 0%, #fff4e6 100%)',
                        border: '2px solid',
                        borderColor: 'orange.200',
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'orange.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <WorkIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="orange.800">
                          Employment & Income
                        </Typography>
                      </Box>
                      
                      <Stack spacing={2}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'orange.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Employment Status
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {application.tenantDocument.employmentStatus ? 
                              application.tenantDocument.employmentStatus.charAt(0).toUpperCase() + 
                              application.tenantDocument.employmentStatus.slice(1).replace('-', ' ') : 
                              'Not specified'}
                          </Typography>
                        </Box>
                        
                        {application.tenantDocument.employmentStatus && application.tenantDocument.employmentStatus !== 'unemployed' && (
                          <>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: 'white', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'orange.200'
                            }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Employer & Position
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {application.tenantDocument.employerName || 'Not specified'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {application.tenantDocument.jobTitle || 'Position not specified'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: 'white', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'orange.200'
                            }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Monthly Net Income
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color="success.main">
                                ${application.tenantDocument.monthlyNetIncome?.toLocaleString() || '0'}
                              </Typography>
                            </Box>
                          </>
                        )}
                        
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'orange.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Additional Income
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {application.tenantDocument.additionalIncomeAmount && application.tenantDocument.additionalIncomeAmount > 0
                              ? `$${application.tenantDocument.additionalIncomeAmount.toLocaleString()}`
                              : 'No additional income'}
                          </Typography>
                          {application.tenantDocument.additionalIncomeSource && (
                            <Typography variant="body2" color="text.secondary">
                              Source: {application.tenantDocument.additionalIncomeSource}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'orange.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Child Support
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {application.tenantDocument.childSupportAmount && application.tenantDocument.childSupportAmount > 0
                              ? `$${application.tenantDocument.childSupportAmount.toLocaleString()}`
                              : 'No child support payments'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Personal & Household Information Section */}
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        background: 'linear-gradient(135deg, #f0fff4 0%, #e6ffe6 100%)',
                        border: '2px solid',
                        borderColor: 'green.200',
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'green.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="green.800">
                          Personal & Household
                        </Typography>
                      </Box>
                      
                      <Stack spacing={2}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'green.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Household Members
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Chip 
                              label={`${application.tenantDocument.adultOccupants || 1} Adults`} 
                              color="primary" 
                              variant="outlined"
                            />
                            <Chip 
                              label={`${application.tenantDocument.childOccupants || 0} Children`} 
                              color="secondary" 
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'green.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Marital Status
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {application.tenantDocument.maritalStatus ? 
                              application.tenantDocument.maritalStatus.charAt(0).toUpperCase() + 
                              application.tenantDocument.maritalStatus.slice(1) : 
                              'Not specified'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'green.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Pets
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {application.tenantDocument.hasPets ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <InfoIcon color="info" />
                            )}
                            <Typography variant="body1" fontWeight="medium">
                              {application.tenantDocument.hasPets 
                                ? `${application.tenantDocument.petCount || 0} pet(s)`
                                : 'No pets'}
                            </Typography>
                          </Box>
                          {application.tenantDocument.petTypes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Types: {application.tenantDocument.petTypes}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'green.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Smoking Status
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {application.tenantDocument.smokingStatus === 'non-smoker' ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <InfoIcon color="warning" />
                            )}
                            <Typography variant="body1" fontWeight="medium">
                              {application.tenantDocument.smokingStatus ? 
                                application.tenantDocument.smokingStatus.charAt(0).toUpperCase() + 
                                application.tenantDocument.smokingStatus.slice(1).replace('-', ' ') : 
                                'Not specified'}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Financial & Credit Section */}
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
                        border: '2px solid',
                        borderColor: 'blue.200',
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'blue.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <AccountBalanceIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="blue.800">
                          Financial & Credit
                        </Typography>
                      </Box>
                      
                      <Stack spacing={2}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'blue.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Monthly Debt Repayment
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="error.main">
                            ${application.tenantDocument.monthlyDebtRepayment?.toLocaleString() || '0'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'blue.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Current Rent
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {application.tenantDocument.currentRentAmount && application.tenantDocument.currentRentAmount > 0
                              ? `$${application.tenantDocument.currentRentAmount.toLocaleString()}`
                              : 'Not currently renting'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'blue.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Credit Score
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {application.tenantDocument.creditScore 
                              ? `${application.tenantDocument.creditScore}`
                              : 'Not provided'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Rental History Section */}
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        background: 'linear-gradient(135deg, #fff0f8 0%, #ffe6f3 100%)',
                        border: '2px solid',
                        borderColor: 'pink.200',
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'pink.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <HomeIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="pink.800">
                          Rental History
                        </Typography>
                      </Box>
                      
                      <Stack spacing={2}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'pink.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Eviction History
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {application.tenantDocument.evictionHistory ? (
                              <ErrorIcon color="error" />
                            ) : (
                              <CheckCircleIcon color="success" />
                            )}
                            <Typography variant="body1" fontWeight="medium">
                              {application.tenantDocument.evictionHistory 
                                ? 'Has been evicted previously' 
                                : 'No previous evictions'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'pink.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Bankruptcy History
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {application.tenantDocument.bankruptcyHistory ? (
                              <ErrorIcon color="error" />
                            ) : (
                              <CheckCircleIcon color="success" />
                            )}
                            <Typography variant="body1" fontWeight="medium">
                              {application.tenantDocument.bankruptcyHistory 
                                ? 'Has filed for bankruptcy previously' 
                                : 'No bankruptcy history'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'pink.200'
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Advance Payment Capability
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {application.tenantDocument.monthsAheadCanPay && application.tenantDocument.monthsAheadCanPay > 1 ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <InfoIcon color="info" />
                            )}
                            <Typography variant="body1" fontWeight="medium">
                              {application.tenantDocument.monthsAheadCanPay && application.tenantDocument.monthsAheadCanPay > 1
                                ? `Can pay up to ${application.tenantDocument.monthsAheadCanPay} months in advance`
                                : 'Can pay one month at a time'}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Lease Guarantor Section */}
                  {application.tenantDocument.hasGuarantor && (
                    <Grid item xs={12}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 3,
                          background: 'linear-gradient(135deg, #f8f0ff 0%, #f0e6ff 100%)',
                          border: '2px solid',
                          borderColor: 'purple.200',
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'purple.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
                          </Box>
                          <Typography variant="h6" fontWeight="bold" color="purple.800">
                            Lease Guarantor
                          </Typography>
                          <Chip label="Additional Security" color="purple" size="small" />
                        </Box>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: 'white', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'purple.200'
                            }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Guarantor Name
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {application.tenantDocument.guarantorName || 'Not specified'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: 'white', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'purple.200'
                            }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Relationship
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {application.tenantDocument.guarantorRelationship || 'Not specified'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: 'white', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'purple.200'
                            }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Contact Information
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {application.tenantDocument.guarantorPhone || 'Phone not specified'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {application.tenantDocument.guarantorEmail || 'Email not specified'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: 'white', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'purple.200'
                            }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Financial Information
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {application.tenantDocument.guarantorMonthlyIncome 
                                  ? `$${application.tenantDocument.guarantorMonthlyIncome.toLocaleString()}`
                                  : 'Income not specified'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {application.tenantDocument.guarantorEmployer || 'Employer not specified'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: 'white', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'purple.200'
                            }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Address
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {application.tenantDocument.guarantorAddress || 'Address not specified'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}

            {/* Tenant Documents Section */}
            {application.tenantDocument && (
              <Paper 
                elevation={0}
                sx={{ 
                  mt: 4, 
                  p: 4,
                  background: 'linear-gradient(135deg, #f8f0ff 0%, #f0e6ff 100%)',
                  border: '2px solid',
                  borderColor: 'purple.200',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'purple.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 2
                  }}>
                    <DescriptionIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="purple.800">
                      Supporting Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tenant uploaded documents for verification
                    </Typography>
                  </Box>
                </Box>

                <Accordion 
                  defaultExpanded={false}
                  sx={{
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                    border: '2px solid',
                    borderColor: 'purple.200',
                    borderRadius: '12px !important',
                    bgcolor: 'white',
                    '& .MuiAccordionSummary-root': {
                      borderRadius: '12px',
                      '&:hover': {
                        backgroundColor: 'purple.50',
                      },
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon color="purple" />}
                    aria-controls="tenant-documents-content"
                    id="tenant-documents-header"
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        gap: 2
                      }
                    }}
                  >
                    <DescriptionIcon color="purple" />
                    <Typography variant="h6" fontWeight="bold" color="purple.800">
                      View Tenant Documents
                    </Typography>
                    <Chip 
                      label={`${['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments']
                        .reduce((total, field) => total + (application.tenantDocument[field]?.length || 0), 0)} documents`}
                      color="purple" 
                      size="small"
                      variant="outlined"
                    />
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[
                        { field: 'proofOfIdentity', label: 'Proof of Identity', icon: '🆔', color: 'blue' },
                        { field: 'proofOfIncome', label: 'Proof of Income', icon: '💰', color: 'green' },
                        { field: 'creditHistory', label: 'Credit History', icon: '📊', color: 'orange' },
                        { field: 'rentalHistory', label: 'Rental History', icon: '🏠', color: 'purple' },
                        { field: 'additionalDocuments', label: 'Additional Documents', icon: '📄', color: 'grey' }
                      ].map(({ field, label, icon, color }) => (
                        <Box key={field} sx={{ 
                          p: 3, 
                          border: '2px solid', 
                          borderColor: `${color}.200`,
                          borderRadius: 3,
                          bgcolor: `${color}.50`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            transform: 'translateY(-2px)'
                          }
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Typography variant="h4">{icon}</Typography>
                            <Box>
                              <Typography variant="h6" fontWeight="bold" color={`${color}.800`}>
                                {label}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {application.tenantDocument[field]?.length || 0} document(s) uploaded
                              </Typography>
                            </Box>
                          </Box>
                          
                          {application.tenantDocument[field]?.length > 0 ? (
                            <Grid container spacing={3}>
                              {application.tenantDocument[field].map((doc, docIndex) => (
                                <Grid item xs={12} sm={6} md={4} key={docIndex}>
                                  <Paper 
                                    elevation={0}
                                    sx={{ 
                                      p: 2, 
                                      border: '2px solid', 
                                      borderColor: `${color}.200`, 
                                      borderRadius: 2,
                                      bgcolor: 'white',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                        transform: 'translateY(-3px)',
                                        borderColor: `${color}.400`
                                      }
                                    }}
                                  >
                                    {doc.thumbnailUrl ? (
                                      <Box sx={{ 
                                        height: 200, 
                                        borderRadius: 1, 
                                        overflow: 'hidden',
                                        mb: 2,
                                        border: '1px solid',
                                        borderColor: 'grey.200'
                                      }}>
                                        <img
                                          src={doc.thumbnailUrl.startsWith('http') 
                                            ? doc.thumbnailUrl 
                                            : `${import.meta.env.VITE_API_URL}${doc.thumbnailUrl}`}
                                          alt={`${label} ${docIndex + 1}`}
                                          style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            objectFit: 'cover',
                                            transition: 'transform 0.3s ease'
                                          }}
                                          onError={(e) => onImageError(doc._id, e)}
                                          onMouseEnter={(e) => {
                                            e.target.style.transform = 'scale(1.05)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                          }}
                                        />
                                      </Box>
                                    ) : (
                                      <Box sx={{ 
                                        height: 200, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        bgcolor: 'grey.100',
                                        borderRadius: 1,
                                        mb: 2,
                                        border: '1px solid',
                                        borderColor: 'grey.200'
                                      }}>
                                        <DescriptionIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                                      </Box>
                                    )}
                                    
                                    <Typography variant="body2" sx={{ 
                                      mb: 2, 
                                      fontWeight: 500,
                                      color: 'text.primary',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {doc.filename}
                                    </Typography>
                                    
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>}
                                      onClick={() => {
                                        const url = doc.url.startsWith('http') 
                                          ? doc.url 
                                          : `${import.meta.env.VITE_API_URL}${doc.url}`;
                                        window.open(url, '_blank');
                                      }}
                                      fullWidth
                                      sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        background: `linear-gradient(135deg, ${color}.main 0%, ${color}.dark 100%)`,
                                        '&:hover': {
                                          background: `linear-gradient(135deg, ${color}.dark 0%, ${color}.main 100%)`,
                                          transform: 'translateY(-1px)',
                                          boxShadow: `0 4px 12px ${color}.main`
                                        }
                                      }}
                                    >
                                      Download Document
                                    </Button>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          ) : (
                            <Box sx={{ 
                              p: 4, 
                              textAlign: 'center',
                              bgcolor: 'white',
                              borderRadius: 2,
                              border: '1px dashed',
                              borderColor: `${color}.300`
                            }}>
                              <DescriptionIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                              <Typography variant="body1" color="text.secondary" gutterBottom>
                                No documents uploaded
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Tenant has not uploaded any {label.toLowerCase()} documents yet
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            )}
        </TabPanel>
      ))}
      <ApplicationApprovalModal
        open={approvalModalOpen}
        onClose={handleApprovalCancel}
        onConfirm={handleApprovalConfirm}
        application={selectedApplication}
        otherApplicationsCount={selectedApplication ? getOtherApplicationsCount(selectedApplication) : 0}
      />
    </TabContext>
  );
} 