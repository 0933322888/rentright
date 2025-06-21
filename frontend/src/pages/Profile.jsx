import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import DocumentUpload from '../components/DocumentUpload';
import { toast, Toaster } from 'react-hot-toast';
import { getProfilePictureUrl } from '../utils/imageUtils';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Alert,
  Container,
  Divider,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  MenuItem,
  InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';

// Document preview component similar to AddProperty
const DocumentPreview = ({ file, onDelete }) => {
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  const previewUrl = URL.createObjectURL(file);

  return (
    <Card sx={{ maxWidth: 200, position: 'relative', m: 1 }}>
      {isImage ? (
        <CardMedia
          component="img"
          sx={{
            height: 140,
            objectFit: 'cover'
          }}
          image={previewUrl}
          alt={file.name}
        />
      ) : (
        <Box
          sx={{
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100'
          }}
        >
          {isPDF ? (
            <PictureAsPdfIcon sx={{ fontSize: 48, color: 'error.main' }} />
          ) : (
            <ImageIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          )}
        </Box>
      )}
      <CardContent sx={{ p: 1 }}>
        <Typography variant="body2" noWrap title={file.name}>
          {file.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {(file.size / 1024).toFixed(1)} KB
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 0, justifyContent: 'center' }}>
        <IconButton 
          size="small" 
          color="error" 
          onClick={onDelete}
          sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.8)' }}
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: null,
    socialMedia: {
      facebook: '',
      linkedin: '',
      instagram: '',
      twitter: '',
      website: ''
    }
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [tenantData, setTenantData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState({
    // Employment & Income
    isCurrentlyEmployed: '',
    employmentType: '',
    monthlyNetIncome: '',
    hasAdditionalIncome: '',
    additionalIncomeDescription: '',
    
    // Expenses & Debts
    monthlyDebtRepayment: '',
    paysChildSupport: '',
    childSupportAmount: '',
    
    // Rental History
    hasBeenEvicted: '',
    currentlyPaysRent: '',
    currentRentAmount: '',
    
    // Financial Preparedness
    hasTwoMonthsRentSavings: '',
    canShareFinancialDocuments: '',
    
    // Existing fields
    canPayMoreThanOneMonth: '',
    monthsAheadCanPay: ''
  });
  const [documents, setDocuments] = useState({
    proofOfIdentity: [],
    proofOfIncome: [],
    creditHistory: [],
    rentalHistory: [],
    additionalDocuments: []
  });

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            socialMedia: user.socialMedia || {
              facebook: '',
              linkedin: '',
              instagram: '',
              twitter: '',
              website: ''
            }
          });

          // Fetch tenant data if user is a tenant
          if (user.role === 'tenant') {
            const token = localStorage.getItem('token');
            try {
              const response = await axios.get(API_ENDPOINTS.GET_TENANT_PROFILE, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const { data } = response;
              console.log('Fetched tenant data:', data);

              if (data) {
                const newAnswers = {
                  // Employment & Income
                  isCurrentlyEmployed: data.isCurrentlyEmployed === 'yes' ? 'true' : 'false',
                  employmentType: data.employmentType || '',
                  monthlyNetIncome: data.monthlyNetIncome || '',
                  hasAdditionalIncome: data.hasAdditionalIncome === 'yes' ? 'true' : 'false',
                  additionalIncomeDescription: data.additionalIncomeDescription || '',
                  
                  // Expenses & Debts
                  monthlyDebtRepayment: data.monthlyDebtRepayment || '',
                  paysChildSupport: data.paysChildSupport === 'yes' ? 'true' : 'false',
                  childSupportAmount: data.childSupportAmount || '',
                  
                  // Rental History
                  hasBeenEvicted: data.hasBeenEvicted === 'yes' ? 'true' : 'false',
                  currentlyPaysRent: data.currentlyPaysRent === 'yes' ? 'true' : 'false',
                  currentRentAmount: data.currentRentAmount || '',
                  
                  // Financial Preparedness
                  hasTwoMonthsRentSavings: data.hasTwoMonthsRentSavings === 'yes' ? 'true' : 'false',
                  canShareFinancialDocuments: data.canShareFinancialDocuments === 'yes' ? 'true' : 'false',
                  
                  // Existing fields
                  canPayMoreThanOneMonth: data.canPayMoreThanOneMonth === 'yes' ? 'true' : 'false',
                  monthsAheadCanPay: data.monthsAheadCanPay || ''
                };
                console.log('Setting initial answers:', newAnswers);
                setAnswers(newAnswers);

                // Initialize documents state
                const initialDocuments = {};

                // Process each document field
                ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'].forEach(field => {
                  if (data[field] && Array.isArray(data[field])) {
                    initialDocuments[field] = data[field].map(doc => ({
                      name: doc.originalName || 'Document',
                      type: doc.mimeType || 'application/octet-stream'
                    }));
                  } else {
                    initialDocuments[field] = [];
                  }
                });

                setDocuments(initialDocuments);
              }
            } catch (error) {
              console.error('Error fetching tenant profile:', error);
              setError('Failed to load tenant profile');
            }
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
          setError('Failed to load profile data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested social media fields
    if (name.startsWith('socialMedia.')) {
      const socialMediaField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialMediaField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAnswerChange = (e) => {
    const { name, value } = e.target;
    setAnswers(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploadError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      
      // Add social media data as JSON string
      formDataToSend.append('socialMedia', JSON.stringify(formData.socialMedia));
      
      if (formData.profilePicture) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(formData.profilePicture.type)) {
          setUploadError('Invalid file type. Only JPEG, PNG and GIF are allowed.');
          setLoading(false);
          return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (formData.profilePicture.size > maxSize) {
          setUploadError('File size too large. Maximum size is 5MB.');
          setLoading(false);
          return;
        }

        formDataToSend.append('profilePicture', formData.profilePicture);
      }

      const response = await axios.put(
        API_ENDPOINTS.UPDATE_PROFILE,
        formDataToSend,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        updateProfile(response.data);
        setSuccess('Profile updated successfully');
        // Clear the preview after successful upload
        setProfilePreview(null);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Client-side validation
      const requiredFields = [
        'isCurrentlyEmployed',
        'employmentType',
        'monthlyNetIncome',
        'hasAdditionalIncome',
        'monthlyDebtRepayment',
        'paysChildSupport',
        'hasBeenEvicted',
        'currentlyPaysRent',
        'hasTwoMonthsRentSavings',
        'canShareFinancialDocuments',
        'canPayMoreThanOneMonth'
      ];

      const missingFields = [];
      requiredFields.forEach(field => {
        if (!answers[field] || answers[field] === '') {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Add all answers to form data with proper type conversion
      Object.entries(answers).forEach(([key, value]) => {
        // Convert boolean radio values to 'yes'/'no' strings
        if (typeof value === 'string' && (value === 'true' || value === 'false')) {
          formData.append(key, value === 'true' ? 'yes' : 'no');
        } else {
          formData.append(key, value);
        }
      });

      // Add documents to form data
      Object.entries(documents).forEach(([field, files]) => {
        files.forEach((file, index) => {
          formData.append(`${field}`, file);
        });
      });

      const response = await axios.post(
        API_ENDPOINTS.UPDATE_TENANT_PROFILE,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        const { data } = response;
        console.log('Server response data:', data);
        
        // Update the answers state with the new values from the server
        const updatedAnswers = {
          // Employment & Income
          isCurrentlyEmployed: data.isCurrentlyEmployed === 'yes' ? 'true' : 'false',
          employmentType: data.employmentType || '',
          monthlyNetIncome: data.monthlyNetIncome || '',
          hasAdditionalIncome: data.hasAdditionalIncome === 'yes' ? 'true' : 'false',
          additionalIncomeDescription: data.additionalIncomeDescription || '',
          
          // Expenses & Debts
          monthlyDebtRepayment: data.monthlyDebtRepayment || '',
          paysChildSupport: data.paysChildSupport === 'yes' ? 'true' : 'false',
          childSupportAmount: data.childSupportAmount || '',
          
          // Rental History
          hasBeenEvicted: data.hasBeenEvicted === 'yes' ? 'true' : 'false',
          currentlyPaysRent: data.currentlyPaysRent === 'yes' ? 'true' : 'false',
          currentRentAmount: data.currentRentAmount || '',
          
          // Financial Preparedness
          hasTwoMonthsRentSavings: data.hasTwoMonthsRentSavings === 'yes' ? 'true' : 'false',
          canShareFinancialDocuments: data.canShareFinancialDocuments === 'yes' ? 'true' : 'false',
          
          // Existing fields
          canPayMoreThanOneMonth: data.canPayMoreThanOneMonth === 'yes' ? 'true' : 'false',
          monthsAheadCanPay: data.monthsAheadCanPay || ''
        };
        console.log('Updated answers:', updatedAnswers);
        setAnswers(updatedAnswers);

        // Update documents
        const updatedDocuments = {};

        ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'].forEach(field => {
          if (data[field] && Array.isArray(data[field])) {
            updatedDocuments[field] = data[field].map(doc => ({
              name: doc.originalName || 'Document',
              type: doc.mimeType || 'application/octet-stream'
            }));
          } else {
            updatedDocuments[field] = [];
          }
        });

        console.log('Updated documents:', updatedDocuments);

        setDocuments(updatedDocuments);
        setSuccess('Tenant profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating tenant profile:', error);
      setError(error.response?.data?.message || 'Failed to update tenant profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentDrop = (field) => (acceptedFiles) => {
    if (!Array.isArray(acceptedFiles)) {
      acceptedFiles = [acceptedFiles];
    }
    setDocuments(prev => ({
      ...prev,
      [field]: [...(Array.isArray(prev[field]) ? prev[field] : []), ...acceptedFiles]
    }));
  };

  const handleDeleteDocument = (field, index) => {
    setDocuments(prev => ({
      ...prev,
      [field]: (Array.isArray(prev[field]) ? prev[field] : []).filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      px: 0,
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)'
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 4 },
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          m: 0,
          width: '100%'
        }}
      >

        {/* Basic Profile Form */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            {/* Social Media Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Social Media Links
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Facebook"
                    name="socialMedia.facebook"
                    value={formData.socialMedia.facebook}
                    onChange={handleChange}
                    placeholder="https://facebook.com/yourprofile"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FacebookIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="LinkedIn"
                    name="socialMedia.linkedin"
                    value={formData.socialMedia.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkedInIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Instagram"
                    name="socialMedia.instagram"
                    value={formData.socialMedia.instagram}
                    onChange={handleChange}
                    placeholder="https://instagram.com/yourprofile"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <InstagramIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Twitter"
                    name="socialMedia.twitter"
                    value={formData.socialMedia.twitter}
                    onChange={handleChange}
                    placeholder="https://twitter.com/yourprofile"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TwitterIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website"
                    name="socialMedia.website"
                    value={formData.socialMedia.website}
                    onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LanguageIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ minWidth: 200 }}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Current Social Media Links Display */}
        {formData.socialMedia && Object.keys(formData.socialMedia).some(key => formData.socialMedia[key]) && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Social Media Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {formData.socialMedia.facebook && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 1, bgcolor: 'blue.50' }}>
                  <FacebookIcon sx={{ color: 'blue.600' }} />
                  <Typography variant="body2" sx={{ color: 'blue.600' }}>
                    Facebook
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
                    {formData.socialMedia.facebook}
                  </Typography>
                </Box>
              )}
              {formData.socialMedia.linkedin && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 1, bgcolor: 'blue.50' }}>
                  <LinkedInIcon sx={{ color: 'blue.700' }} />
                  <Typography variant="body2" sx={{ color: 'blue.700' }}>
                    LinkedIn
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
                    {formData.socialMedia.linkedin}
                  </Typography>
                </Box>
              )}
              {formData.socialMedia.instagram && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 1, bgcolor: 'pink.50' }}>
                  <InstagramIcon sx={{ color: 'pink.600' }} />
                  <Typography variant="body2" sx={{ color: 'pink.600' }}>
                    Instagram
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
                    {formData.socialMedia.instagram}
                  </Typography>
                </Box>
              )}
              {formData.socialMedia.twitter && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 1, bgcolor: 'sky.50' }}>
                  <TwitterIcon sx={{ color: 'sky.500' }} />
                  <Typography variant="body2" sx={{ color: 'sky.500' }}>
                    Twitter
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
                    {formData.socialMedia.twitter}
                  </Typography>
                </Box>
              )}
              {formData.socialMedia.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 1, bgcolor: 'grey.50' }}>
                  <LanguageIcon sx={{ color: 'grey.700' }} />
                  <Typography variant="body2" sx={{ color: 'grey.700' }}>
                    Website
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
                    {formData.socialMedia.website}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* Tenant Profile Section */}
        {user?.role === 'tenant' && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tenant Application
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We will use this information for each application to help you find the perfect property.
            </Typography>

            <Box component="form" onSubmit={handleTenantSubmit}>
              {/* Required fields note */}
              <Alert severity="info" sx={{ mb: 3 }}>
                Fields marked with an asterisk (*) are required. Please complete all required fields to submit your tenant profile.
              </Alert>

              {/* Section 1: Employment & Income */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Employment & Income
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Are you currently employed? *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <label>
                        <input
                          type="radio"
                          name="isCurrentlyEmployed"
                          value="true"
                          checked={answers.isCurrentlyEmployed === 'true'}
                          onChange={handleAnswerChange}
                          required
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="isCurrentlyEmployed"
                          value="false"
                          checked={answers.isCurrentlyEmployed === 'false'}
                          onChange={handleAnswerChange}
                          required
                        />
                        No
                      </label>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Employment Type *"
                      name="employmentType"
                      value={answers.employmentType}
                      onChange={handleAnswerChange}
                      required
                    >
                      <MenuItem value="">Select employment type</MenuItem>
                      <MenuItem value="full-time">Full-time</MenuItem>
                      <MenuItem value="part-time">Part-time</MenuItem>
                      <MenuItem value="self-employed">Self-employed</MenuItem>
                      <MenuItem value="contractor">Contractor</MenuItem>
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="unemployed">Unemployed</MenuItem>
                      <MenuItem value="retired">Retired</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Monthly Net Income (after taxes) *"
                      name="monthlyNetIncome"
                      type="number"
                      value={answers.monthlyNetIncome}
                      onChange={handleAnswerChange}
                      inputProps={{ min: 0, step: 0.01 }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Do you have any additional sources of income? *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <label>
                        <input
                          type="radio"
                          name="hasAdditionalIncome"
                          value="true"
                          checked={answers.hasAdditionalIncome === 'true'}
                          onChange={handleAnswerChange}
                          required
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="hasAdditionalIncome"
                          value="false"
                          checked={answers.hasAdditionalIncome === 'false'}
                          onChange={handleAnswerChange}
                          required
                        />
                        No
                      </label>
                    </Box>
                  </Grid>

                  {answers.hasAdditionalIncome === 'true' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Additional Income Description"
                        name="additionalIncomeDescription"
                        multiline
                        rows={3}
                        value={answers.additionalIncomeDescription}
                        onChange={handleAnswerChange}
                      />
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Section 2: Expenses & Debts */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Expenses & Debts
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Monthly Debt Repayment Amount *"
                      name="monthlyDebtRepayment"
                      type="number"
                      value={answers.monthlyDebtRepayment}
                      onChange={handleAnswerChange}
                      inputProps={{ min: 0, step: 0.01 }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Do you pay any regular child or spousal support? *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <label>
                        <input
                          type="radio"
                          name="paysChildSupport"
                          value="true"
                          checked={answers.paysChildSupport === 'true'}
                          onChange={handleAnswerChange}
                          required
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="paysChildSupport"
                          value="false"
                          checked={answers.paysChildSupport === 'false'}
                          onChange={handleAnswerChange}
                          required
                        />
                        No
                      </label>
                    </Box>
                  </Grid>

                  {answers.paysChildSupport === 'true' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Child Support Amount per Month"
                        name="childSupportAmount"
                        type="number"
                        value={answers.childSupportAmount}
                        onChange={handleAnswerChange}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Section 3: Rental History */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Rental History
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Have you ever been evicted? *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <label>
                        <input
                          type="radio"
                          name="hasBeenEvicted"
                          value="true"
                          checked={answers.hasBeenEvicted === 'true'}
                          onChange={handleAnswerChange}
                          required
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="hasBeenEvicted"
                          value="false"
                          checked={answers.hasBeenEvicted === 'false'}
                          onChange={handleAnswerChange}
                          required
                        />
                        No
                      </label>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Do you currently pay rent? *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <label>
                        <input
                          type="radio"
                          name="currentlyPaysRent"
                          value="true"
                          checked={answers.currentlyPaysRent === 'true'}
                          onChange={handleAnswerChange}
                          required
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="currentlyPaysRent"
                          value="false"
                          checked={answers.currentlyPaysRent === 'false'}
                          onChange={handleAnswerChange}
                          required
                        />
                        No
                      </label>
                    </Box>
                  </Grid>

                  {answers.currentlyPaysRent === 'true' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Rent Amount"
                        name="currentRentAmount"
                        type="number"
                        value={answers.currentRentAmount}
                        onChange={handleAnswerChange}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Section 4: Financial Preparedness */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Financial Preparedness
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Do you have savings equivalent to at least 2 months of rent? *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <label>
                        <input
                          type="radio"
                          name="hasTwoMonthsRentSavings"
                          value="true"
                          checked={answers.hasTwoMonthsRentSavings === 'true'}
                          onChange={handleAnswerChange}
                          required
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="hasTwoMonthsRentSavings"
                          value="false"
                          checked={answers.hasTwoMonthsRentSavings === 'false'}
                          onChange={handleAnswerChange}
                          required
                        />
                        No
                      </label>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Would you be comfortable sharing proof of income or financial statements? *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <label>
                        <input
                          type="radio"
                          name="canShareFinancialDocuments"
                          value="true"
                          checked={answers.canShareFinancialDocuments === 'true'}
                          onChange={handleAnswerChange}
                          required
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="canShareFinancialDocuments"
                          value="false"
                          checked={answers.canShareFinancialDocuments === 'false'}
                          onChange={handleAnswerChange}
                          required
                        />
                        No
                      </label>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Section 5: Additional Information */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Can you pay more than one month's rent at a time? *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <label>
                        <input
                          type="radio"
                          name="canPayMoreThanOneMonth"
                          value="true"
                          checked={answers.canPayMoreThanOneMonth === 'true'}
                          onChange={handleAnswerChange}
                          required
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="canPayMoreThanOneMonth"
                          value="false"
                          checked={answers.canPayMoreThanOneMonth === 'false'}
                          onChange={handleAnswerChange}
                          required
                        />
                        No
                      </label>
                    </Box>
                  </Grid>

                  {answers.canPayMoreThanOneMonth === 'true' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="How many months ahead can you pay?"
                        name="monthsAheadCanPay"
                        type="number"
                        value={answers.monthsAheadCanPay}
                        onChange={handleAnswerChange}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Document Upload Sections */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Required Documents
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Please upload the following documents to support your tenant application.
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <DocumentUpload
                      field="proofOfIdentity"
                      documents={documents}
                      onDrop={handleDocumentDrop('proofOfIdentity')}
                      onDelete={handleDeleteDocument}
                      maxFiles={5}
                      required={true}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <DocumentUpload
                      field="proofOfIncome"
                      documents={documents}
                      onDrop={handleDocumentDrop('proofOfIncome')}
                      onDelete={handleDeleteDocument}
                      maxFiles={5}
                      required={true}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <DocumentUpload
                      field="creditHistory"
                      documents={documents}
                      onDrop={handleDocumentDrop('creditHistory')}
                      onDelete={handleDeleteDocument}
                      maxFiles={5}
                      required={false}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <DocumentUpload
                      field="rentalHistory"
                      documents={documents}
                      onDrop={handleDocumentDrop('rentalHistory')}
                      onDelete={handleDeleteDocument}
                      maxFiles={5}
                      required={false}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <DocumentUpload
                      field="additionalDocuments"
                      documents={documents}
                      onDrop={handleDocumentDrop('additionalDocuments')}
                      onDelete={handleDeleteDocument}
                      maxFiles={5}
                      required={false}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Updating...' : 'Update Tenant Profile'}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
      </Paper>

      <Toaster />
    </Box>
  );
} 