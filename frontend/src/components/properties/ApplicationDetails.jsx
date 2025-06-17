import { useState } from 'react';
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
  Tab
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

export default function ApplicationDetails({ 
  applications, 
  selectedTenantIndex, 
  onTenantTabChange,
  onApplicationAction,
  failedImages,
  onImageError
}) {
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
                  onClick={() => onApplicationAction(application._id, 'approve')}
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
                  onClick={() => onApplicationAction(application._id, 'reject')}
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

            {/* Tenant Profile Section */}
            {application.tenantDocument && (
              <Paper 
                variant="outlined" 
                sx={{ mt: 3, p: 3, transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">Tenant Profile</Typography>
                </Box>

                {/* Tenant Profile Summary */}
                {(() => {
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

                {/* Tenant Profile Details */}
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

            {/* Tenant Documents Section */}
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
                                      src={doc.thumbnailUrl.startsWith('http') 
                                        ? doc.thumbnailUrl 
                                        : `${import.meta.env.VITE_API_URL}${doc.thumbnailUrl}`}
                                      alt={`${field} ${docIndex + 1}`}
                                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                      onError={(e) => onImageError(doc._id, e)}
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
  );
} 