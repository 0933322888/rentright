import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ShareIcon from '@mui/icons-material/Share';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

// Base64 encoded SVG for fallback image
const FALLBACK_IMAGE_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

export default function PropertyOverview({ 
  property, 
  onDelete, 
  onSubmit,
  clickedButton,
  setClickedButton 
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
    );
  };

  const handleImageError = (docId, e) => {
    if (!failedImages.has(docId)) {
      setFailedImages(prev => new Set([...prev, docId]));
      e.target.src = FALLBACK_IMAGE_DATA_URL;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rented':
        return 'info';
      default:
        return 'default';
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
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          m: 0,
          width: '100%'
        }}
      >
        <Box sx={{ display: 'flex', gap: 4, height: '100%', overflow: 'hidden', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {/* Left side - Image */}
          <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '480px' }, maxWidth: '480px', minWidth: 0 }}>
            <Paper 
              elevation={0}
              sx={{ 
                height: '100%',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderRadius: 2,
                overflow: 'hidden',
                mb: { xs: 3, md: 0 }
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="400"
                  image={property.images && 
                        property.images.length > 0 && 
                        property.images[currentImageIndex] ? 
                    (typeof property.images[currentImageIndex] === 'string' && 
                     property.images[currentImageIndex].startsWith('http') 
                      ? property.images[currentImageIndex] 
                      : getImageUrl(property.images[currentImageIndex]))
                    : FALLBACK_IMAGE_DATA_URL}
                  alt={property.title}
                  sx={{
                    position: 'relative',
                    borderRadius: 2,
                    height: { xs: '300px', sm: '400px', md: '400px' } + ' !important',
                    width: '100% !important',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                  onError={(e) => handleImageError(property.images[currentImageIndex], e)}
                />
                {property.images && property.images.length > 1 && (
                  <>
                    <IconButton
                      onClick={handlePrevImage}
                      sx={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 1)',
                        },
                        zIndex: 1
                      }}
                    >
                      <NavigateBeforeIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleNextImage}
                      sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 1)',
                        },
                        zIndex: 1
                      }}
                    >
                      <NavigateNextIcon />
                    </IconButton>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 1,
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        zIndex: 1
                      }}
                    >
                      {property.images.map((_, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: index === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Right side - Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            {/* Header with title and status */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, lineHeight: 1.1 }}>
                {property.title}
              </Typography>
              <Chip
                label={property.status}
                color={getStatusColor(property.status)}
                size="medium"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(76,110,245,0.18)',
                  textTransform: 'capitalize',
                  letterSpacing: 0.5,
                  backgroundColor: (theme) => theme.palette.info.main,
                  color: 'white',
                  ...(property.status === 'rented' && {
                    backgroundColor: (theme) => theme.palette.success.light,
                  })
                }}
              />
            </Box>

            {/* Price, Location, Availability */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
              <Chip
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                label={`$${property.price}/month`}
                variant="outlined"
                size="medium"
                sx={{ fontWeight: 600, borderColor: '#4a64ad', color: '#4a64ad', background: 'white', borderRadius: 1 }}
              />
              <Chip
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                label={`${property.location.city}, ${property.location.state}`}
                variant="outlined"
                size="medium"
                sx={{ fontWeight: 600, borderColor: '#4a64ad', color: '#4a64ad', background: 'white', borderRadius: 1 }}
              />
              {property.availableFrom && (
                <Chip
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  label={`Available: ${new Date(property.availableFrom).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                  variant="outlined"
                  size="medium"
                  sx={{ fontWeight: 600, borderColor: '#4a64ad', color: '#4a64ad', background: 'white', borderRadius: 1 }}
                />
              )}
            </Box>

            {/* Address */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                {property.location.street && `${property.location.street}, `}
                {property.location.city && `${property.location.city}, `}
                {property.location.state && `${property.location.state} `}
                {property.location.zipCode && property.location.zipCode}
              </Typography>
            </Box>

            {/* Property Status and Availability */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
              <Chip
                label={property.available ? 'Available Now' : 'Not Available'}
                color={property.available ? 'success' : 'default'}
                variant="filled"
                size="small"
                sx={{ fontWeight: 600, borderRadius: 1, background: property.available ? undefined : '#f5f5f5', color: property.available ? undefined : '#888' }}
              />
              {property.available && property.availableFrom && (
                <Typography variant="body2" color="text.secondary">
                  Available from {new Date(property.availableFrom).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </Typography>
              )}
            </Box>

            {/* Description */}
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.08rem', lineHeight: 1.7, mb: 2, pl: 0.5 }}>
              {property.description}
            </Typography>

            {/* Property Features */}
            {property.features && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                {property.features.bedrooms && (
                  <Chip
                    label={`${property.features.bedrooms} Bedrooms`}
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: '#4a64ad', color: '#4a64ad', borderRadius: 1, fontWeight: 500, background: 'white' }}
                  />
                )}
                {property.features.bathrooms && (
                  <Chip
                    label={`${property.features.bathrooms} Bathrooms`}
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: '#4a64ad', color: '#4a64ad', borderRadius: 1, fontWeight: 500, background: 'white' }}
                  />
                )}
                {property.features.squareFootage && (
                  <Chip
                    label={`${property.features.squareFootage} sq ft`}
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: '#4a64ad', color: '#4a64ad', borderRadius: 1, fontWeight: 500, background: 'white' }}
                  />
                )}
                {property.features.furnished && (
                  <Chip
                    label="Furnished"
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: '#4a64ad', color: '#4a64ad', borderRadius: 1, fontWeight: 500, background: 'white' }}
                  />
                )}
                {property.features.parking && (
                  <Chip
                    label="Parking"
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: '#4a64ad', color: '#4a64ad', borderRadius: 1, fontWeight: 500, background: 'white' }}
                  />
                )}
                {property.features.petsAllowed && (
                  <Chip
                    label="Pet Friendly"
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: '#4a64ad', color: '#4a64ad', borderRadius: 1, fontWeight: 500, background: 'white' }}
                  />
                )}
              </Box>
            )}

            {/* Action Buttons - right aligned */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ShareIcon />}
                sx={{
                  borderRadius: 1,
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  boxShadow: '0 2px 8px rgba(156,39,176,0.10)',
                  textTransform: 'uppercase',
                  fontSize: '1rem',
                  letterSpacing: 0.5,
                  minWidth: 180,
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(156,39,176,0.18)',
                    background: (theme) => theme.palette.secondary.dark
                  }
                }}
              >
                Publish to Rental Sites
              </Button>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to={`/properties/edit/${property._id}`}
                sx={{
                  borderRadius: 1,
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  boxShadow: '0 2px 8px rgba(88,105,172,0.10)',
                  textTransform: 'uppercase',
                  fontSize: '1rem',
                  letterSpacing: 0.5,
                  minWidth: 180,
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(88,105,172,0.18)',
                    background: (theme) => theme.palette.primary.dark
                  }
                }}
              >
                Edit Property
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  setClickedButton('delete');
                  setTimeout(() => setClickedButton(null), 300);
                  onDelete(property._id);
                }}
                sx={{
                  borderRadius: 1,
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  boxShadow: '0 2px 8px rgba(211,47,47,0.10)',
                  textTransform: 'uppercase',
                  fontSize: '1rem',
                  letterSpacing: 0.5,
                  minWidth: 180,
                  backgroundColor: clickedButton === 'delete' ? 'rgba(211,47,47,0.15)' : undefined,
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(211,47,47,0.18)',
                    background: (theme) => theme.palette.error.dark
                  }
                }}
                startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
              >
                Delete Property
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 