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
  DialogActions
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
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
    <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
      {/* Left side - Image */}
      <Box sx={{ flex: '0 0 auto', width: '1200px' }}>
        <Card sx={{ 
          height: '100%',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderRadius: 3,
          animation: 'fadeIn 0.7s',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(24px)' },
            to: { opacity: 1, transform: 'none' }
          },
          '&:hover': {
            transform: 'translateY(-4px) scale(1.01)',
            boxShadow: '0 8px 24px rgba(25,118,210,0.18)'
          }
        }}>
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="800"
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
                borderRadius: 3,
                height: '800px !important',
                width: '100% !important',
                objectFit: 'cover',
                objectPosition: 'center',
                transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                '&:hover': {
                  transform: 'scale(1.04)'
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
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
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
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
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
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    padding: '4px 8px',
                    borderRadius: '16px',
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
        </Card>
      </Box>

      {/* Right side - Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header with title and status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            {property.title}
          </Typography>
          <Chip 
            label={property.status} 
            color={getStatusColor(property.status)}
            size="medium"
            sx={{ 
              fontWeight: 'medium',
              '& .MuiChip-label': { px: 2 }
            }}
          />
        </Box>

        {/* Price and Location */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>}
            label={`$${property.price}/month`}
            variant="outlined"
            size="large"
            sx={{ fontSize: '1.1rem', fontWeight: 600 }}
          />
          <Chip
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>}
            label={`${property.location.city}, ${property.location.state}`}
            variant="outlined"
            size="large"
            sx={{ fontSize: '1.1rem', fontWeight: 600 }}
          />
          {property.availableFrom && (
            <Chip
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>}
              label={`Available: ${new Date(property.availableFrom).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}`}
              variant="outlined"
              size="large"
              sx={{ fontSize: '1.1rem', fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Full Address */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
            {property.location.street && `${property.location.street}, `}
            {property.location.city && `${property.location.city}, `}
            {property.location.state && `${property.location.state} `}
            {property.location.zipCode && property.location.zipCode}
          </Typography>
        </Box>

        {/* Property Status and Availability */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            label={property.available ? 'Available Now' : 'Not Available'}
            color={property.available ? 'success' : 'default'}
            variant="filled"
            size="medium"
            sx={{ fontWeight: 600 }}
          />
          {property.available && property.availableFrom && (
            <Typography variant="body2" color="text.secondary">
              Available from {new Date(property.availableFrom).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Typography>
          )}
        </Box>

        {/* Description */}
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
          {property.description}
        </Typography>

        {/* Property Features */}
        {property.features && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {property.features.bedrooms && (
              <Chip
                label={`${property.features.bedrooms} Bedrooms`}
                variant="outlined"
                size="medium"
              />
            )}
            {property.features.bathrooms && (
              <Chip
                label={`${property.features.bathrooms} Bathrooms`}
                variant="outlined"
                size="medium"
              />
            )}
            {property.features.squareFootage && (
              <Chip
                label={`${property.features.squareFootage} sq ft`}
                variant="outlined"
                size="medium"
              />
            )}
            {property.features.furnished && (
              <Chip
                label="Furnished"
                variant="outlined"
                size="medium"
                color="primary"
              />
            )}
            {property.features.parking && (
              <Chip
                label="Parking"
                variant="outlined"
                size="medium"
                color="primary"
              />
            )}
            {property.features.petsAllowed && (
              <Chip
                label="Pet Friendly"
                variant="outlined"
                size="medium"
                color="primary"
              />
            )}
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          mt: 'auto',
          pt: 3,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to={`/properties/edit/${property._id}`}
            startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>}
            sx={{
              borderRadius: 999,
              boxShadow: '0 2px 8px rgba(88,105,172,0.10)',
              transition: 'all 0.2s',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              '&:hover': {
                boxShadow: '0 4px 16px rgba(88,105,172,0.18)',
                transform: 'scale(1.03)'
              }
            }}
          >
            Edit Property
          </Button>
          {property.status === 'new' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => onSubmit(property._id)}
              startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>}
              sx={{
                borderRadius: 999,
                boxShadow: '0 2px 8px rgba(46,125,50,0.10)',
                transition: 'all 0.2s',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(46,125,50,0.18)',
                  transform: 'scale(1.03)'
                }
              }}
            >
              Submit for Approval
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setClickedButton('delete');
              setTimeout(() => setClickedButton(null), 300);
              onDelete(property._id);
            }}
            startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>}
            sx={{
              borderRadius: 999,
              boxShadow: '0 2px 8px rgba(211,47,47,0.10)',
              transition: 'all 0.2s, background-color 0.2s',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              backgroundColor: clickedButton === 'delete' ? 'rgba(211,47,47,0.15)' : undefined,
              '&:hover': {
                boxShadow: '0 4px 16px rgba(211,47,47,0.18)',
                transform: 'scale(1.03)'
              }
            }}
          >
            Delete Property
          </Button>
        </Box>
      </Box>
    </Box>
  );
} 