import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Grid, 
  MenuItem, 
  FormControlLabel, 
  Switch, 
  Box,
  Paper,
  Typography,
  Divider,
  useTheme,
  IconButton,
  CircularProgress,
  Tooltip,
  Alert,
  Collapse
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoIcon from '@mui/icons-material/Info';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LivingIcon from '@mui/icons-material/Living';
import KitchenIcon from '@mui/icons-material/Kitchen';
import BedIcon from '@mui/icons-material/Bed';
import BathroomIcon from '@mui/icons-material/Bathroom';
import StarIcon from '@mui/icons-material/Star';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import HighlightIcon from '@mui/icons-material/Highlight';
import StraightenIcon from '@mui/icons-material/Straighten';
import { API_ENDPOINTS } from '../config/api';
import { getImageUrl } from '../utils/imageUtils';
import axios from 'axios';

const PropertyForm = ({ onSubmit, loading, initialData = {}, isFirstStep = true, onCancel }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    type: initialData.type || 'apartment',
    price: initialData.price || '',
    availableFrom: initialData.availableFrom ? new Date(initialData.availableFrom) : new Date(),
    location: {
      street: initialData.location?.street || '',
      city: initialData.location?.city || '',
      state: initialData.location?.state || '',
      zipCode: initialData.location?.zipCode || ''
    },
    features: {
      bedrooms: initialData.features?.bedrooms || '',
      bathrooms: initialData.features?.bathrooms || '',
      squareFootage: initialData.features?.squareFootage || '',
      furnished: initialData.features?.furnished || false,
      parking: initialData.features?.parking || false,
      petsAllowed: initialData.features?.petsAllowed || false
    },
    images: initialData.images || []
  });
  const [generating, setGenerating] = useState(false);
  const [generatingPrice, setGeneratingPrice] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  const [priceError, setPriceError] = useState('');
  const [showPhotoTips, setShowPhotoTips] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      availableFrom: date
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const handleDeleteImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateListing = async () => {
    setGenerating(true);
    try {
      // Prepare the data for AI generation
      const propertyInfo = {
        type: formData.type,
        price: formData.price,
        location: formData.location,
        features: formData.features,
        availableFrom: formData.availableFrom
      };

      const response = await fetch(`${API_ENDPOINTS.PROPERTIES}/generate-listing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(propertyInfo),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate listing');
      }

      const { title, description } = await response.json();
      
      setFormData(prev => ({
        ...prev,
        title,
        description
      }));
    } catch (error) {
      console.error('Error generating listing:', error);
      // TODO: Add proper error notification
      alert(error.message || 'Failed to generate listing. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePrice = async () => {
    // Validate required fields for price generation
    if (!formData.type) {
      setPriceError('Property type is required for price calculation');
      return;
    }
    if (!formData.location.city || !formData.location.state) {
      setPriceError('City and state are required for price calculation');
      return;
    }
    if (!formData.features.bedrooms || !formData.features.bathrooms) {
      setPriceError('Bedrooms and bathrooms are required for price calculation');
      return;
    }

    setGeneratingPrice(true);
    setPriceError('');
    setPriceSuggestion(null);

    try {
      const response = await fetch(API_ENDPOINTS.GENERATE_PROPERTY_PRICE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          propertyInfo: {
            type: formData.type,
            features: formData.features
          },
          location: formData.location,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate price suggestion');
      }

      const suggestion = await response.json();
      setPriceSuggestion(suggestion);
      
      // Auto-fill the price field with the suggested price
      setFormData(prev => ({
        ...prev,
        price: suggestion.suggestedPrice
      }));
    } catch (error) {
      console.error('Error generating price suggestion:', error);
      setPriceError(error.message || 'Failed to generate price suggestion. Please try again.');
    } finally {
      setGeneratingPrice(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Separate existing image URLs and new files
    const existingImages = formData.images.filter(img => typeof img === 'string');
    const newImageFiles = formData.images.filter(img => img instanceof File);
    let uploadedImageUrls = [];

    if (newImageFiles.length > 0) {
      const uploadFormData = new FormData();
      newImageFiles.forEach(file => uploadFormData.append('images', file));
      try {
        const token = localStorage.getItem('token');
        const uploadRes = await axios.post(
          API_ENDPOINTS.IMAGES,
          uploadFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        uploadedImageUrls = (uploadRes.data.images || []).map(img => `/uploads/${img}`);
      } catch (err) {
        alert('Failed to upload images.');
        return;
      }
    }

    // Prepare the final data to submit
    const submitData = {
      ...formData,
      images: [...existingImages, ...uploadedImageUrls],
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Property Images Section - Now First */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            bgcolor: 'background.default',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <ImageIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
            <Typography variant="h6" color="primary">
              Property Images
            </Typography>
            <Tooltip title="Photography Tips">
              <IconButton
                onClick={() => setShowPhotoTips(!showPhotoTips)}
                size="large"
                sx={{
                  color: '#2a7a78',
                  ml: 1,
                  '&:hover': {
                    bgcolor: '#b1f0ee'
                  }
                }}
              >
                <TipsAndUpdatesIcon sx={{ fontSize: 28 }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload high-quality images of your property. You can upload up to 10 images.
            </Typography>
            
            {/* Photography Guide */}
            <Collapse in={showPhotoTips}>
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                bgcolor: 'primary.50', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'primary.200'
              }}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
                  📸 Photography Tips for Better Listings
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'text.primary' }}>
                      Essential Shots:
                    </Typography>
                    <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <HomeOutlinedIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Front exterior of the property</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LivingIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Living room from multiple angles</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <KitchenIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Kitchen (clean and well-lit)</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <BedIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Master bedroom</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <BathroomIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Bathroom (clean and staged)</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StarIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Any unique features or amenities</span>
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'text.primary' }}>
                      Photography Best Practices:
                    </Typography>
                    <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <WbSunnyIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Use natural lighting when possible</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CleaningServicesIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Clean and declutter before shooting</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ViewInArIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Take photos from corner angles for depth</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LightbulbIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Ensure good lighting in all rooms</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <HighlightIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Show the best features prominently</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StraightenIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <span>Keep photos straight and level</span>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Collapse>
            
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 2,
                mb: 2
              }}
            >
              {formData.images.map((image, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'relative',
                    paddingTop: '75%',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <img
                    src={typeof image === 'string' 
                      ? getImageUrl(image)
                      : URL.createObjectURL(image)}
                    alt={`Property image ${index + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteImage(index)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              
              {formData.images.length < 10 && (
                <Box
                  component="label"
                  sx={{
                    position: 'relative',
                    paddingTop: '75%',
                    borderRadius: 1,
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Upload Images
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Basic Information Section - Removed Title and Description */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            bgcolor: 'background.default',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <HomeIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
            <Typography variant="h6" color="primary">
              Basic Information
            </Typography>
          </Box>
          {/* Row: Property Type, Price, Available From */}
          <Grid container spacing={3} alignItems="center" wrap="nowrap">
            <Grid sx={{ minWidth: 250 }}>
              <TextField
                required
                fullWidth
                select
                label="Property Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                variant="outlined"
                size="medium"
              >
                <MenuItem value="apartment">Apartment</MenuItem>
                <MenuItem value="house">House</MenuItem>
                <MenuItem value="condo">Condo</MenuItem>
                <MenuItem value="townhouse">Townhouse</MenuItem>
                <MenuItem value="commercial">Commercial</MenuItem>
              </TextField>
            </Grid>
            <Grid sx={{ minWidth: 250 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Price per month"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <span>$</span>
                    }}
                  />
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleGeneratePrice}
                    disabled={generatingPrice || loading}
                    startIcon={generatingPrice ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                    sx={{ 
                      minWidth: 180, 
                      height: 56,
                      background: 'linear-gradient(135deg, #ffffff 0%, #b1f0ee 100%)',
                      border: '1px solid #b1f0ee',
                      color: '#2a7a78',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #f8f8f8 0%, #9ee8e6 100%)',
                        border: '1px solid #9ee8e6',
                        color: '#1f5a58'
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, #f5f5f5 0%, #D3D3D3 100%)',
                        border: '1px solid #D3D3D3',
                        color: '#A0A0A0'
                      }
                    }}
                  >
                    {generatingPrice ? 'Generating...' : 'Get AI Price'}
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid sx={{ minWidth: 250 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Available From"
                  value={formData.availableFrom}
                  onChange={handleDateChange}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      required: true,
                      variant: "outlined",
                      size: "medium"
                    } 
                  }}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </Paper>

        {/* Price Suggestion Info Section */}
        {(priceError || priceSuggestion) && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: 'background.default',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            {priceError && (
              <Alert severity="error" sx={{ mb: priceSuggestion ? 2 : 0 }}>
                {priceError}
              </Alert>
            )}
            {priceSuggestion && priceSuggestion.suggestedPrice && (
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
                  AI Price Suggestion
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Suggested Price: <strong>${priceSuggestion.suggestedPrice.toLocaleString()}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Based on the provided property information, the suggested price range is ${priceSuggestion.priceRange?.min.toLocaleString()} - ${priceSuggestion.priceRange?.max.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Comment: {priceSuggestion.comment} {priceSuggestion.justification}
                  </Typography>
                </Alert>
              </Box>
            )}
          </Paper>
        )}

        {/* Location Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            bgcolor: 'background.default',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <LocationOnIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
            <Typography variant="h6" color="primary">
              Location Information
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid xs={12}>
              <TextField
                required
                fullWidth
                label="Street Address"
                name="location.street"
                value={formData.location.street}
                onChange={handleChange}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <TextField
                required
                fullWidth
                label="City"
                name="location.city"
                value={formData.location.city}
                onChange={handleChange}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <TextField
                required
                fullWidth
                label="State"
                name="location.state"
                value={formData.location.state}
                onChange={handleChange}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                name="location.zipCode"
                value={formData.location.zipCode}
                onChange={handleChange}
                variant="outlined"
                size="medium"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Features Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            bgcolor: 'background.default',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <InfoIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
            <Typography variant="h6" color="primary">
              Property Features
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid xs={12} sm={4}>
              <TextField
                required
                fullWidth
                type="number"
                label="Bedrooms"
                name="features.bedrooms"
                value={formData.features.bedrooms}
                onChange={handleChange}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <TextField
                required
                fullWidth
                type="number"
                label="Bathrooms"
                name="features.bathrooms"
                value={formData.features.bathrooms}
                onChange={handleChange}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <TextField
                required
                fullWidth
                type="number"
                label="Square Footage"
                name="features.squareFootage"
                value={formData.features.squareFootage}
                onChange={handleChange}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid xs={12}>
              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                flexWrap: 'wrap',
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.features.furnished}
                      onChange={handleSwitchChange}
                      name="features.furnished"
                      color="primary"
                    />
                  }
                  label="Furnished"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.features.parking}
                      onChange={handleSwitchChange}
                      name="features.parking"
                      color="primary"
                    />
                  }
                  label="Parking Available"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.features.petsAllowed}
                      onChange={handleSwitchChange}
                      name="features.petsAllowed"
                      color="primary"
                    />
                  }
                  label="Pets Allowed"
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Title and Description Section - New Section at the End */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            bgcolor: 'background.default',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6" color="primary">
                Listing Details
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
              onClick={handleGenerateListing}
              disabled={generating || loading}
              sx={{ 
                minWidth: 150,
                background: 'linear-gradient(135deg, #ffffff 0%, #b1f0ee 100%)',
                border: '1px solid #b1f0ee',
                color: '#2a7a78',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f8f8f8 0%, #9ee8e6 100%)',
                  border: '1px solid #9ee8e6',
                  color: '#1f5a58'
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #D3D3D3 100%)',
                  border: '1px solid #D3D3D3',
                  color: '#A0A0A0'
                }
              }}
            >
              {generating ? 'Generating...' : 'Generate with AI'}
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              required
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              variant="outlined"
              size="medium"
              placeholder="Enter a compelling title for your property listing"
              disabled={generating}
            />
            <Box sx={{ mx: 'auto', width: '100%' }}>
              <TextField
                required
                fullWidth
                multiline
                rows={6}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                size="medium"
                placeholder="Describe your property in detail. You can use AI to generate this text later."
                disabled={generating}
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  borderRadius: 2
                }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Next Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {isFirstStep && onCancel && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={onCancel}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            endIcon={isFirstStep ? <ArrowForwardIcon /> : null}
            sx={{ 
              minWidth: 200,
              py: 1.5
            }}
          >
            {loading ? 'Saving...' : isFirstStep ? 'Next' : 'Save Property'}
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default PropertyForm; 