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
  InputAdornment,
  Avatar,
  Stack,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Switch,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Collapse,
  Fade,
  Zoom,
  Slide,
  Fab,
  Backdrop,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Tooltip from '@mui/material/Tooltip';

// Custom Enhanced Radio Button Component
const EnhancedRadioButton = ({ value, label, checked, onChange, name, disabled = false, size = 'medium' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 40,
        minHeight: 40,
        px: 2,
        border: '1px solid',
        borderColor: checked ? '#4a64ad' : '#e0e0e0',
        borderRadius: '4px',
        bgcolor: disabled ? '#f5f5f5' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        fontSize: '1rem',
        '&:hover': {
          borderColor: disabled ? '#e0e0e0' : '#4a64ad',
        },
        ...(checked && {
          boxShadow: '0 0 0 2px rgba(74,100,173,0.08)'
        })
      }}
      onClick={() => !disabled && onChange({ target: { name, value } })}
      tabIndex={0}
      role="radio"
      aria-checked={checked}
    >
      {checked ? (
        <CheckCircleIcon sx={{ fontSize: 20, color: '#4a64ad' }} />
      ) : (
        <RadioButtonUncheckedIcon sx={{ fontSize: 20, color: '#bdbdbd' }} />
      )}
      <Typography
        variant={size === 'small' ? 'body2' : 'body1'}
        sx={{
          ml: 1.2,
          fontWeight: 400,
          color: checked ? '#4a64ad' : '#222',
          fontSize: '1rem',
          fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
          lineHeight: '1.4375em',
          userSelect: 'none',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

// Section Header Component
const SectionHeader = ({ number, title, icon: Icon, description, completed = false }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    mb: 3,
    p: 2,
    borderRadius: 2,
    bgcolor: completed ? '#f0f9ff' : '#f8f9ff',
    border: '1px solid',
    borderColor: completed ? '#bae6fd' : '#e3e8ff'
  }}>
    <Box sx={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      bgcolor: completed ? '#0ea5e9' : '#4a64ad',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mr: 2,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {completed ? (
        <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} />
      ) : (
        <Icon sx={{ color: 'white', fontSize: 20 }} />
      )}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#4a64ad' }}>
          {title}
        </Typography>
        {completed && (
          <Chip 
            label="Complete" 
            size="small" 
            sx={{ 
              fontSize: '0.75rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              fontWeight: 500
            }}
            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
          />
        )}
      </Box>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
          {description}
        </Typography>
      )}
    </Box>
  </Box>
);

// Enhanced Form Field Component
const EnhancedTextField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  required = false, 
  error = false, 
  helperText = '',
  tooltip = '',
  ...props 
}) => (
  <Box sx={{ position: 'relative' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
      <TextField
        fullWidth
        label={label}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        error={error}
        helperText={helperText}
        sx={{
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4a64ad',
                borderWidth: 1
              }
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4a64ad',
                borderWidth: 1
              }
            }
          },
          '& .MuiInputLabel-root': {
            color: '#6b7280',
            fontSize: '0.9rem'
          },
          '& .MuiOutlinedInput-input': {
            fontSize: '0.9rem'
          }
        }}
        {...props}
      />
      {tooltip && (
        <Tooltip title={tooltip} arrow placement="top">
          <InfoOutlinedIcon sx={{ color: '#9ca3af', cursor: 'help', mb: 1, fontSize: 20 }} />
        </Tooltip>
      )}
    </Box>
  </Box>
);

// Enhanced Radio Group Component
const EnhancedRadioGroup = ({ 
  name, 
  value, 
  onChange, 
  options, 
  label, 
  required = false, 
  error = false, 
  helperText = '',
  columns = 2 
}) => (
  <FormControl required={required} error={error} fullWidth>
    <Typography component="legend" variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
      {label}
    </Typography>
    <Grid container spacing={2}>
      {options.map((option) => (
        <Grid item xs={12} sm={6} md={12 / columns} key={option.value}>
          <EnhancedRadioButton
            value={option.value}
            label={option.label}
            checked={value === option.value}
            onChange={onChange}
            name={name}
            size="medium"
          />
        </Grid>
      ))}
    </Grid>
    {helperText && (
      <FormHelperText sx={{ mt: 1, fontSize: '0.875rem' }}>
        {helperText}
      </FormHelperText>
    )}
  </FormControl>
);

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

// Section completion helpers
const isPersonalSectionComplete = (answers) => {
  if (
    !answers.adultOccupants ||
    !answers.childOccupants ||
    answers.hasPets === undefined ||
    !answers.smokingStatus
  ) return false;
  if (answers.hasPets === true || answers.hasPets === 'true') {
    if (!answers.petCount || !answers.petTypes) return false;
  }
  return true;
};

const isEmploymentSectionComplete = (answers) => {
  return (
    !!answers.employmentStatus &&
    !!answers.monthlyNetIncome &&
    !!answers.monthlyDebtRepayment
  );
};

const isFinancialSectionComplete = (answers) => {
  // No required fields, always complete
  return true;
};

const isRentalSectionComplete = (answers) => {
  if (answers.currentlyPaysRent === undefined || !answers.currentRentAmount) return false;
  return true;
};

const isStrengthenSectionComplete = (answers) => {
  if (answers.canPayAdvance === undefined || answers.hasGuarantor === undefined) return false;
  if ((answers.canPayAdvance === true || answers.canPayAdvance === 'true') && !answers.monthsAheadCanPay) return false;
  if (answers.hasGuarantor === true || answers.hasGuarantor === 'true') {
    if (!answers.guarantorName || !answers.guarantorRelationship || !answers.guarantorPhone || !answers.guarantorEmail || !answers.guarantorAddress || !answers.guarantorMonthlyIncome || !answers.guarantorEmployer || !answers.guarantorJobTitle) return false;
  }
  return true;
};

const isDocumentsSectionComplete = (documents) => {
  // Example: require proofOfIdentity and proofOfIncome
  return documents.proofOfIdentity?.length > 0 && documents.proofOfIncome?.length > 0;
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
  const [validationErrors, setValidationErrors] = useState([]);
  const [answers, setAnswers] = useState({
    // Employment & Income
    employmentStatus: '',
    employerName: '',
    jobTitle: '',
    monthlyNetIncome: '',
    monthlyDebtRepayment: '',
    additionalIncomeAmount: '',
    additionalIncomeSource: '',

    // Housing Preferences
    currentRentAmount: '',
    monthsAheadCanPay: '',

    // Family & Occupants
    maritalStatus: '',
    childSupportAmount: '',
    adultOccupants: '',
    childOccupants: '',

    // Pets & Smoking
    hasPets: false,
    petCount: '',
    petTypes: '',
    petSizes: [],
    smokingStatus: '',

    // Financial & Credit
    creditScore: '',
    bankruptcyHistory: false,
    evictionHistory: false,

    // Application Strengthening
    canPayAdvance: false,
    hasGuarantor: false,
    guarantorName: '',
    guarantorRelationship: '',
    guarantorPhone: '',
    guarantorEmail: '',
    guarantorAddress: '',
    guarantorMonthlyIncome: '',
    guarantorEmployer: '',
    guarantorJobTitle: '',
    currentlyPaysRent: false
  });
  const [documents, setDocuments] = useState({
    proofOfIdentity: [],
    proofOfIncome: [],
    creditHistory: [],
    rentalHistory: [],
    additionalDocuments: []
  });
  const [documentUploading, setDocumentUploading] = useState({
    proofOfIdentity: false,
    proofOfIncome: false,
    creditHistory: false,
    rentalHistory: false,
    additionalDocuments: false
  });

  const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  const MAX_FILE_SIZE_MB = 5;
  const MAX_TOTAL_FILES = 10;

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
                  employmentStatus: data.employmentStatus || '',
                  employerName: data.employerName || '',
                  jobTitle: data.jobTitle || '',
                  monthlyNetIncome: data.monthlyNetIncome || '',
                  monthlyDebtRepayment: data.monthlyDebtRepayment || '',
                  additionalIncomeAmount: data.additionalIncomeAmount || '',
                  additionalIncomeSource: data.additionalIncomeSource || '',

                  // Housing Preferences
                  currentRentAmount: data.currentRentAmount || '',
                  monthsAheadCanPay: data.monthsAheadCanPay || '',

                  // Family & Occupants
                  maritalStatus: data.maritalStatus || '',
                  childSupportAmount: data.childSupportAmount || '',
                  adultOccupants: data.adultOccupants || '',
                  childOccupants: data.childOccupants || '',

                  // Pets & Smoking
                  hasPets: data.hasPets || false,
                  petCount: data.petCount || '',
                  petTypes: data.petTypes || '',
                  petSizes: data.petSizes || [],
                  smokingStatus: data.smokingStatus || '',

                  // Financial & Credit
                  creditScore: data.creditScore || '',
                  bankruptcyHistory: data.bankruptcyHistory || false,
                  evictionHistory: data.evictionHistory || false,

                  // Application Strengthening
                  canPayAdvance: data.canPayAdvance || false,
                  hasGuarantor: data.hasGuarantor || false,
                  guarantorName: data.guarantorName || '',
                  guarantorRelationship: data.guarantorRelationship || '',
                  guarantorPhone: data.guarantorPhone || '',
                  guarantorEmail: data.guarantorEmail || '',
                  guarantorAddress: data.guarantorAddress || '',
                  guarantorMonthlyIncome: data.guarantorMonthlyIncome || '',
                  guarantorEmployer: data.guarantorEmployer || '',
                  guarantorJobTitle: data.guarantorJobTitle || '',
                  currentlyPaysRent: data.currentlyPaysRent || false
                };
                console.log('Setting initial answers:', newAnswers);
                setAnswers(newAnswers);

                // Initialize documents state
                const initialDocuments = {};

                // Process each document field
                ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'].forEach(field => {
                  if (data[field] && Array.isArray(data[field])) {
                    initialDocuments[field] = data[field];
                  } else {
                    initialDocuments[field] = [];
                  }
                });

                setDocuments(initialDocuments);
              }
            } catch (error) {
              // Don't show error for 404 (no tenant profile yet) - this is normal for new users
              if (error.response?.status === 404) {
                console.log('No tenant profile found yet - this is normal for new users');
                // Initialize empty answers for new tenant
                setAnswers({
                  // Employment & Income
                  employmentStatus: '',
                  employerName: '',
                  jobTitle: '',
                  monthlyNetIncome: '',
                  monthlyDebtRepayment: '',
                  additionalIncomeAmount: '',
                  additionalIncomeSource: '',

                  // Housing Preferences
                  currentRentAmount: '',
                  monthsAheadCanPay: '',

                  // Family & Occupants
                  maritalStatus: '',
                  childSupportAmount: '',
                  adultOccupants: '',
                  childOccupants: '',

                  // Pets & Smoking
                  hasPets: false,
                  petCount: '',
                  petTypes: '',
                  petSizes: [],
                  smokingStatus: '',

                  // Financial & Credit
                  creditScore: '',
                  bankruptcyHistory: false,
                  evictionHistory: false,

                  // Application Strengthening
                  canPayAdvance: false,
                  hasGuarantor: false,
                  guarantorName: '',
                  guarantorRelationship: '',
                  guarantorPhone: '',
                  guarantorEmail: '',
                  guarantorAddress: '',
                  guarantorMonthlyIncome: '',
                  guarantorEmployer: '',
                  guarantorJobTitle: '',
                  currentlyPaysRent: false
                });
                setDocuments({
                  proofOfIdentity: [],
                  proofOfIncome: [],
                  creditHistory: [],
                  rentalHistory: [],
                  additionalDocuments: []
                });
              } else {
                console.error('Error fetching tenant profile:', error);
                setError('Failed to load tenant profile');
              }
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
    setLoading(true);
    setValidationErrors([]);

    // Client-side validation for Basic Information only
    const requiredFields = ['name', 'email'];
    const missingFields = [];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setValidationErrors(missingFields);
      setLoading(false);
      return;
    }

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

  const handleDocumentUpload = async (file, field) => {
    // Set loading state for this field
    setDocumentUploading(prev => ({ ...prev, [field]: true }));
    
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('document', file);
    formData.append('field', field);

    try {
      const response = await axios.post(API_ENDPOINTS.UPLOAD_TENANT_DOCUMENT, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add the new document metadata to the state
      setDocuments(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), response.data],
      }));
      toast.success(`${file.name} uploaded successfully!`);

    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Failed to upload ${file.name}.`);
    } finally {
      // Clear loading state for this field
      setDocumentUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setValidationErrors([]);

    try {
      // Client-side validation for tenant profile
      const requiredFields = [
        'employmentStatus',
        'monthlyNetIncome',
        'monthlyDebtRepayment',
        'adultOccupants',
        'childOccupants',
        'hasPets',
        'smokingStatus'
      ];

      // Add conditional required fields
      if (answers.additionalIncomeAmount && answers.additionalIncomeAmount > 0) {
        requiredFields.push('additionalIncomeSource');
      }
      if (answers.childSupportAmount && answers.childSupportAmount > 0) {
        requiredFields.push('childSupportAmount');
      }
      if (answers.currentRentAmount && answers.currentRentAmount > 0) {
        requiredFields.push('currentRentAmount');
      }
      if (answers.hasPets === true || answers.hasPets === 'true') {
        requiredFields.push('petCount', 'petTypes');
      }

      const missingFields = [];
      requiredFields.forEach(field => {
        const value = answers[field];
        // Check for boolean fields differently
        if (field === 'hasPets') {
          if (value !== true && value !== false && value !== 'true' && value !== 'false') {
            missingFields.push(field);
          }
        } else if (value === undefined || value === null || value === '') {
          missingFields.push(field);
        }
      });

      // Check required documents (currently none are required)
      const requiredDocuments = []; // ['proofOfIdentity', 'proofOfIncome'];
      requiredDocuments.forEach(field => {
        if (!documents[field] || documents[field].length === 0) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields);
        console.log('Current answers:', answers);
        setError(`Please fill in all required fields and upload required documents. Missing: ${missingFields.join(', ')}`);
        setValidationErrors(missingFields);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');

      const documentsToSubmit = {};
      Object.entries(documents).forEach(([field, files]) => {
        documentsToSubmit[field] = files.map(file => ({
          url: file.url,
          s3Key: file.s3Key,
          filename: file.filename,
          mimeType: file.mimeType,
          originalName: file.originalName || file.filename,
          uploadedAt: new Date()
        }));
      });

      const transformedAnswers = { ...answers };
      // Convert boolean values to proper format for the schema
      if (typeof transformedAnswers.hasPets === 'string') {
        transformedAnswers.hasPets = transformedAnswers.hasPets === 'true';
      }
      if (typeof transformedAnswers.bankruptcyHistory === 'string') {
        transformedAnswers.bankruptcyHistory = transformedAnswers.bankruptcyHistory === 'true';
      }
      if (typeof transformedAnswers.evictionHistory === 'string') {
        transformedAnswers.evictionHistory = transformedAnswers.evictionHistory === 'true';
      }
      if (typeof transformedAnswers.canPayAdvance === 'string') {
        transformedAnswers.canPayAdvance = transformedAnswers.canPayAdvance === 'true';
      }
      if (typeof transformedAnswers.hasGuarantor === 'string') {
        transformedAnswers.hasGuarantor = transformedAnswers.hasGuarantor === 'true';
      }
      if (typeof transformedAnswers.currentlyPaysRent === 'string') {
        transformedAnswers.currentlyPaysRent = transformedAnswers.currentlyPaysRent === 'true';
      }

      // Convert numeric fields
      if (transformedAnswers.monthlyNetIncome) {
        transformedAnswers.monthlyNetIncome = Number(transformedAnswers.monthlyNetIncome);
      }
      if (transformedAnswers.monthlyDebtRepayment) {
        transformedAnswers.monthlyDebtRepayment = Number(transformedAnswers.monthlyDebtRepayment);
      }
      if (transformedAnswers.additionalIncomeAmount) {
        transformedAnswers.additionalIncomeAmount = Number(transformedAnswers.additionalIncomeAmount);
      }
      if (transformedAnswers.currentRentAmount) {
        transformedAnswers.currentRentAmount = Number(transformedAnswers.currentRentAmount);
      }
      if (transformedAnswers.monthsAheadCanPay) {
        transformedAnswers.monthsAheadCanPay = Number(transformedAnswers.monthsAheadCanPay);
      }
      if (transformedAnswers.childSupportAmount) {
        transformedAnswers.childSupportAmount = Number(transformedAnswers.childSupportAmount);
      }
      if (transformedAnswers.adultOccupants) {
        transformedAnswers.adultOccupants = Number(transformedAnswers.adultOccupants);
      }
      if (transformedAnswers.childOccupants) {
        transformedAnswers.childOccupants = Number(transformedAnswers.childOccupants);
      }
      if (transformedAnswers.petCount) {
        transformedAnswers.petCount = Number(transformedAnswers.petCount);
      }
      if (transformedAnswers.creditScore) {
        transformedAnswers.creditScore = Number(transformedAnswers.creditScore);
      }
      if (transformedAnswers.guarantorMonthlyIncome) {
        transformedAnswers.guarantorMonthlyIncome = Number(transformedAnswers.guarantorMonthlyIncome);
      }

      const payload = { ...transformedAnswers, ...documentsToSubmit };

      console.log('Submitting payload:', payload);

      const response = await axios.post(
        API_ENDPOINTS.UPDATE_TENANT_PROFILE,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        const { data } = response;
        console.log('Server response data:', data);

        // Update the answers state with the new values from the server
        const updatedAnswers = {
          // Employment & Income
          employmentStatus: data.employmentStatus || '',
          employerName: data.employerName || '',
          jobTitle: data.jobTitle || '',
          monthlyNetIncome: data.monthlyNetIncome || '',
          monthlyDebtRepayment: data.monthlyDebtRepayment || '',
          additionalIncomeAmount: data.additionalIncomeAmount || '',
          additionalIncomeSource: data.additionalIncomeSource || '',

          // Housing Preferences
          currentRentAmount: data.currentRentAmount || '',
          monthsAheadCanPay: data.monthsAheadCanPay || '',

          // Family & Occupants
          maritalStatus: data.maritalStatus || '',
          childSupportAmount: data.childSupportAmount || '',
          adultOccupants: data.adultOccupants || '',
          childOccupants: data.childOccupants || '',

          // Pets & Smoking
          hasPets: data.hasPets || false,
          petCount: data.petCount || '',
          petTypes: data.petTypes || '',
          petSizes: data.petSizes || [],
          smokingStatus: data.smokingStatus || '',

          // Financial & Credit
          creditScore: data.creditScore || '',
          bankruptcyHistory: data.bankruptcyHistory || false,
          evictionHistory: data.evictionHistory || false,

          // Application Strengthening
          canPayAdvance: data.canPayAdvance || false,
          hasGuarantor: data.hasGuarantor || false,
          guarantorName: data.guarantorName || '',
          guarantorRelationship: data.guarantorRelationship || '',
          guarantorPhone: data.guarantorPhone || '',
          guarantorEmail: data.guarantorEmail || '',
          guarantorAddress: data.guarantorAddress || '',
          guarantorMonthlyIncome: data.guarantorMonthlyIncome || '',
          guarantorEmployer: data.guarantorEmployer || '',
          guarantorJobTitle: data.guarantorJobTitle || '',
          currentlyPaysRent: data.currentlyPaysRent || false
        };
        console.log('Updated answers:', updatedAnswers);
        setAnswers(updatedAnswers);

        // Update documents
        const updatedDocuments = {};
        ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'].forEach(field => {
          if (data[field] && Array.isArray(data[field])) {
            updatedDocuments[field] = data[field];
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
    // Count total files across all fields
    const totalFiles = Object.values(documents).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
    if (totalFiles + acceptedFiles.length > MAX_TOTAL_FILES) {
      toast.error(`You can upload a maximum of ${MAX_TOTAL_FILES} files in total.`);
      return;
    }
    
    // Validate each file
    for (const file of acceptedFiles) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error('Only PNG, JPEG, and WEBP images are allowed.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`File size must be less than ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
    }
    
    // Upload files sequentially to avoid overwhelming the server
    acceptedFiles.forEach(file => {
      handleDocumentUpload(file, field);
    });
  };

  const handleDeleteDocument = async (field, docId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_ENDPOINTS.DELETE_TENANT_DOCUMENT}/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDocuments(prev => ({
        ...prev,
        [field]: (prev[field] || []).filter(doc => doc._id !== docId)
      }));
      toast.success('Document deleted successfully.');

    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document.');
    }
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
        <Toaster position="top-right" />

        {/* OAuth Social Media Notification */}
        {user?.socialProfile?.provider && user?.socialMedia && Object.keys(user.socialMedia).length > 0 && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => setSuccess('')}>
                Dismiss
              </Button>
            }
          >
            <Typography variant="body2">
              <strong>Social Media Connected!</strong> Your {user.socialProfile.provider} account has been linked to your profile.
              You can edit these links below or add additional social media accounts.
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Basic Profile Form */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    error={validationErrors.includes('name')}
                  />
                  <Tooltip title={validationErrors.includes('name') ? 'Name is required' : 'Required'} arrow>
                    <InfoOutlinedIcon sx={{ color: validationErrors.includes('name') ? 'error.main' : 'action.active', cursor: 'help', mb: 1 }} />
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    error={validationErrors.includes('email')}
                  />
                  <Tooltip title={validationErrors.includes('email') ? 'Email is required' : 'Required'} arrow>
                    <InfoOutlinedIcon sx={{ color: validationErrors.includes('email') ? 'error.main' : 'action.active', cursor: 'help', mb: 1 }} />
                  </Tooltip>
                </Box>
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

            {/* Profile Picture Upload Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Profile Picture
              </Typography>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {/* Current Profile Picture Display */}
                    <Avatar
                      src={profilePreview ? URL.createObjectURL(profilePreview) : (user?.profilePicture ? getProfilePictureUrl(user.profilePicture) : null)}
                      sx={{
                        width: 120,
                        height: 120,
                        border: '3px solid',
                        borderColor: 'primary.main',
                        boxShadow: 3
                      }}
                    >
                      {!profilePreview && !user?.profilePicture && (
                        <Typography variant="h3" sx={{ color: 'white' }}>
                          {user?.name?.charAt(0).toUpperCase()}
                        </Typography>
                      )}
                    </Avatar>

                    {/* Upload Button */}
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<PhotoCameraIcon />}
                      sx={{ minWidth: 150 }}
                    >
                      Upload Photo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // Validate file type
                            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                            if (!allowedTypes.includes(file.type)) {
                              setUploadError('Invalid file type. Only JPEG, PNG and GIF are allowed.');
                              return;
                            }

                            // Validate file size (max 5MB)
                            const maxSize = 5 * 1024 * 1024; // 5MB
                            if (file.size > maxSize) {
                              setUploadError('File size too large. Maximum size is 5MB.');
                              return;
                            }

                            setFormData(prev => ({ ...prev, profilePicture: file }));
                            setProfilePreview(file);
                            setUploadError('');
                          }
                        }}
                      />
                    </Button>

                    {/* Remove Button */}
                    {(profilePreview || user?.profilePicture) && (
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, profilePicture: null }));
                          setProfilePreview(null);
                          setUploadError('');
                        }}
                      >
                        Remove Photo
                      </Button>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Upload a profile picture to personalize your account.
                      Supported formats: JPEG, PNG, GIF. Maximum size: 5MB.
                    </Typography>

                    {uploadError && (
                      <Alert severity="error" onClose={() => setUploadError('')}>
                        {uploadError}
                      </Alert>
                    )}

                    {profilePreview && (
                      <Alert severity="info">
                        New profile picture selected: {profilePreview.name}
                      </Alert>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>

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
          <Paper sx={{ 
            p: 4, 
            mb: 3, 
            borderRadius: 3, 
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ 
                fontWeight: 600, 
                color: '#4a64ad',
                mb: 2
              }}>
                Tenant Application Profile
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1rem', lineHeight: 1.6 }}>
                Complete your profile to streamline your property applications. This information helps landlords make informed decisions.
              </Typography>
              <Alert severity="info" sx={{
                '& .MuiAlert-message': { fontSize: '0.9rem' },
                backgroundColor: '#f8f9ff',
                border: '1px solid',
                borderColor: '#e3e8ff',
                borderRadius: 2,
                color: '#4a64ad'
              }}>
                <Typography variant="body2">
                  <strong>Required Fields:</strong> All fields marked with an asterisk (*) must be completed to submit your profile.
                </Typography>
              </Alert>
            </Box>

            {/* Progress Indicator */}
            <Box sx={{ mb: 4 }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  background: 'linear-gradient(180deg, #4a64ad42 0%, #ffffff 100%)',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#4a64ad' }}>
                    Profile Completion
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#4a64ad' }}>
                    {(() => {
                      const calculateProgress = () => {
                        const requiredFields = [
                          'adultOccupants', 'childOccupants', 'hasPets', 'smokingStatus', 'maritalStatus',
                          'employmentStatus', 'monthlyNetIncome', 'monthlyDebtRepayment', 'currentlyPaysRent',
                          'currentRentAmount', 'canPayAdvance', 'hasGuarantor'
                        ];
                        
                        const optionalFields = [
                          'employerName', 'jobTitle', 'additionalIncomeAmount', 'additionalIncomeSource',
                          'childSupportAmount', 'creditScore', 'bankruptcyHistory', 'evictionHistory',
                          'monthsAheadCanPay'
                        ];

                        const guarantorFields = [
                          'guarantorName', 'guarantorRelationship', 'guarantorPhone', 'guarantorEmail',
                          'guarantorAddress', 'guarantorMonthlyIncome', 'guarantorEmployer', 'guarantorJobTitle'
                        ];

                        let completed = 0;
                        let total = requiredFields.length + optionalFields.length;

                        // Check required fields
                        requiredFields.forEach(field => {
                          if (answers[field] !== undefined && answers[field] !== '' && answers[field] !== null) {
                            completed++;
                          }
                        });

                        // Check optional fields
                        optionalFields.forEach(field => {
                          if (answers[field] !== undefined && answers[field] !== '' && answers[field] !== null) {
                            completed++;
                          }
                        });

                        // Check guarantor fields if hasGuarantor is true
                        if (answers.hasGuarantor) {
                          total += guarantorFields.length;
                          guarantorFields.forEach(field => {
                            if (answers[field] !== undefined && answers[field] !== '' && answers[field] !== null) {
                              completed++;
                            }
                          });
                        }

                        // Check documents
                        const documentFields = ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'];
                        documentFields.forEach(field => {
                          if (documents[field] && documents[field].length > 0) {
                            completed++;
                          }
                        });

                        return Math.round((completed / total) * 100);
                      };
                      return calculateProgress();
                    })()}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(() => {
                    const calculateProgress = () => {
                      const requiredFields = [
                        'adultOccupants', 'childOccupants', 'hasPets', 'smokingStatus', 'maritalStatus',
                        'employmentStatus', 'monthlyNetIncome', 'monthlyDebtRepayment', 'currentlyPaysRent',
                        'currentRentAmount', 'canPayAdvance', 'hasGuarantor'
                      ];
                      
                      const optionalFields = [
                        'employerName', 'jobTitle', 'additionalIncomeAmount', 'additionalIncomeSource',
                        'childSupportAmount', 'creditScore', 'bankruptcyHistory', 'evictionHistory',
                        'monthsAheadCanPay'
                      ];

                      const guarantorFields = [
                        'guarantorName', 'guarantorRelationship', 'guarantorPhone', 'guarantorEmail',
                        'guarantorAddress', 'guarantorMonthlyIncome', 'guarantorEmployer', 'guarantorJobTitle'
                      ];

                      let completed = 0;
                      let total = requiredFields.length + optionalFields.length;

                      // Check required fields
                      requiredFields.forEach(field => {
                        if (answers[field] !== undefined && answers[field] !== '' && answers[field] !== null) {
                          completed++;
                        }
                      });

                      // Check optional fields
                      optionalFields.forEach(field => {
                        if (answers[field] !== undefined && answers[field] !== '' && answers[field] !== null) {
                          completed++;
                        }
                      });

                      // Check guarantor fields if hasGuarantor is true
                      if (answers.hasGuarantor) {
                        total += guarantorFields.length;
                        guarantorFields.forEach(field => {
                          if (answers[field] !== undefined && answers[field] !== '' && answers[field] !== null) {
                            completed++;
                          }
                        });
                      }

                      // Check documents
                      const documentFields = ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'];
                      documentFields.forEach(field => {
                        if (documents[field] && documents[field].length > 0) {
                          completed++;
                        }
                      });

                      return Math.round((completed / total) * 100);
                    };
                    return calculateProgress();
                  })()} 
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(74, 100, 173, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #4a64ad 0%, #6b7fd8 100%)'
                    }
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1, color: '#4a64ad', opacity: 0.8 }}>
                  {(() => {
                    const calculateProgress = () => {
                      const requiredFields = [
                        'adultOccupants', 'childOccupants', 'hasPets', 'smokingStatus', 'maritalStatus',
                        'employmentStatus', 'monthlyNetIncome', 'monthlyDebtRepayment', 'currentlyPaysRent',
                        'currentRentAmount', 'canPayAdvance', 'hasGuarantor'
                      ];
                      
                      const optionalFields = [
                        'employerName', 'jobTitle', 'additionalIncomeAmount', 'additionalIncomeSource',
                        'childSupportAmount', 'creditScore', 'bankruptcyHistory', 'evictionHistory',
                        'monthsAheadCanPay'
                      ];

                      const guarantorFields = [
                        'guarantorName', 'guarantorRelationship', 'guarantorPhone', 'guarantorEmail',
                        'guarantorAddress', 'guarantorMonthlyIncome', 'guarantorEmployer', 'guarantorJobTitle'
                      ];

                      let completed = 0;
                      let total = requiredFields.length + optionalFields.length;

                      // Check required fields
                      requiredFields.forEach(field => {
                        if (answers[field] !== undefined && answers[field] !== '' && answers[field] !== null) {
                          completed++;
                        }
                      });

                      // Check optional fields
                      optionalFields.forEach(field => {
                        if (answers[field] !== undefined && answers[field] !== '' && answers[field] !== null) {
                          completed++;
                        }
                      });

                      // Check guarantor fields if hasGuarantor is true
                      if (answers.hasGuarantor) {
                        total += guarantorFields.length;
                        guarantorFields.forEach(field => {
                          if (answers[field] !== undefined && answers[field] !== '' && answers[field] !== null) {
                            completed++;
                          }
                        });
                      }

                      // Check documents
                      const documentFields = ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'];
                      documentFields.forEach(field => {
                        if (documents[field] && documents[field].length > 0) {
                          completed++;
                        }
                      });

                      return Math.round((completed / total) * 100);
                    };
                    const progress = calculateProgress();
                    return progress < 50 ? 'Keep going! Complete more sections to improve your profile.' :
                           progress < 80 ? 'Great progress! Almost there.' :
                           'Excellent! Your profile is nearly complete.';
                  })()}
                </Typography>
              </Paper>
            </Box>

            <Box component="form" onSubmit={handleTenantSubmit}>
              {/* Personal & Household Information */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <SectionHeader
                  title="Personal & Household Information"
                  icon={PersonIcon}
                  description="Tell us about yourself and your household"
                  completed={isPersonalSectionComplete(answers)}
                  style={{ background: 'linear-gradient(180deg, #4a64ad42 0%, #ffffff 100%)' }}
                />

                <Grid container spacing={3} alignItems="flex-end">
                  {/* Occupants */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Household Members *
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <EnhancedTextField
                          label="Adults (18+)"
                          name="adultOccupants"
                          type="number"
                          value={answers.adultOccupants}
                          onChange={handleAnswerChange}
                          inputProps={{ min: 1 }}
                          required
                          error={validationErrors.includes('adultOccupants')}
                          size="small"
                          tooltip="Number of adults (18+) who will be living in the property"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <EnhancedTextField
                          label="Children (<18)"
                          name="childOccupants"
                          type="number"
                          value={answers.childOccupants}
                          onChange={handleAnswerChange}
                          inputProps={{ min: 0 }}
                          required
                          error={validationErrors.includes('childOccupants')}
                          size="small"
                          tooltip="Number of children under 18 who will be living in the property"
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Pets */}
                  <Grid item xs={12} sm={6} md={4}>
                    <EnhancedRadioGroup
                      name="hasPets"
                      value={answers.hasPets}
                      onChange={handleAnswerChange}
                      options={[
                        { value: true, label: 'Yes' },
                        { value: false, label: 'No' }
                      ]}
                      label="Do you have pets? *"
                      required
                      error={validationErrors.includes('hasPets')}
                      columns={2}
                    />
                  </Grid>

                  {/* Smoking */}
                  <Grid item xs={12} sm={6} md={4}>
                    <EnhancedRadioGroup
                      name="smokingStatus"
                      value={answers.smokingStatus}
                      onChange={handleAnswerChange}
                      options={[
                        { value: 'non-smoker', label: 'Non-smoker' },
                        { value: 'smoker', label: 'Smoker' },
                        { value: 'former-smoker', label: 'Former smoker' }
                      ]}
                      label="Smoking Status *"
                      required
                      error={validationErrors.includes('smokingStatus')}
                      columns={1}
                    />
                  </Grid>

                  {/* Marital Status */}
                  <Grid item xs={12} sm={6} md={4}>
                    <EnhancedTextField
                      fullWidth
                      select
                      label="Marital Status"
                      name="maritalStatus"
                      value={answers.maritalStatus}
                      onChange={handleAnswerChange}
                      size="small"
                      tooltip="Your current marital status"
                    >
                      <MenuItem value="" disabled>Select marital status</MenuItem>
                      <MenuItem value="single">Single</MenuItem>
                      <MenuItem value="married">Married</MenuItem>
                      <MenuItem value="divorced">Divorced</MenuItem>
                      <MenuItem value="widowed">Widowed</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </EnhancedTextField>
                  </Grid>

                  {/* Conditional Pet Fields */}
                  <Collapse in={answers.hasPets} timeout="auto" unmountOnExit>
                    <Grid item xs={12}>
                      <Box sx={{ 
                        p: 3, 
                        bgcolor: '#f8f9ff', 
                        borderRadius: 2, 
                        border: '1px solid',
                        borderColor: '#e3e8ff',
                        mt: 2
                      }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#4a64ad', fontWeight: 600 }}>
                          Pet Information
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <EnhancedTextField
                              label="Number of Pets"
                              name="petCount"
                              type="number"
                              value={answers.petCount}
                              onChange={handleAnswerChange}
                              inputProps={{ min: 1 }}
                              required
                              error={validationErrors.includes('petCount')}
                              size="small"
                              tooltip="Total number of pets you have"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <EnhancedTextField
                              label="Pet Types"
                              name="petTypes"
                              value={answers.petTypes}
                              onChange={handleAnswerChange}
                              placeholder="e.g., 2 dogs, 1 cat"
                              required
                              error={validationErrors.includes('petTypes')}
                              size="small"
                              tooltip="Describe your pets (type, breed, size)"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Collapse>
                </Grid>
              </Paper>

              {/* Employment & Income */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <SectionHeader
                  title="Employment & Income"
                  icon={WorkIcon}
                  description="Your employment status and income information"
                  completed={isEmploymentSectionComplete(answers)}
                  style={{ background: 'linear-gradient(180deg, #4a64ad42 0%, #ffffff 100%)' }}
                />

                <Grid container spacing={3} alignItems="flex-end">
                  <Grid item xs={12} md={6}>
                    <EnhancedTextField
                      select
                      label="Employment Status"
                      name="employmentStatus"
                      value={answers.employmentStatus}
                      onChange={handleAnswerChange}
                      placeholder="Select employment status"
                      required
                      error={validationErrors.includes('employmentStatus')}
                      size="small"
                      tooltip="Your current employment status"
                    >
                      <MenuItem value="" disabled>Select employment status</MenuItem>
                      <MenuItem value="employed">Employed</MenuItem>
                      <MenuItem value="self-employed">Self-employed</MenuItem>
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="retired">Retired</MenuItem>
                      <MenuItem value="unemployed">Unemployed</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </EnhancedTextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <EnhancedTextField
                      label="Employer Name"
                      name="employerName"
                      value={answers.employerName}
                      onChange={handleAnswerChange}
                      placeholder="Company name"
                      size="small"
                      tooltip="Name of your current employer or company"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <EnhancedTextField
                      label="Job Title"
                      name="jobTitle"
                      value={answers.jobTitle}
                      onChange={handleAnswerChange}
                      placeholder="Your job title"
                      size="small"
                      tooltip="Your current job title or position"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <EnhancedTextField
                      label="Monthly Net Income"
                      name="monthlyNetIncome"
                      type="number"
                      value={answers.monthlyNetIncome}
                      onChange={handleAnswerChange}
                      inputProps={{ min: 0, step: 0.01 }}
                      required
                      error={validationErrors.includes('monthlyNetIncome')}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      size="small"
                      tooltip="Your monthly take-home pay after taxes and deductions"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <EnhancedTextField
                      label="Monthly Debt Repayment"
                      name="monthlyDebtRepayment"
                      type="number"
                      value={answers.monthlyDebtRepayment}
                      onChange={handleAnswerChange}
                      inputProps={{ min: 0, step: 0.01 }}
                      required
                      error={validationErrors.includes('monthlyDebtRepayment')}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      size="small"
                      tooltip="Total monthly payments for loans, credit cards, etc."
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <EnhancedTextField
                      label="Additional Income Amount"
                      name="additionalIncomeAmount"
                      type="number"
                      value={answers.additionalIncomeAmount}
                      onChange={handleAnswerChange}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      size="small"
                      tooltip="Any additional monthly income (freelance, investments, etc.)"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <EnhancedTextField
                      label="Additional Income Source"
                      name="additionalIncomeSource"
                      value={answers.additionalIncomeSource}
                      onChange={handleAnswerChange}
                      placeholder="e.g., freelance, investments"
                      size="small"
                      tooltip="Description of your additional income source"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <EnhancedTextField
                      label="Child Support Amount"
                      name="childSupportAmount"
                      type="number"
                      value={answers.childSupportAmount}
                      onChange={handleAnswerChange}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      size="small"
                      tooltip="Monthly child support payments you receive or pay"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Financial & Credit */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <SectionHeader
                  title="Financial & Credit Information"
                  icon={AccountBalanceIcon}
                  description="Your credit history and financial background"
                  completed={isFinancialSectionComplete(answers)}
                  style={{ background: 'linear-gradient(180deg, #4a64ad42 0%, #ffffff 100%)' }}
                />

                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <EnhancedTextField
                      label="Credit Score (Optional)"
                      name="creditScore"
                      type="number"
                      value={answers.creditScore}
                      onChange={handleAnswerChange}
                      inputProps={{ min: 300, max: 850 }}
                      placeholder="e.g., 750"
                      size="small"
                      tooltip="Your credit score (range: 300-850)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => window.open('https://www.creditkarma.com/', '_blank')}
                          startIcon={<CloudUploadIcon />}
                          sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600
                          }}
                        >
                          Get Free Credit Score
                        </Button>
                        <Tooltip title="Free from Credit Karma, AnnualCreditReport.com, or your bank" arrow>
                          <InfoOutlinedIcon sx={{ color: 'action.active', cursor: 'help' }} />
                        </Tooltip>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <EnhancedRadioGroup
                      name="bankruptcyHistory"
                      value={answers.bankruptcyHistory}
                      onChange={handleAnswerChange}
                      options={[
                        { value: true, label: 'Yes' },
                        { value: false, label: 'No' }
                      ]}
                      label="Bankruptcy History"
                      columns={2}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <EnhancedRadioGroup
                      name="evictionHistory"
                      value={answers.evictionHistory}
                      onChange={handleAnswerChange}
                      options={[
                        { value: true, label: 'Yes' },
                        { value: false, label: 'No' }
                      ]}
                      label="Eviction History"
                      columns={2}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Rental History */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <SectionHeader
                  title="Rental History"
                  icon={HomeIcon}
                  description="Your current and previous rental information"
                  completed={isRentalSectionComplete(answers)}
                  style={{ background: 'linear-gradient(180deg, #4a64ad42 0%, #ffffff 100%)' }}
                />

                <Grid container spacing={3} alignItems="flex-end">
                  <Grid item xs={12} md={6}>
                    <EnhancedRadioGroup
                      name="currentlyPaysRent"
                      value={answers.currentlyPaysRent}
                      onChange={handleAnswerChange}
                      options={[
                        { value: "true", label: 'Yes' },
                        { value: "false", label: 'No' }
                      ]}
                      label="Currently Paying Rent?"
                      required
                      error={validationErrors.includes('currentlyPaysRent')}
                      columns={2}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <EnhancedTextField
                      label="Current Monthly Rent"
                      name="currentRentAmount"
                      type="number"
                      value={answers.currentRentAmount}
                      onChange={handleAnswerChange}
                      inputProps={{ min: 0, step: 0.01 }}
                      required
                      error={validationErrors.includes('currentRentAmount')}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      size="small"
                      tooltip="Your current monthly rent amount"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Application Strengthening */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <SectionHeader
                  title="Boost Your Application"
                  icon={SchoolIcon}
                  description="Additional information to strengthen your application"
                  completed={isStrengthenSectionComplete(answers)}
                  style={{ background: 'linear-gradient(180deg, #4a64ad42 0%, #ffffff 100%)' }}
                />

                <Grid container spacing={3} alignItems="flex-end">
                  <Grid item xs={12} md={6}>
                    <EnhancedRadioGroup
                      name="canPayAdvance"
                      value={answers.canPayAdvance}
                      onChange={handleAnswerChange}
                      options={[
                        { value: true, label: 'Yes' },
                        { value: false, label: 'No' }
                      ]}
                      label="Can pay multiple months upfront"
                      columns={2}
                    />
                  </Grid>

                  <Collapse in={answers.canPayAdvance} timeout="auto" unmountOnExit>
                    <Grid item xs={12} md={6}>
                      <EnhancedTextField
                        label="Months Ahead Can Pay"
                        name="monthsAheadCanPay"
                        type="number"
                        value={answers.monthsAheadCanPay}
                        onChange={handleAnswerChange}
                        inputProps={{ min: 1 }}
                        size="small"
                        tooltip="How many months of rent you can pay in advance"
                      />
                    </Grid>
                  </Collapse>

                  <Grid item xs={12} md={6}>
                    <EnhancedRadioGroup
                      name="hasGuarantor"
                      value={answers.hasGuarantor}
                      onChange={handleAnswerChange}
                      options={[
                        { value: true, label: 'Yes' },
                        { value: false, label: 'No' }
                      ]}
                      label="Do you have a lease guarantor?"
                      columns={2}
                    />
                  </Grid>
                </Grid>

                {/* Guarantor Information - Only show if hasGuarantor is true */}
                <Collapse in={answers.hasGuarantor} timeout="auto" unmountOnExit>
                  <Box sx={{ 
                    mt: 4, 
                    p: 3, 
                    bgcolor: '#f8f9ff', 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: '#e3e8ff'
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#4a64ad', mb: 3 }}>
                      Guarantor Information
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <EnhancedTextField
                          label="Guarantor Full Name"
                          name="guarantorName"
                          value={answers.guarantorName}
                          onChange={handleAnswerChange}
                          required
                          size="small"
                          tooltip="Full legal name of your guarantor"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <EnhancedTextField
                          label="Relationship to You"
                          name="guarantorRelationship"
                          value={answers.guarantorRelationship}
                          onChange={handleAnswerChange}
                          placeholder="e.g., Parent, Spouse, Friend"
                          required
                          size="small"
                          tooltip="Your relationship to the guarantor"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <EnhancedTextField
                          label="Phone Number"
                          name="guarantorPhone"
                          value={answers.guarantorPhone}
                          onChange={handleAnswerChange}
                          required
                          size="small"
                          tooltip="Guarantor's phone number"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <EnhancedTextField
                          label="Email Address"
                          name="guarantorEmail"
                          type="email"
                          value={answers.guarantorEmail}
                          onChange={handleAnswerChange}
                          required
                          size="small"
                          tooltip="Guarantor's email address"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EnhancedTextField
                          label="Full Address"
                          name="guarantorAddress"
                          value={answers.guarantorAddress}
                          onChange={handleAnswerChange}
                          multiline
                          required
                          size="small"
                          tooltip="Guarantor's complete address"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <EnhancedTextField
                          label="Monthly Income"
                          name="guarantorMonthlyIncome"
                          type="number"
                          value={answers.guarantorMonthlyIncome}
                          onChange={handleAnswerChange}
                          inputProps={{ min: 0, step: 0.01 }}
                          required
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                          size="small"
                          tooltip="Guarantor's monthly income"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <EnhancedTextField
                          label="Employer/Company"
                          name="guarantorEmployer"
                          value={answers.guarantorEmployer}
                          onChange={handleAnswerChange}
                          required
                          size="small"
                          tooltip="Guarantor's employer or company name"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <EnhancedTextField
                          label="Job Title"
                          name="guarantorJobTitle"
                          value={answers.guarantorJobTitle}
                          onChange={handleAnswerChange}
                          required
                          size="small"
                          tooltip="Guarantor's job title or position"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </Paper>

              {/* Documents */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <SectionHeader
                  title="Supporting Documents"
                  icon={DescriptionIcon}
                  description="Upload documents to support your application"
                  completed={isDocumentsSectionComplete(documents)}
                  style={{ background: 'linear-gradient(180deg, #4a64ad42 0%, #ffffff 100%)' }}
                />

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Upload documents to support your application. Required documents help landlords make faster decisions.
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <DocumentUpload
                      field="proofOfIdentity"
                      documents={documents.proofOfIdentity}
                      onDrop={handleDocumentDrop('proofOfIdentity')}
                      onDelete={(field, index) => handleDeleteDocument(field, documents.proofOfIdentity[index]._id)}
                      maxFiles={5}
                      required={true}
                      error={validationErrors.includes('proofOfIdentity')}
                      isLoading={documentUploading.proofOfIdentity}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DocumentUpload
                      field="proofOfIncome"
                      documents={documents.proofOfIncome}
                      onDrop={handleDocumentDrop('proofOfIncome')}
                      onDelete={(field, index) => handleDeleteDocument(field, documents.proofOfIncome[index]._id)}
                      maxFiles={5}
                      required={true}
                      error={validationErrors.includes('proofOfIncome')}
                      isLoading={documentUploading.proofOfIncome}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DocumentUpload
                      field="creditHistory"
                      documents={documents.creditHistory}
                      onDrop={handleDocumentDrop('creditHistory')}
                      onDelete={(field, index) => handleDeleteDocument(field, documents.creditHistory[index]._id)}
                      maxFiles={5}
                      required={false}
                      isLoading={documentUploading.creditHistory}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DocumentUpload
                      field="rentalHistory"
                      documents={documents.rentalHistory}
                      onDrop={handleDocumentDrop('rentalHistory')}
                      onDelete={(field, index) => handleDeleteDocument(field, documents.rentalHistory[index]._id)}
                      maxFiles={5}
                      required={false}
                      isLoading={documentUploading.rentalHistory}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <DocumentUpload
                      field="additionalDocuments"
                      documents={documents.additionalDocuments}
                      onDrop={handleDocumentDrop('additionalDocuments')}
                      onDelete={(field, index) => handleDeleteDocument(field, documents.additionalDocuments[index]._id)}
                      maxFiles={5}
                      required={false}
                      isLoading={documentUploading.additionalDocuments}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Submit Button */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                pt: 4,
                pb: 2
              }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    minWidth: 300,
                    py: 2,
                    px: 6,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    backgroundColor: '#4a64ad',
                    boxShadow: '0 2px 8px rgba(74, 100, 173, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#3d5a9e',
                      boxShadow: '0 4px 12px rgba(74, 100, 173, 0.4)'
                    },
                    '&:disabled': {
                      backgroundColor: '#9ca3af',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      Updating Profile...
                    </Box>
                  ) : (
                    'Save & Complete Profile'
                  )}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
      </Paper>
    </Box>
  );
} 