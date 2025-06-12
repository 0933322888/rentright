import { useState } from 'react';
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
  Grid
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

export default function PropertyOverview({ 
  property, 
  onDelete, 
  onSubmit,
  clickedButton,
  setClickedButton 
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(new Set());

  const handleNextImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePrevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
      );
    }
  };

  const handleImageError = (docId, e) => {
    if (!failedImages.has(docId)) {
      setFailedImages(prev => new Set([...prev, docId]));
      e.target.src = 'https://via.placeholder.com/400x300';
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
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
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
                  : `http://localhost:5000/uploads/${property.images[currentImageIndex]}`)
                : 'https://via.placeholder.com/400x300'}
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
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold', fontSize: '2rem', color: 'text.primary' }}>
                {property.title}
              </Typography>
              <Chip 
                label={property.status} 
                color={getStatusColor(property.status)}
                size="small"
                sx={{ 
                  fontWeight: 'medium',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1, fontSize: '1.1rem' }}>
              {property.description}
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              mb: 2,
              '& > *': { flex: '1 1 auto' }
            }}>
              <Chip
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>}
                label={`$${property.price}/month`}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>}
                label={`${property.location.city}, ${property.location.state}`}
                variant="outlined"
                size="small"
              />
            </Box>

            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              mt: 'auto',
              pt: 2,
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
                fullWidth
                sx={{
                  borderRadius: 999,
                  boxShadow: '0 2px 8px rgba(25,118,210,0.10)',
                  transition: 'all 0.2s',
                  fontWeight: 600,
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(25,118,210,0.18)',
                    transform: 'scale(1.03)'
                  }
                }}
              >
                Edit
              </Button>
              {property.status === 'new' && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => onSubmit(property._id)}
                  startIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>}
                  fullWidth
                  sx={{
                    borderRadius: 999,
                    boxShadow: '0 2px 8px rgba(46,125,50,0.10)',
                    transition: 'all 0.2s',
                    fontWeight: 600,
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(46,125,50,0.18)',
                      transform: 'scale(1.03)'
                    }
                  }}
                >
                  Submit
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
                fullWidth
                sx={{
                  borderRadius: 999,
                  boxShadow: '0 2px 8px rgba(211,47,47,0.10)',
                  transition: 'all 0.2s, background-color 0.2s',
                  fontWeight: 600,
                  backgroundColor: clickedButton === 'delete' ? 'rgba(211,47,47,0.15)' : undefined,
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(211,47,47,0.18)',
                    transform: 'scale(1.03)'
                  }
                }}
              >
                Delete
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
} 