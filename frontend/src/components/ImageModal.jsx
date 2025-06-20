import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';

export default function ImageModal({ 
  open, 
  onClose, 
  images, 
  currentIndex, 
  onImageChange 
}) {
  if (!images || images.length === 0) return null;

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onImageChange(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onImageChange(newIndex);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'ArrowLeft') {
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      handleNext();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      onKeyDown={handleKeyDown}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white'
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', minHeight: '60vh' }}>
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            zIndex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                zIndex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)'
                }
              }}
            >
              <NavigateBeforeIcon />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                zIndex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)'
                }
              }}
            >
              <NavigateNextIcon />
            </IconButton>
          </>
        )}

        {/* Image display */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 2
          }}
        >
          <img
            src={`${import.meta.env.VITE_API_URL}${images[currentIndex]}`}
            alt={`Ticket image ${currentIndex + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: '4px'
            }}
          />
          
          {/* Image counter */}
          {images.length > 1 && (
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                px: 2,
                py: 1,
                borderRadius: 1
              }}
            >
              {currentIndex + 1} of {images.length}
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
} 