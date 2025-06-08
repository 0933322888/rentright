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
  IconButton
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Basic Information Section */}
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
          {/* Row: Title, Property Type, Price, Available From */}
          <Grid container spacing={3} alignItems="center" wrap="nowrap">
            <Grid item sx={{ flex: 1 }}>
              <TextField
                required
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item sx={{ minWidth: 250 }}>
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
            <Grid item sx={{ minWidth: 250 }}>
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
            </Grid>
            <Grid item sx={{ minWidth: 250 }}>
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
          {/* Description field - full width */}
          <Box sx={{ mx: 'auto', mt: 6 }}>
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
              sx={{
                backgroundColor: 'rgba(0,0,0,0.03)',
                borderRadius: 2
              }}
            />
          </Box>
        </Paper>

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
            <Grid item xs={12}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12}>
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

        {/* Images Section */}
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
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload high-quality images of your property. You can upload up to 10 images.
            </Typography>
            
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
                    src={typeof image === 'string' ? image : URL.createObjectURL(image)}
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