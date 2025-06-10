import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import PropertyForm from '../components/PropertyForm';
import DocumentUpload from '../components/DocumentUpload';
import PropertySubmissionModal from '../components/PropertySubmissionModal';
import { 
  Box, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Alert,
  Container,
  Divider,
  useTheme,
  useMediaQuery,
  Button,
  Grid,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadIcon from '@mui/icons-material/Upload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddHomeIcon from '@mui/icons-material/AddHome';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';

const steps = [
  { label: 'Basic Information', icon: <HomeIcon /> },
  { label: 'Required Documents', icon: <DescriptionIcon /> }
];

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

const AddProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [documents, setDocuments] = useState({
    proofOfOwnership: [],
    governmentId: [],
    condoBoardRules: [],
    utilityBills: []
  });
  const [propertyData, setPropertyData] = useState({});

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

  const handleFileChange = (event, field) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setDocuments(prev => ({
        ...prev,
        [field]: [...(Array.isArray(prev[field]) ? prev[field] : []), ...files]
      }));
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePropertySubmit = (propertyData) => {
    setPropertyData(propertyData);
    handleNext();
  };

  const handleFinalSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Append property data
      Object.entries(propertyData).forEach(([key, value]) => {
        if (key === 'location') {
          // Handle location fields individually
          Object.entries(value).forEach(([locKey, locValue]) => {
            formData.append(`location[${locKey}]`, locValue);
          });
        } else if (key === 'features') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'availableFrom') {
          formData.append(key, value.toISOString());
        } else if (key !== 'images') {
          formData.append(key, value);
        }
      });

      // Set review to 'submitted' for new properties
      formData.append('status', 'review');

      // Append images
      if (propertyData.images) {
        propertyData.images.forEach((image, index) => {
          if (image instanceof File) {
            formData.append('images', image);
          }
        });
      }

      // Append documents
      Object.entries(documents).forEach(([field, files]) => {
        files.forEach(file => {
          formData.append(field, file);
        });
      });

      // Create property with all data in one request
      const response = await axios.post(API_ENDPOINTS.PROPERTIES, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating property:', error);
      setError(error.response?.data?.message || 'Error creating property');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate('/my-properties');
  };

  if (!user || user.role !== 'landlord') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Only landlords can add properties.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      py: 4,
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
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <AddHomeIcon sx={{ fontSize: 32 }} />
            Add New Property
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Create a new property listing by filling out the form below
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Basic Information</StepLabel>
          </Step>
          <Step>
            <StepLabel>Required Documents</StepLabel>
          </Step>
        </Stepper>

        {activeStep === 0 ? (
          <PropertyForm 
            onSubmit={handlePropertySubmit} 
            loading={loading}
            isFirstStep={true}
            initialData={propertyData}
            onCancel={() => navigate('/my-properties')}
          />
        ) : (
          <Box component="form" onSubmit={handleFinalSubmit}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 4,
                bgcolor: 'background.default',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DescriptionIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6" color="primary">
                  Required Documents
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please upload the following required documents to verify your property ownership and identity.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3,
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      bgcolor: 'background.paper',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Proof of Ownership
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Upload property deed, title, or ownership certificate
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        sx={{ minWidth: 200 }}
                      >
                        Upload Document
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'proofOfOwnership')}
                        />
                      </Button>
                      {documents.proofOfOwnership.length > 0 && (
                        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                          {documents.proofOfOwnership.map((file, index) => (
                            <DocumentPreview
                              key={`${file.name}-${index}`}
                              file={file}
                              onDelete={() => handleDeleteDocument('proofOfOwnership', index)}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3,
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      bgcolor: 'background.paper',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Government-Issued ID
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Upload a valid government-issued identification document
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        sx={{ minWidth: 200 }}
                      >
                        Upload Document
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'governmentId')}
                        />
                      </Button>
                      {documents.governmentId.length > 0 && (
                        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                          {documents.governmentId.map((file, index) => (
                            <DocumentPreview
                              key={`${file.name}-${index}`}
                              file={file}
                              onDelete={() => handleDeleteDocument('governmentId', index)}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3,
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      bgcolor: 'background.paper',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Utility Bill (Optional)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Upload a recent utility bill for additional verification
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        sx={{ minWidth: 200 }}
                      >
                        Upload Document
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'utilityBills')}
                        />
                      </Button>
                      {documents.utilityBills.length > 0 && (
                        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                          {documents.utilityBills.map((file, index) => (
                            <DocumentPreview
                              key={`${file.name}-${index}`}
                              file={file}
                              onDelete={() => handleDeleteDocument('utilityBills', index)}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/my-properties')}
                sx={{ minWidth: 120 }}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                sx={{ minWidth: 120 }}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={<SaveIcon />}
                sx={{ minWidth: 200 }}
              >
                {loading ? 'Saving...' : 'Save Property'}
              </Button>
            </Box>
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mt: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
      </Paper>

      <PropertySubmissionModal 
        show={showSuccessModal} 
        onHide={handleModalClose}
      />
    </Box>
  );
};

export default AddProperty; 