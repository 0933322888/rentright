import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { adminButtonStyles } from '../../utils/uiUtils';
import { getProfilePictureUrl } from '../../utils/imageUtils';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Email,
  Phone,
  CalendarToday,
  Work,
  AttachMoney,
  CreditCard,
  Home,
  Pets,
  SmokingRooms,
  Group,
  ChildCare,
  VerifiedUser,
  Warning,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  Description,
  Assessment,
  Security,
  TrendingUp
} from '@mui/icons-material';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';

export default function AdminTenantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tenant, setTenant] = useState(null);
  const [scoreOverride, setScoreOverride] = useState('');
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTenant();
    }
  }, [id]);

  const fetchTenant = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ADMIN_TENANTS}/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Tenant data:', response.data);
      setTenant(response.data);
    } catch (err) {
      setError('Failed to fetch tenant details');
      console.error('Error fetching tenant:', err);
      toast.error('Failed to fetch tenant details');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreOverride = async () => {
    if (!tenant) return;
    setSavingScore(true);
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.ADMIN_TENANTS}/${id}`,
        { tenantScoring: Number(scoreOverride) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Tenant score updated');
      setTenant(prev => ({ ...prev, tenantScoring: Number(scoreOverride) }));
    } catch (err) {
      toast.error('Failed to update score');
    } finally {
      setSavingScore(false);
    }
  };

  const getAIMatchingResults = () => {
    if (!tenant?.tenantDocument) return null;
    
    const results = {
      incomeVerification: { status: 'Not verified', details: [] },
      identityVerification: { status: 'Not verified', details: [] },
      documentParsing: { success: 0, total: 0, details: [] },
      creditVerification: { status: 'Not verified', details: [] },
      rentalHistory: { status: 'Clean', details: [] }
    };
    
    const doc = tenant.tenantDocument;
    
    // Income verification
    let aiIncomeFound = false;
    const documentTypes = ['proofOfIncome', 'creditHistory', 'additionalDocuments'];
    for (const docType of documentTypes) {
      if (doc[docType]?.length > 0) {
        for (const document of doc[docType]) {
          if (document.aiParsedData?.income && !isNaN(Number(document.aiParsedData.income))) {
            const aiIncome = Number(document.aiParsedData.income);
            const manualIncome = doc.monthlyNetIncome;
            
            if (manualIncome && Math.abs(aiIncome - manualIncome) / manualIncome < 0.1) {
              results.incomeVerification.status = 'Verified ✓';
              results.incomeVerification.details.push(`AI income (${aiIncome}) matches manual income (${manualIncome})`);
            } else if (manualIncome) {
              results.incomeVerification.status = 'Mismatch ⚠️';
              results.incomeVerification.details.push(`AI income: ${aiIncome}, Manual income: ${manualIncome}`);
            } else {
              results.incomeVerification.status = 'AI Only ✓';
              results.incomeVerification.details.push(`Using AI income: ${aiIncome}`);
            }
            aiIncomeFound = true;
            break;
          }
        }
      }
    }
    if (!aiIncomeFound && doc.monthlyNetIncome) {
      results.incomeVerification.status = 'Manual Only';
      results.incomeVerification.details.push(`Manual income: ${doc.monthlyNetIncome}`);
    }
    
    // Identity verification
    if (doc.proofOfIdentity?.length > 0) {
      for (const document of doc.proofOfIdentity) {
        if (document.aiParsedData?.name && document.aiParsedData?.documentType) {
          const aiName = document.aiParsedData.name.toLowerCase();
          const tenantName = tenant.name?.toLowerCase() || '';
          if (aiName.includes(tenantName.split(' ')[0]) || tenantName.includes(aiName.split(' ')[0])) {
            results.identityVerification.status = 'Verified ✓';
            results.identityVerification.details.push(`Name verified: ${document.aiParsedData.name}`);
          } else {
            results.identityVerification.status = 'Mismatch ⚠️';
            results.identityVerification.details.push(`AI name: ${document.aiParsedData.name}, Tenant name: ${tenant.name}`);
          }
          results.identityVerification.details.push(`Document: ${document.aiParsedData.documentType}`);
          break;
        }
      }
    }
    
    // Document parsing success
    const allDocs = [
      ...(doc.proofOfIdentity || []),
      ...(doc.proofOfIncome || []),
      ...(doc.creditHistory || []),
      ...(doc.rentalHistory || []),
      ...(doc.additionalDocuments || [])
    ];
    
    results.documentParsing.total = allDocs.length;
    for (const document of allDocs) {
      if (document.aiParsedData && !document.aiParsedData.error) {
        results.documentParsing.success++;
        results.documentParsing.details.push(`${document.filename}: Successfully parsed`);
      } else {
        results.documentParsing.details.push(`${document.filename}: Failed to parse`);
      }
    }
    
    // Credit verification
    if (doc.creditHistory?.length > 0) {
      for (const document of doc.creditHistory) {
        if (document.aiParsedData?.creditScore) {
          const aiCreditScore = Number(document.aiParsedData.creditScore);
          const manualCreditScore = doc.creditScore;
          
          if (manualCreditScore && Math.abs(aiCreditScore - manualCreditScore) < 50) {
            results.creditVerification.status = 'Verified ✓';
            results.creditVerification.details.push(`AI credit score (${aiCreditScore}) matches manual (${manualCreditScore})`);
          } else if (manualCreditScore) {
            results.creditVerification.status = 'Mismatch ⚠️';
            results.creditVerification.details.push(`AI: ${aiCreditScore}, Manual: ${manualCreditScore}`);
          } else {
            results.creditVerification.status = 'AI Only ✓';
            results.creditVerification.details.push(`Using AI credit score: ${aiCreditScore}`);
          }
          break;
        }
      }
    }
    
    // Rental history
    if (doc.rentalHistory?.length > 0) {
      for (const document of doc.rentalHistory) {
        if (document.aiParsedData?.negativeRemarks || 
            document.aiParsedData?.documentType?.toLowerCase().includes('eviction')) {
          results.rentalHistory.status = 'Issues Found ⚠️';
          results.rentalHistory.details.push(`Document: ${document.filename}`);
          if (document.aiParsedData.negativeRemarks) {
            results.rentalHistory.details.push(`Remarks: ${document.aiParsedData.negativeRemarks}`);
          }
        }
      }
    }
    
    return results;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!tenant) {
    return (
      <Box p={3}>
        <Alert severity="warning">Tenant not found</Alert>
      </Box>
    );
  }

  const aiResults = getAIMatchingResults();

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/admin/tenants')} sx={{ backgroundColor: 'white' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Tenant Profile
        </Typography>
        <Chip 
          label={tenant.hasProfile ? 'Complete' : 'Incomplete'} 
          color={tenant.hasProfile ? 'success' : 'warning'}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left column: Profile, Score, Stats */}
        <Grid item xs={12} md={4} lg={3} sx={{ width: '19%' }}>
          {/* Profile Card */}
          <Card sx={{ height: 'auto' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar
                src={tenant.profilePicture ? getProfilePictureUrl(tenant.profilePicture) : undefined}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: '3rem' }}
              >
                {tenant.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {tenant.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {tenant.email}
              </Typography>
              {tenant.phone && (
                <Typography variant="body2" color="text.secondary">
                  {tenant.phone}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Tenant Score Card */}
          <Card sx={{ height: 'auto', mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Tenant Score
                </Typography>
              </Box>
              {tenant.tenantScoring !== undefined && (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h3" color={`${getScoreColor(tenant.tenantScoring)}.main`} fontWeight="bold">
                    {tenant.tenantScoring}%
                  </Typography>
                  <Chip 
                    label={getScoreLabel(tenant.tenantScoring)}
                    color={getScoreColor(tenant.tenantScoring)}
                    sx={{ mt: 1 }}
                  />
                </Box>
              )}

              {/* Score Breakdown */}
              {tenant.scoreBreakdown && (
                <Box sx={{ mt: 2, textAlign: 'left' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Score Breakdown
                  </Typography>
                  <List dense>
                    {Object.entries(tenant.scoreBreakdown).map(([section, data]) => (
                      <Box key={section} sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {section.charAt(0).toUpperCase() + section.slice(1)}: {data.score}/{data.max}
                        </Typography>
                        {data.details && data.details.length > 0 && (
                          <List dense sx={{ pl: 2 }}>
                            {data.details.map((detail, idx) => (
                              <ListItem key={idx} sx={{ py: 0 }}>
                                <ListItemText primary={<Typography variant="caption">{detail}</Typography>} />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    ))}
                  </List>
                </Box>
              )}

              {/* Score Override */}
              {tenant.tenantScoring && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Override Score
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      type="number"
                      value={scoreOverride}
                      onChange={(e) => setScoreOverride(e.target.value)}
                      placeholder={tenant.tenantScoring || 0}
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleScoreOverride}
                      disabled={savingScore || !scoreOverride}
                      size="small"
                    >
                      {savingScore ? <CircularProgress size={20} /> : 'Save'}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card sx={{ height: 'auto', mt: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Stats
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Joined" 
                    secondary={formatDate(tenant.createdAt)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Description fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Applications" 
                    secondary={tenant.applicationCount || 0} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: AI Verification, Profile Details, Documents */}
        <Grid item xs={12} md={8} lg={9} sx={{ width: '79%' }}>
          {/* AI Verification Results */}
          {aiResults && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    AI Verification Results
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AttachMoney sx={{ mr: 1, color: 'blue.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Income Verification
                        </Typography>
                      </Box>
                      <Chip 
                        label={aiResults.incomeVerification.status}
                        color={aiResults.incomeVerification.status.includes('✓') ? 'success' : 'default'}
                        size="small"
                      />
                      {aiResults.incomeVerification.details.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {aiResults.incomeVerification.details.map((detail, index) => (
                            <Typography key={index} variant="caption" display="block" color="text.secondary">
                              {detail}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      
                      {/* AI Extracted Income Data */}
                      {tenant.tenantDocument && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" fontWeight="bold" color="primary" display="block" gutterBottom>
                            AI Extracted Data:
                          </Typography>
                          {['proofOfIncome', 'creditHistory', 'additionalDocuments'].map((docType) => {
                            const documents = tenant.tenantDocument[docType] || [];
                            const incomeDocs = documents.filter(doc => 
                              doc.aiParsedData && !doc.aiParsedData.error && 
                              (doc.aiParsedData.income || doc.aiParsedData.netIncome || doc.aiParsedData.employer)
                            );
                            
                            return incomeDocs.map((doc, index) => {
                              // Check for income mismatches
                              const aiIncome = Number(doc.aiParsedData.income || doc.aiParsedData.netIncome);
                              const manualIncome = tenant.tenantDocument.monthlyNetIncome;
                              const hasMismatch = manualIncome && aiIncome && Math.abs(aiIncome - manualIncome) / manualIncome >= 0.1;
                              
                              return (
                                <Box key={`${docType}-${index}`} sx={{ mb: 1, p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ flex: 1 }}>
                                      {doc.filename}
                                    </Typography>
                                    {hasMismatch && (
                                      <Tooltip title="Income mismatch detected">
                                        <Warning sx={{ fontSize: 'small', color: 'warning.main', ml: 1 }} />
                                      </Tooltip>
                                    )}
                                  </Box>
                                  {Object.entries(doc.aiParsedData).map(([key, value]) => {
                                    if (['parsedAt', 'documentType', 'error', 'message', 'raw'].includes(key)) return null;
                                    if (!value || value === 'null' || value === '') return null;
                                    if (!['income', 'netIncome', 'employer', 'name', 'documentType', 'payPeriod', 'documentDate'].includes(key)) return null;
                                    
                                    // Check if this specific field has a mismatch
                                    const isMismatchField = (key === 'income' || key === 'netIncome') && hasMismatch;
                                    
                                    return (
                                      <Typography key={key} variant="caption" display="block" color={isMismatchField ? 'warning.main' : 'text.secondary'}>
                                        <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {String(value)}
                                        {isMismatchField && manualIncome && (
                                          <span style={{ color: 'text.secondary' }}> (Manual: ${manualIncome.toLocaleString()})</span>
                                        )}
                                      </Typography>
                                    );
                                  })}
                                </Box>
                              );
                            });
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <VerifiedUser sx={{ mr: 1, color: 'green.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Identity Verification
                        </Typography>
                      </Box>
                      <Chip 
                        label={aiResults.identityVerification.status}
                        color={aiResults.identityVerification.status.includes('✓') ? 'success' : 'default'}
                        size="small"
                      />
                      {aiResults.identityVerification.details.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {aiResults.identityVerification.details.map((detail, index) => (
                            <Typography key={index} variant="caption" display="block" color="text.secondary">
                              {detail}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      
                      {/* AI Extracted Identity Data */}
                      {tenant.tenantDocument && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" fontWeight="bold" color="primary" display="block" gutterBottom>
                            AI Extracted Data:
                          </Typography>
                          {tenant.tenantDocument.proofOfIdentity?.map((doc, index) => {
                            if (!doc.aiParsedData || doc.aiParsedData.error) return null;
                            
                            // Check for name mismatches
                            const aiName = doc.aiParsedData.name?.toLowerCase() || '';
                            const tenantName = tenant.name?.toLowerCase() || '';
                            const hasMismatch = aiName && tenantName && 
                              !aiName.includes(tenantName.split(' ')[0]) && 
                              !tenantName.includes(aiName.split(' ')[0]);
                            
                            return (
                              <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ flex: 1 }}>
                                    Document: {doc.filename}
                                  </Typography>
                                  {hasMismatch && (
                                    <Tooltip title="Name mismatch detected">
                                      <Warning sx={{ fontSize: 'small', color: 'warning.main', ml: 1 }} />
                                    </Tooltip>
                                  )}
                                </Box>
                                {Object.entries(doc.aiParsedData).map(([key, value]) => {
                                  if (['parsedAt', 'documentType', 'error', 'message', 'raw'].includes(key)) return null;
                                  if (!value || value === 'null' || value === '') return null;
                                  
                                  // Check if this specific field has a mismatch
                                  const isMismatchField = key === 'name' && hasMismatch;
                                  
                                  return (
                                    <Typography key={key} variant="caption" display="block" color={isMismatchField ? 'warning.main' : 'text.secondary'}>
                                      <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {String(value)}
                                      {isMismatchField && tenant.name && (
                                        <span style={{ color: 'text.secondary' }}> (Tenant: {tenant.name})</span>
                                      )}
                                    </Typography>
                                  );
                                })}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CreditCard sx={{ mr: 1, color: 'orange.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Credit Verification
                        </Typography>
                      </Box>
                      <Chip 
                        label={aiResults.creditVerification.status}
                        color={aiResults.creditVerification.status.includes('✓') ? 'success' : 'default'}
                        size="small"
                      />
                      {aiResults.creditVerification.details.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {aiResults.creditVerification.details.map((detail, index) => (
                            <Typography key={index} variant="caption" display="block" color="text.secondary">
                              {detail}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      
                      {/* AI Extracted Credit Data */}
                      {tenant.tenantDocument && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" fontWeight="bold" color="primary" display="block" gutterBottom>
                            AI Extracted Data:
                          </Typography>
                          {tenant.tenantDocument.creditHistory?.map((doc, index) => {
                            if (!doc.aiParsedData || doc.aiParsedData.error) return null;
                            
                            // Check for credit score mismatches
                            const aiCreditScore = Number(doc.aiParsedData.creditScore);
                            const manualCreditScore = tenant.tenantDocument.creditScore;
                            const hasMismatch = manualCreditScore && aiCreditScore && Math.abs(aiCreditScore - manualCreditScore) >= 50;
                            
                            return (
                              <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ flex: 1 }}>
                                    {doc.filename}
                                  </Typography>
                                  {hasMismatch && (
                                    <Tooltip title="Credit score mismatch detected">
                                      <Warning sx={{ fontSize: 'small', color: 'warning.main', ml: 1 }} />
                                    </Tooltip>
                                  )}
                                </Box>
                                {Object.entries(doc.aiParsedData).map(([key, value]) => {
                                  if (['parsedAt', 'documentType', 'error', 'message', 'raw'].includes(key)) return null;
                                  if (!value || value === 'null' || value === '') return null;
                                  
                                  // Check if this specific field has a mismatch
                                  const isMismatchField = key === 'creditScore' && hasMismatch;
                                  
                                  return (
                                    <Typography key={key} variant="caption" display="block" color={isMismatchField ? 'warning.main' : 'text.secondary'}>
                                      <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {String(value)}
                                      {isMismatchField && manualCreditScore && (
                                        <span style={{ color: 'text.secondary' }}> (Manual: {manualCreditScore})</span>
                                      )}
                                    </Typography>
                                  );
                                })}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Home sx={{ mr: 1, color: 'red.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Rental History
                        </Typography>
                      </Box>
                      <Chip 
                        label={aiResults.rentalHistory.status}
                        color={aiResults.rentalHistory.status === 'Clean' ? 'success' : 'warning'}
                        size="small"
                      />
                      {aiResults.rentalHistory.details.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {aiResults.rentalHistory.details.map((detail, index) => (
                            <Typography key={index} variant="caption" display="block" color="text.secondary">
                              {detail}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      
                      {/* AI Extracted Rental Data */}
                      {tenant.tenantDocument && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" fontWeight="bold" color="primary" display="block" gutterBottom>
                            AI Extracted Data:
                          </Typography>
                          {tenant.tenantDocument.rentalHistory?.map((doc, index) => {
                            if (!doc.aiParsedData || doc.aiParsedData.error) return null;
                            
                            // Check for negative rental history
                            const hasNegativeRemarks = doc.aiParsedData.negativeRemarks && 
                              doc.aiParsedData.negativeRemarks.toLowerCase().includes('eviction');
                            const isEvictionDocument = doc.aiParsedData.documentType && 
                              doc.aiParsedData.documentType.toLowerCase().includes('eviction');
                            const hasIssues = hasNegativeRemarks || isEvictionDocument;
                            
                            return (
                              <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ flex: 1 }}>
                                    {doc.filename}
                                  </Typography>
                                  {hasIssues && (
                                    <Tooltip title="Negative rental history detected">
                                      <Warning sx={{ fontSize: 'small', color: 'error.main', ml: 1 }} />
                                    </Tooltip>
                                  )}
                                </Box>
                                {Object.entries(doc.aiParsedData).map(([key, value]) => {
                                  if (['parsedAt', 'documentType', 'error', 'message', 'raw'].includes(key)) return null;
                                  if (!value || value === 'null' || value === '') return null;
                                  
                                  // Check if this specific field has issues
                                  const isIssueField = (key === 'negativeRemarks' && hasNegativeRemarks) || 
                                                     (key === 'documentType' && isEvictionDocument);
                                  
                                  return (
                                    <Typography key={key} variant="caption" display="block" color={isIssueField ? 'error.main' : 'text.secondary'}>
                                      <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {String(value)}
                                    </Typography>
                                  );
                                })}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Profile Details */}
            {tenant.tenantDocument ? (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Profile Details
                </Typography>
                <Grid container spacing={2}>
                  {/* Employment & Income */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Work sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Employment & Income
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>Status:</strong> {tenant.tenantDocument.employmentStatus ? tenant.tenantDocument.employmentStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}
                      </Typography>
                      {tenant.tenantDocument.employerName && (
                        <Typography variant="body2">
                          <strong>Employer:</strong> {tenant.tenantDocument.employerName}
                        </Typography>
                      )}
                      {tenant.tenantDocument.jobTitle && (
                        <Typography variant="body2">
                          <strong>Job Title:</strong> {tenant.tenantDocument.jobTitle}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Monthly Income:</strong> ${tenant.tenantDocument.monthlyNetIncome?.toLocaleString() || 'Not specified'}
                      </Typography>
                      {tenant.tenantDocument.monthlyDebtRepayment && (
                        <Typography variant="body2">
                          <strong>Monthly Debt:</strong> ${tenant.tenantDocument.monthlyDebtRepayment.toLocaleString()}
                        </Typography>
                      )}
                      {tenant.tenantDocument.additionalIncomeAmount && (
                        <Typography variant="body2">
                          <strong>Additional Income:</strong> ${tenant.tenantDocument.additionalIncomeAmount.toLocaleString()}
                          {tenant.tenantDocument.additionalIncomeSource && ` (${tenant.tenantDocument.additionalIncomeSource})`}
                        </Typography>
                      )}
                      {tenant.tenantDocument.creditScore && (
                        <Typography variant="body2">
                          <strong>Credit Score:</strong> {tenant.tenantDocument.creditScore}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* Lifestyle */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Group sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Lifestyle & Household
                        </Typography>
                      </Box>
                      {tenant.tenantDocument.maritalStatus && (
                        <Typography variant="body2">
                          <strong>Marital Status:</strong> {tenant.tenantDocument.maritalStatus.charAt(0).toUpperCase() + tenant.tenantDocument.maritalStatus.slice(1)}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Group sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body2">
                          <strong>Adults:</strong> {tenant.tenantDocument.adultOccupants || 'Not specified'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <ChildCare sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body2">
                          <strong>Children:</strong> {tenant.tenantDocument.childOccupants || 'Not specified'}
                        </Typography>
                      </Box>
                      {tenant.tenantDocument.childSupportAmount > 0 && (
                        <Typography variant="body2">
                          <strong>Child Support:</strong> ${tenant.tenantDocument.childSupportAmount.toLocaleString()}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Pets sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body2">
                          <strong>Pets:</strong> {tenant.tenantDocument.hasPets ? 'Yes' : 'No'}
                          {tenant.tenantDocument.hasPets && tenant.tenantDocument.petCount && ` (${tenant.tenantDocument.petTypes || 'pets'})`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <SmokingRooms sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body2">
                          <strong>Smoking:</strong> {tenant.tenantDocument.smokingStatus ? tenant.tenantDocument.smokingStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Financial & Credit */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CreditCard sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Financial & Credit
                        </Typography>
                      </Box>
                      {tenant.tenantDocument.creditScore && (
                        <Typography variant="body2">
                          <strong>Credit Score:</strong> {tenant.tenantDocument.creditScore}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Bankruptcy History:</strong> {tenant.tenantDocument.bankruptcyHistory ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Eviction History:</strong> {tenant.tenantDocument.evictionHistory ? 'Yes' : 'No'}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Rental History */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Home sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Rental History
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>Currently Pays Rent:</strong> {tenant.tenantDocument.currentlyPaysRent === 'true' ? 'Yes' : 'No'}
                      </Typography>
                      {tenant.tenantDocument.currentRentAmount && (
                        <Typography variant="body2">
                          <strong>Current Rent:</strong> ${tenant.tenantDocument.currentRentAmount.toLocaleString()}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* Application Strengthening */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Application Strengthening
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>Can Pay in Advance:</strong> {tenant.tenantDocument.monthsAheadCanPay > 1 ? 'Yes' : 'No'}
                      </Typography>
                      {tenant.tenantDocument.monthsAheadCanPay > 1 && (
                        <Typography variant="body2">
                          <strong>Can Pay Months Ahead:</strong> {tenant.tenantDocument.monthsAheadCanPay}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Has Guarantor:</strong> {tenant.tenantDocument.hasGuarantor ? 'Yes' : 'No'}
                      </Typography>
                      {tenant.tenantDocument.hasGuarantor && tenant.tenantDocument.guarantorName && (
                        <Typography variant="body2">
                          <strong>Guarantor:</strong> {tenant.tenantDocument.guarantorName}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* Social Media Links */}
                  {tenant.socialMedia && Object.keys(tenant.socialMedia).some(key => tenant.socialMedia[key]) && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Social Media Links
                          </Typography>
                        </Box>
                        {tenant.socialMedia.facebook && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <FacebookIcon sx={{ mr: 1, fontSize: 'small', color: '#1877f2' }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              <strong>Facebook:</strong> 
                            </Typography>
                            <Button
                              size="small"
                              href={tenant.socialMedia.facebook}
                              target="_blank"
                              variant="text"
                              sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                            >
                              View Profile
                            </Button>
                          </Box>
                        )}
                        {tenant.socialMedia.linkedin && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <LinkedInIcon sx={{ mr: 1, fontSize: 'small', color: '#0077b5' }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              <strong>LinkedIn:</strong> 
                            </Typography>
                            <Button
                              size="small"
                              href={tenant.socialMedia.linkedin}
                              target="_blank"
                              variant="text"
                              sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                            >
                              View Profile
                            </Button>
                          </Box>
                        )}
                        {tenant.socialMedia.instagram && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <InstagramIcon sx={{ mr: 1, fontSize: 'small', color: '#e4405f' }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              <strong>Instagram:</strong> 
                            </Typography>
                            <Button
                              size="small"
                              href={tenant.socialMedia.instagram}
                              target="_blank"
                              variant="text"
                              sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                            >
                              View Profile
                            </Button>
                          </Box>
                        )}
                        {tenant.socialMedia.twitter && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <TwitterIcon sx={{ mr: 1, fontSize: 'small', color: '#1da1f2' }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              <strong>Twitter:</strong> 
                            </Typography>
                            <Button
                              size="small"
                              href={tenant.socialMedia.twitter}
                              target="_blank"
                              variant="text"
                              sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                            >
                              View Profile
                            </Button>
                          </Box>
                        )}
                        {tenant.socialMedia.website && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <LanguageIcon sx={{ mr: 1, fontSize: 'small', color: '#666' }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              <strong>Website:</strong> 
                            </Typography>
                            <Button
                              size="small"
                              href={tenant.socialMedia.website}
                              target="_blank"
                              variant="text"
                              sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                            >
                              Visit Site
                            </Button>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Alert severity="warning">
                  This tenant has not completed their profile yet.
                </Alert>
              </CardContent>
            </Card>
                )}

                {/* Documents */}
          {tenant.tenantDocument && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Documents
                </Typography>
                <Grid container spacing={2}>
                  {['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'].map((docType) => (
                    <Grid item xs={12} sm={6} md={4} key={docType}>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {tenant.tenantDocument[docType]?.length > 0 ? (
                            <List dense>
                              {tenant.tenantDocument[docType].map((doc, index) => (
                                <ListItem key={index}>
                                  <ListItemText
                                    primary={doc.filename}
                                    secondary={formatDate(doc.uploadedAt)}
                                  />
                                  <Button
                                    size="small"
                                    href={doc.url}
                                    target="_blank"
                                    variant="outlined"
                                  >
                                    View
                                  </Button>
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No documents uploaded
                            </Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
} 