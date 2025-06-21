/**
 * Utility functions for handling images
 */

// Base64 encoded SVG for fallback image (gray background with "No Image" text)
const FALLBACK_IMAGE_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

/**
 * Get the full URL for an image
 * @param {string} imagePath - The image path or URL
 * @returns {string} The full URL for the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return FALLBACK_IMAGE_DATA_URL;
  }

  // If it's already a full URL (starts with http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // For S3 keys or relative paths, return as is (they should already be full URLs)
  return imagePath;
};

/**
 * Handle image loading errors
 * @param {Event} event - The error event
 * @param {string} fallbackUrl - Optional fallback URL (defaults to data URL)
 */
export const handleImageError = (event, fallbackUrl = FALLBACK_IMAGE_DATA_URL) => {
  console.log('Image failed to load:', event.target.src);
  event.target.src = fallbackUrl;
};

/**
 * Format image size in bytes to human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
export const formatImageSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate an image file
 * @param {File} file - The file to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validateImage = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message: 'Invalid file type. Only JPEG, PNG and GIF are allowed.'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      message: 'File size too large. Maximum size is 5MB.'
    };
  }

  return {
    isValid: true,
    message: 'File is valid'
  };
};

export const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return null;

  // If it's already a full URL (starts with http/https), return as is
  if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
    return profilePicture;
  }

  // For S3 keys or relative paths, return as is (they should already be full URLs)
  return profilePicture;
}; 