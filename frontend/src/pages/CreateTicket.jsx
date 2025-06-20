import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Alert,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  Input,
  IconButton
} from '@mui/material';
import { 
  Home as HomeIcon,
  Build as BuildIcon,
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

export default function CreateTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (images.length + acceptedFiles.length > 5) {
      toast.error('You can upload a maximum of 5 images.');
      return;
    }
    const newImages = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setImages(prevImages => [...prevImages, ...newImages]);
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*',
    maxFiles: 5,
  });

  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTenantProperty();
    // Clean up previews on unmount
    return () => images.forEach(file => URL.revokeObjectURL(file.preview));
  }, [user]);

  const fetchTenantProperty = async () => {
    try {
      const token = localStorage.getItem('token');
      // First get the approved application
      const applicationsResponse = await axios.get(API_ENDPOINTS.APPLICATIONS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Applications response:', applicationsResponse.data);
      
      const approvedApplication = applicationsResponse.data.find(app => app.status === 'approved');
      
      console.log('Approved application:', approvedApplication);
      
      if (!approvedApplication) {
        setError('No approved application found. You must have an approved application to create a ticket.');
        return;
      }

      // Then verify the property's tenant status
      const propertyResponse = await axios.get(`${API_ENDPOINTS.PROPERTIES}/${approvedApplication.property._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Property response:', propertyResponse.data);
      console.log('Current user:', user);

      const propertyData = propertyResponse.data;
      
      // Check if the property has a tenant and if it matches the current user
      if (!propertyData.tenant || propertyData.tenant._id !== user._id) {
        // Fallback: allow if approved application exists and matches user
        if (
          approvedApplication &&
          approvedApplication.status === 'approved' &&
          (
            (typeof approvedApplication.tenant === 'object' && approvedApplication.tenant._id === user._id) ||
            (typeof approvedApplication.tenant === 'string' && approvedApplication.tenant === user._id)
          )
        ) {
          console.log('Allowing ticket creation based on approved application fallback');
          setProperty(propertyData);
          return;
        }
        setError('You are not the current tenant of this property. Please contact the landlord.');
        return;
      }
      
      setProperty(propertyData);
    } catch (error) {
      console.error('Error in fetchTenantProperty:', error);
      setError('Failed to load your property');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!property || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('propertyId', property._id);
      formData.append('description', description.trim());
      images.forEach(image => {
        formData.append('images', image);
      });

      await axios.post(
        API_ENDPOINTS.TICKETS,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      toast.success('Ticket created successfully');
      navigate('/my-tickets');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

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
            <BuildIcon sx={{ fontSize: 32 }} />
            Create Repair Ticket
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Submit a maintenance request for your property
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mx: 'auto', width: '100%' }}>
          <Grid container spacing={3} sx={{ width: '100%' }}>
            {/* Right Column: Ticket Description */}
            <Grid item xs={12} md={7} sx={{ width: '100%' }}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DescriptionIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" color="primary">
                    Issue Description
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Describe the repair or maintenance issue"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide a detailed description of the issue..."
                  required
                />

                {/* Image Upload Section */}
                <Box mt={3}>
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                    Upload Images (up to 5)
                  </Typography>
                  <Paper
                    {...getRootProps()}
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderStyle: 'dashed',
                      borderColor: isDragActive ? 'primary.main' : 'grey.400',
                      backgroundColor: isDragActive ? 'action.hover' : 'transparent'
                    }}
                  >
                    <input {...getInputProps()} />
                    <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Typography>
                      {isDragActive ? 'Drop the images here...' : 'Drag & drop images here, or click to select'}
                    </Typography>
                  </Paper>
                </Box>

                {/* Image Previews */}
                {images.length > 0 && (
                  <Box mt={2} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {images.map((file, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={file.preview}
                          alt={`preview ${index}`}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)'}
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Error Display */}
                {error && (
                  <Alert severity="error" onClose={() => setError('')} sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 'auto', pt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/my-tickets')}
                    sx={{ minWidth: 120 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || !property}
                    startIcon={<BuildIcon />}
                    sx={{ minWidth: 200 }}
                  >
                    {loading ? 'Creating...' : 'Create Ticket'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
} 